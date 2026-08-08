// Issue #60 — alerting on webhook/order-creation/n8n failures, plus the
// three transactional emails from the handoff 8 ago 2026 sección 3: order
// notification to Ale, purchase confirmation to the customer, and shipping
// notice once Ale enters a tracking number. All go through Resend's HTTP
// API directly (no SDK for a handful of call sites) — the n8n workflows in
// n8n/workflows/order-paid-confirmation.json and order-shipped.json cover
// the same ground but were never wired to a live n8n instance ("dispara y
// nadie contesta" — Ale's audit), so the confirmation/shipping copy is
// ported here verbatim instead of depending on them. The internal-alert
// silent-no-op-when-unconfigured pattern is unchanged for sendAlert.
const FROM = 'Relieve <contacto@relieve.design>';
const INTERNAL_TO = 'contacto@relieve.design';
const SITE_URL = process.env.SITE_URL || 'https://relieve.design';

async function resendSend({ to, subject, html }) {
  if (!process.env.RESEND_API_KEY) return;
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: FROM, to, subject, html }),
    });
  } catch (err) {
    console.error('[email] failed to send:', subject, err);
  }
}

export async function sendAlert(subject, detail) {
  if (!process.env.ALERT_EMAIL) return;
  await resendSend({
    to: process.env.ALERT_EMAIL,
    subject: `[Relieve] ${subject}`,
    html: `<pre>${String(detail).slice(0, 4000)}</pre>`,
  });
}

const money = (cents) => '$' + (cents / 100).toLocaleString('es-MX', { minimumFractionDigits: 2 }) + ' MXN';

// Sección 3.1 — a Ale, apenas se paga: todo lo que necesita para sacar la
// guía (contacto, dirección, piezas), no un resumen genérico.
export async function sendOrderPaidNotification(order, items, { phone, address } = {}) {
  const addr = address
    ? [address.line1, address.line2, address.city, address.state, address.postal_code, address.country]
        .filter(Boolean)
        .join(', ')
    : 'Sin dirección de envío en la sesión de Stripe';

  const rows = items
    .map(
      (i) => `
    <tr>
      <td style="padding:6px 0;border-bottom:1px dashed #C8C3BC;">${i.place_name ?? i.custom_place} · ${i.size_code} · ${i.frame_code}${i.color_code ? ' · ' + i.color_code : ''}${i.qty > 1 ? ' ×' + i.qty : ''}${i.memory_note ? `<br><span style="font-style:italic;">"${i.memory_note}"</span>` : ''}</td>
      <td style="padding:6px 0;border-bottom:1px dashed #C8C3BC;text-align:right;">${money(i.unit_price_cents * i.qty)}</td>
    </tr>`,
    )
    .join('');

  const html = `
    <div style="font-family:Arial,sans-serif;font-size:14px;color:#232323;">
      <h2 style="margin:0 0 12px;">Nuevo pedido pagado — ${order.number}</h2>
      <p><strong>Cliente:</strong> ${order.email}${phone ? ' · ' + phone : ' · (sin teléfono)'}</p>
      <p><strong>Dirección de envío:</strong> ${addr}</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;">${rows}</table>
      <p>Subtotal: ${money(order.subtotal_cents)} · Envío: ${money(order.shipping_cents)} · <strong>Total: ${money(order.total_cents)}</strong></p>
      ${order.is_gift ? `<p><em>Es un regalo${order.gift_message ? ': "' + order.gift_message + '"' : ''}</em></p>` : ''}
    </div>`;

  await resendSend({ to: INTERNAL_TO, subject: `Nuevo pedido pagado — ${order.number}`, html });
}

// Sección 3.2 — al cliente, tono "pase de abordar". Copy y estilo tomados
// tal cual de n8n/workflows/order-paid-confirmation.json (ver nota arriba).
export async function sendOrderConfirmation(order, items) {
  const rows = items
    .map(
      (i) => `
    <tr>
      <td style="padding:8px 0;border-bottom:1px dashed #C8C3BC;">${i.place_name ?? i.custom_place} · ${i.size_code} · ${i.frame_code}${i.qty > 1 ? ' ×' + i.qty : ''}${i.memory_note ? `<br><span style="font-style:italic;color:#7A5A43;">"${i.memory_note}"</span>` : ''}</td>
      <td style="padding:8px 0;border-bottom:1px dashed #C8C3BC;text-align:right;font-family:'Courier New',monospace;">${money(i.unit_price_cents * i.qty)}</td>
    </tr>`,
    )
    .join('');

  const html = `
    <div style="max-width:520px;margin:0 auto;font-family:Georgia,serif;color:#232323;background:#F6F3ED;padding:32px 28px;border:1px solid #DCD5C8;">
      <p style="font-family:'Courier New',monospace;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#7A5A43;margin:0 0 6px;">Pase de abordar · Pedido confirmado</p>
      <h1 style="font-weight:300;font-size:28px;margin:0 0 20px;">relieve</h1>
      <table style="width:100%;border-collapse:collapse;font-family:Arial,sans-serif;font-size:14px;margin-bottom:16px;">${rows}</table>
      <table style="width:100%;font-family:'Courier New',monospace;font-size:12px;margin-bottom:24px;">
        <tr><td>Subtotal</td><td style="text-align:right;">${money(order.subtotal_cents)}</td></tr>
        <tr><td>Envío</td><td style="text-align:right;">${money(order.shipping_cents)}</td></tr>
        <tr><td style="font-weight:bold;padding-top:6px;">Total</td><td style="text-align:right;font-weight:bold;padding-top:6px;">${money(order.total_cents)}</td></tr>
      </table>
      <h2 style="font-weight:300;font-size:20px;margin:24px 0 12px;font-family:Georgia,serif;">Tu pieza empieza a existir ahora.</h2>
      <p style="font-family:Arial,sans-serif;font-size:14px;margin:0 0 12px;">Esto es lo que va a pasar en las próximas semanas: encargamos y preparamos tu marco, tallamos tu lugar con precisión cartográfica, lo montamos y lo empacamos como parte de la pieza — no como contenedor. Te avisamos en cada paso.</p>
      <ol style="font-family:Arial,sans-serif;font-size:13px;color:#4A4A4A;margin:0 0 16px;padding-left:20px;">
        <li>Preparamos tu marco</li>
        <li>Tallamos tu lugar con precisión cartográfica</li>
        <li>Montamos y empacamos tu pieza</li>
      </ol>
      <p style="font-family:Arial,sans-serif;font-size:14px;font-style:italic;margin:0 0 4px;">Gracias por confiar en un objeto que no existía hasta que lo pediste.</p>
      <p style="margin-top:24px;"><a href="${SITE_URL}/pedido/${order.status_token}" style="font-family:'Courier New',monospace;font-size:12px;letter-spacing:0.06em;text-transform:uppercase;color:#22405C;">Ver estado del pedido →</a></p>
    </div>`;

  await resendSend({ to: order.email, subject: `Pedido confirmado — ${order.number}`, html });
}

// Sección 3.3 — al cliente, cuando Ale marca el pedido como enviado con un
// número de guía (PATCH /api/admin/orders/:id). Copy tomado tal cual de
// n8n/workflows/order-shipped.json.
export async function sendShippingNotice(order) {
  const html = `<p>Tu pedido ${order.number} ya salió. Número de rastreo: ${order.tracking_number}</p><p>Consulta el estado completo: ${SITE_URL}/pedido/${order.status_token}</p>`;
  await resendSend({ to: order.email, subject: `Tu pieza va en camino — pedido ${order.number}`, html });
}
