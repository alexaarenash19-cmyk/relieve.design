// Hallazgo #5 (auditoría 10 ago 2026) — memory_note/custom_place/gift_message
// (and email/phone/address) come straight from the client and must never
// reach the transactional emails as raw HTML. Run: node tests/alerts.test.mjs
import assert from 'node:assert';

process.env.RESEND_API_KEY = 'dummy_resend_key';

const sentEmails = [];
const realFetch = globalThis.fetch;
globalThis.fetch = async (input, init = {}) => {
  const url = typeof input === 'string' ? input : input.url;
  if (url.startsWith('https://api.resend.com/')) {
    sentEmails.push(JSON.parse(init.body));
    return new Response(JSON.stringify({ id: 'email_test' }), { status: 200 });
  }
  return realFetch(input, init);
};

const { sendOrderPaidNotification, sendOrderConfirmation } = await import('../lib/alerts.js');

const XSS = '<script>alert(1)</script>';
const order = {
  number: 'RLV-2026-000001',
  email: `cliente${XSS}@example.com`,
  status_token: 'tok123',
  subtotal_cents: 129900,
  shipping_cents: 0,
  total_cents: 129900,
  is_gift: true,
  gift_message: XSS,
};
const items = [
  {
    custom_place: XSS,
    size_code: 'chico',
    frame_code: 'parota',
    qty: 1,
    unit_price_cents: 129900,
    memory_note: XSS,
  },
];

// 1. Internal "pedido pagado" notification to Ale.
{
  sentEmails.length = 0;
  await sendOrderPaidNotification(order, items, { phone: XSS, address: { line1: XSS, city: 'CDMX' } });
  assert.strictEqual(sentEmails.length, 1);
  const html = sentEmails[0].html;
  assert.ok(!html.includes('<script>'), `raw <script> leaked into sendOrderPaidNotification html:\n${html}`);
  assert.ok(html.includes('&lt;script&gt;'), 'expected the XSS payload to appear escaped');
}

// 2. Customer-facing "pedido confirmado" email.
{
  sentEmails.length = 0;
  await sendOrderConfirmation(order, items);
  assert.strictEqual(sentEmails.length, 1);
  const html = sentEmails[0].html;
  assert.ok(!html.includes('<script>'), `raw <script> leaked into sendOrderConfirmation html:\n${html}`);
  assert.ok(html.includes('&lt;script&gt;'), 'expected the XSS payload to appear escaped');
}

// 3. docs/superpowers/specs/2026-08-13-personaliza-checkout-design.md —
// un item personalizado incluye un link a Maps + coordenadas en el correo
// interno a Ale, con el mismo tratamiento de escapeHtml que cualquier otro
// campo de texto libre del cliente.
{
  sentEmails.length = 0;
  const personalizedItems = [
    {
      custom_place: XSS,
      custom_location: {
        formatted_address: XSS,
        latitude: 19.4326,
        longitude: -99.1332,
      },
      size_code: 'mediano',
      frame_code: 'parota',
      qty: 1,
      unit_price_cents: 149385,
    },
  ];
  await sendOrderPaidNotification(order, personalizedItems, {});
  const html = sentEmails[0].html;
  assert.ok(!html.includes('<script>'), `raw <script> leaked via custom_location.formatted_address:\n${html}`);
  assert.ok(html.includes('19.4326') && html.includes('-99.1332'), 'expected coordinates in the email');
  assert.ok(html.includes('google.com/maps'), 'expected a Google Maps link');
}

globalThis.fetch = realFetch;
console.log('alerts HTML-escaping checks: OK');
