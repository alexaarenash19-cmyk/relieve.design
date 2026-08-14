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

// Fix (13 ago 2026, reporte consolidado F2/paleta): los links "Ver estado
// del pedido"/"Ver el catálogo" abajo tenían #22405C (el azul viejo de
// --color-brand-dark) hardcodeado — igual que el bug de .pill-glass-active
// en src/index.css, el rediseño a Sceptre Red (PR #205) nunca tocó estos
// dos correos porque no son CSS, no heredan de --color-brand-dark
// automáticamente. Ahora usan #4D0E12 a mano (el hex actual de
// --color-brand-dark en modo claro — los correos no soportan prefers-
// color-scheme de forma confiable, así que siempre usan el valor claro).

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

// Hallazgo #5 (auditoría 10 ago 2026): memory_note/custom_place/gift_message
// come straight from the client (POST /api/checkout) and were interpolated
// unescaped into these three HTML emails — one goes to a real customer
// under the Relieve brand, so unescaped markup here is a phishing vector,
// not just a cosmetic bug. Applied to every value below that a customer
// typed at checkout (email/phone/address included — those are just as
// client-controlled as the free-text fields the audit named), not to
// values we generate ourselves (order.number, status_token, money()).
function escapeHtml(value) {
  if (value == null) return '';
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

// Sección 3.1 — a Ale, apenas se paga: todo lo que necesita para sacar la
// guía (contacto, dirección, piezas), no un resumen genérico.
export async function sendOrderPaidNotification(order, items, { phone, address } = {}) {
  const addr = address
    ? [address.line1, address.line2, address.city, address.state, address.postal_code, address.country]
        .filter(Boolean)
        .map(escapeHtml)
        .join(', ')
    : 'Sin dirección de envío en la sesión de Stripe';

  // docs/superpowers/specs/2026-08-13-personaliza-checkout-design.md sección 4
  // — "lo mínimo que Ale necesita ver para saber qué terreno tallar". lat/lng
  // son números que ya generamos nosotros (Google Elevation/Maps API), no
  // texto libre del cliente — no necesitan escapeHtml, a diferencia de
  // formatted_address (ese sí viene de la respuesta de Google Places, pero
  // se trata igual de conservador que cualquier otro campo de esta lista).
  const locationLine = (i) =>
    i.custom_location
      ? `<br><a href="https://www.google.com/maps?q=${i.custom_location.latitude},${i.custom_location.longitude}">${escapeHtml(i.custom_location.formatted_address)} (${i.custom_location.latitude}, ${i.custom_location.longitude})</a>`
      : '';

  const rows = items
    .map(
      (i) => `
    <tr>
      <td style="padding:6px 0;border-bottom:1px dashed #C8C3BC;">${escapeHtml(i.place_name ?? i.custom_place)} · ${escapeHtml(i.size_code)} · ${escapeHtml(i.frame_code)}${i.color_code ? ' · ' + escapeHtml(i.color_code) : ''}${i.qty > 1 ? ' ×' + i.qty : ''}${locationLine(i)}${i.memory_note ? `<br><span style="font-style:italic;">"${escapeHtml(i.memory_note)}"</span>` : ''}</td>
      <td style="padding:6px 0;border-bottom:1px dashed #C8C3BC;text-align:right;">${money(i.unit_price_cents * i.qty)}</td>
    </tr>`,
    )
    .join('');

  const html = `
    <div style="font-family:Arial,sans-serif;font-size:14px;color:#232323;">
      <h2 style="margin:0 0 12px;">Nuevo pedido pagado — ${order.number}</h2>
      <p><strong>Cliente:</strong> ${escapeHtml(order.email)}${phone ? ' · ' + escapeHtml(phone) : ' · (sin teléfono)'}</p>
      <p><strong>Dirección de envío:</strong> ${addr}</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;">${rows}</table>
      <p>Subtotal: ${money(order.subtotal_cents)} · Envío: ${money(order.shipping_cents)} · <strong>Total: ${money(order.total_cents)}</strong></p>
      ${order.is_gift ? `<p><em>Es un regalo${order.gift_message ? ': "' + escapeHtml(order.gift_message) + '"' : ''}</em></p>` : ''}
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
      <td style="padding:8px 0;border-bottom:1px dashed #C8C3BC;">${escapeHtml(i.place_name ?? i.custom_place)} · ${escapeHtml(i.size_code)} · ${escapeHtml(i.frame_code)}${i.qty > 1 ? ' ×' + i.qty : ''}${i.memory_note ? `<br><span style="font-style:italic;color:#7A5A43;">"${escapeHtml(i.memory_note)}"</span>` : ''}</td>
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
      <p style="margin-top:24px;"><a href="${SITE_URL}/pedido/${order.status_token}" style="font-family:'Courier New',monospace;font-size:12px;letter-spacing:0.06em;text-transform:uppercase;color:#4D0E12;">Ver estado del pedido →</a></p>
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

// brand-brief.md sección 8 + §16 decisión 9 — bienvenida a "Curva de
// Nivel" (POST /api/curva-de-nivel, api/catalog.js's postCurvaDeNivel).
// Mismo patrón que sendOrderConfirmation/sendShippingNotice arriba —
// Resend directo, no n8n (ver la nota al inicio de este archivo: los
// workflows de n8n nunca se conectaron a una instancia en vivo). Copy
// tomado tal cual de CurvaDeNivel.jsx (encabezado + los 3 BENEFITS reales
// que ya se muestran en el sitio), no inventado aparte. `email` solo se
// usa como destinatario (parámetro `to` de la API de Resend), nunca
// interpolado dentro del HTML — a diferencia de memory_note/gift_message
// en sendOrderConfirmation, no necesita escapeHtml.
export async function sendCurvaDeNivelWelcome(email) {
  const html = `
    <div style="max-width:480px;margin:0 auto;font-family:Georgia,serif;color:#232323;background:#F6F3ED;padding:32px 28px;border:1px solid #DCD5C8;">
      <p style="font-family:'Courier New',monospace;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#7A5A43;margin:0 0 6px;">Curva de Nivel · Confirmado</p>
      <h1 style="font-weight:300;font-size:28px;margin:0 0 20px;">relieve</h1>
      <h2 style="font-weight:300;font-size:20px;margin:0 0 12px;font-family:Georgia,serif;">Ya eres parte de la Curva de Nivel.</h2>
      <p style="font-family:Arial,sans-serif;font-size:14px;margin:0 0 16px;">Antes de que una ciudad nueva llegue a todos, llega primero a la Curva de Nivel.</p>
      <ul style="font-family:'Courier New',monospace;font-size:11px;letter-spacing:0.06em;text-transform:uppercase;color:#4A4A4A;margin:0 0 20px;padding:0;list-style:none;">
        <li style="margin-bottom:4px;">— Acceso anticipado a nuevas ciudades</li>
        <li style="margin-bottom:4px;">— Ediciones especiales antes que nadie</li>
        <li>— Descuento en tu segunda pieza</li>
      </ul>
      <p style="margin-top:24px;"><a href="${SITE_URL}/colecciones" style="font-family:'Courier New',monospace;font-size:12px;letter-spacing:0.06em;text-transform:uppercase;color:#4D0E12;">Ver el catálogo →</a></p>
    </div>`;

  await resendSend({ to: email, subject: 'Ya eres parte de la Curva de Nivel', html });
}

// F1/C6 (reporte consolidado de bugs, 13 ago 2026) — /personaliza: a Ale,
// apenas alguien pide un lugar que no está en el catálogo. A diferencia de
// sendCurvaDeNivelWelcome (confirmación al cliente), esto va a INTERNAL_TO
// como sendOrderPaidNotification arriba — es un lead que Ale revisa a mano
// para decidir si es fabricable ("te avisamos si es posible fabricarlo",
// copy de Personalize.jsx), no un correo transaccional al cliente. name/
// email/location/notes son todos texto libre del cliente (POST /api/
// personaliza) — mismo tratamiento de escapeHtml que memory_note/
// gift_message en sendOrderPaidNotification (Hallazgo #5, auditoría 10 ago
// 2026): un correo bajo la marca Relieve con HTML sin escapar de un campo
// de cliente es vector de phishing, no solo cosmético.
export async function sendPersonalizeRequestNotification({ name, email, location, notes }) {
  const html = `
    <div style="font-family:Arial,sans-serif;font-size:14px;color:#232323;">
      <h2 style="margin:0 0 12px;">Nueva solicitud de personalización</h2>
      <p><strong>Nombre:</strong> ${escapeHtml(name)}</p>
      <p><strong>Correo:</strong> ${escapeHtml(email)}</p>
      <p><strong>Ubicación deseada:</strong> ${escapeHtml(location)}</p>
      ${notes ? `<p><strong>Notas:</strong> ${escapeHtml(notes)}</p>` : ''}
    </div>`;

  await resendSend({ to: INTERNAL_TO, subject: `Solicitud de personalización — ${location}`, html });
}
