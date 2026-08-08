// Issue #28: signature verification. Issue #30: payment_intent.payment_failed
// and checkout.session.expired handling. Issue #29: order + order_items
// creation on checkout.session.completed, idempotent by stripe_session_id.

import crypto from 'node:crypto';
import Stripe from 'stripe';
import { supabase } from '../../lib/supabase.js';
import { calcUnitPriceCents } from '../../lib/pricing.js';
import { sendAlert, sendOrderPaidNotification, sendOrderConfirmation } from '../../lib/alerts.js';

export const config = { api: { bodyParser: false } };

// Same class of bug as api/checkout.js's guard (see its comment): with
// STRIPE_SECRET_KEY unset, `new Stripe(undefined)` throws synchronously at
// module load, which crashes this whole function on every invocation
// (raw Vercel FUNCTION_INVOCATION_FAILED, no usable error). This file
// never got the same fix when checkout.js did. Guard it here too.
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;

function generateOrderNumber() {
  return `RLV-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
}

// Mirrors api/checkout.js's encodeItemsMetadata — Stripe caps each metadata
// value at 500 chars, so items are split across items_0, items_1, ... there
// instead of one `items` key. Falls back to the old single-key shape for
// any session created before this fix (avoids silently losing items on
// in-flight sessions at deploy time).
function decodeItemsMetadata(metadata) {
  const chunkCount = Number(metadata?.items_chunks ?? 0);
  if (!chunkCount) return JSON.parse(metadata?.items ?? '[]');
  let json = '';
  for (let i = 0; i < chunkCount; i++) json += metadata[`items_${i}`] ?? '';
  return JSON.parse(json);
}

async function createOrderFromSession(session) {
  const { data: existing } = await supabase
    .from('orders')
    .select('id')
    .eq('stripe_session_id', session.id)
    .maybeSingle();
  if (existing) return; // already processed this session

  const items = decodeItemsMetadata(session.metadata);
  const is_gift = session.metadata?.is_gift === 'true';
  const gift_message = session.metadata?.gift_message || null;

  const pricedItems = await Promise.all(
    items.map(async (item) => {
      const addons = [];
      if (item.capelo) addons.push('capelo');
      if (item.plate_text) addons.push('placa');
      const unit_price_cents = await calcUnitPriceCents({
        size_code: item.size_code,
        frame_code: item.frame_code,
        addons,
      });

      // name selected here (not just id) so the order-notification emails
      // below don't need a second round-trip per item to show a real place
      // name instead of a slug — not persisted, order_items has no
      // place_name column (name comes from the places FK join at read time,
      // see api/catalog.js's getOrder).
      let place_id = null;
      let place_name = null;
      if (item.place_slug) {
        const { data: place } = await supabase
          .from('places')
          .select('id, name')
          .eq('slug', item.place_slug)
          .maybeSingle();
        place_id = place?.id ?? null;
        place_name = place?.name ?? null;
      }

      return { ...item, place_id, place_name, unit_price_cents };
    })
  );

  const subtotal_cents = pricedItems.reduce((sum, i) => sum + i.unit_price_cents * (i.qty || 1), 0);
  const shipping_cents = session.shipping_cost?.amount_total ?? 0;

  const { data: order, error } = await supabase
    .from('orders')
    .insert({
      number: generateOrderNumber(),
      email: session.customer_details?.email ?? session.customer_email,
      status: 'paid',
      subtotal_cents,
      shipping_cents,
      total_cents: subtotal_cents + shipping_cents,
      is_gift,
      gift_message,
      shipping_address: session.shipping_details?.address ?? null,
      stripe_session_id: session.id,
      status_token: crypto.randomBytes(16).toString('hex'),
    })
    .select('id, number, status_token')
    .single();

  if (error) throw error;

  await supabase.from('order_items').insert(
    pricedItems.map((item) => ({
      order_id: order.id,
      place_id: item.place_id,
      custom_place: item.custom_place ?? null,
      size_code: item.size_code,
      frame_code: item.frame_code,
      color_code: item.color_code ?? null,
      orientation: item.orientation ?? 'horizontal',
      plate_text: item.plate_text ?? null,
      memory_note: item.memory_note ?? null,
      capelo: !!item.capelo,
      unit_price_cents: item.unit_price_cents,
      qty: item.qty || 1,
    }))
  );

  const { error: cartError } = await supabase
    .from('carts')
    .update({ purchase_completed: true })
    .eq('stripe_session_id', session.id);
  if (cartError) console.error('[carts] failed to mark purchase_completed', cartError);

  // Handoff 8 ago 2026 sección 3.1/3.2 — Ale necesita la dirección +
  // descripción del pedido de inmediato para sacar la guía, y el cliente
  // espera una confirmación automática. Ambos correos son best-effort (un
  // fallo no debe tumbar el webhook — Stripe ya cobró y la orden ya existe
  // en Supabase, lo único en juego aquí es la notificación).
  const orderForEmail = {
    number: order.number,
    status_token: order.status_token,
    email: session.customer_details?.email ?? session.customer_email,
    subtotal_cents,
    shipping_cents,
    total_cents: subtotal_cents + shipping_cents,
    is_gift,
    gift_message,
  };
  const phone = session.customer_details?.phone || null;
  const address = session.shipping_details?.address ?? null;
  await Promise.allSettled([
    sendOrderPaidNotification(orderForEmail, pricedItems, { phone, address }),
    sendOrderConfirmation(orderForEmail, pricedItems),
  ]);

  if (process.env.N8N_WEBHOOK_URL) {
    await fetch(`${process.env.N8N_WEBHOOK_URL}/order-paid`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order_id: order.id, number: order.number }),
    }).catch((err) => {
      console.error('[n8n] order-paid webhook failed', err);
      sendAlert(`n8n order-paid failed for ${order.number}`, err.stack ?? err.message);
    });
  }
}

async function readRawBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res
      .status(405)
      .json({ error: { code: 'method_not_allowed', message: 'Use POST' } });
  }

  if (!stripe) {
    return res.status(503).json({
      error: { code: 'stripe_not_configured', message: 'Stripe webhook is not configured.' },
    });
  }

  const signature = req.headers['stripe-signature'];
  let event;

  try {
    const rawBody = await readRawBody(req);
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    // A wrong/rotated STRIPE_WEBHOOK_SECRET makes every single Stripe event
    // 400 here forever, silently, with nothing to distinguish it from actual
    // forged requests — issue #59 needs this in logs, not just in the
    // response body Stripe's dashboard shows but nobody here is watching.
    console.error('[stripe] webhook signature verification failed', err.message);
    sendAlert('Stripe webhook signature verification failed', err.message);
    return res
      .status(400)
      .json({ error: { code: 'invalid_signature', message: err.message } });
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      try {
        await createOrderFromSession(event.data.object);
      } catch (err) {
        console.error('[stripe] checkout.session.completed order creation failed', err);
        sendAlert(`Order creation failed for session ${event.data.object.id}`, err.stack ?? err.message);
        return res.status(500).json({ error: { code: 'order_creation_failed', message: err.message } });
      }
      break;
    }
    case 'payment_intent.payment_failed': {
      const pi = event.data.object;
      console.error('[stripe] payment_intent.payment_failed', {
        id: pi.id,
        last_payment_error: pi.last_payment_error?.message,
      });
      break;
    }
    case 'checkout.session.expired': {
      const session = event.data.object;
      console.warn('[stripe] checkout.session.expired', { id: session.id });
      break;
    }
    default:
      break;
  }

  return res.status(200).json({ received: true, type: event.type });
}
