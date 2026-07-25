# order-paid: CFDI + guía de envío — Implementation Plan

> Written autonomously overnight (2026-07-24) as part of backlog item [M6-4]. This is a **plan**, not importable n8n JSON like `checkout-abandonado`/`review-incentive`/`order-shipped` — see "Confidence levels" below for why, before building from this.

## Confidence levels — read this first

- **High confidence, safe to build as-is:** the trigger mechanism, the Postgres queries, the DB writes, idempotency, and the overall flow shape. All grounded in code already in this repo (`api/webhooks/stripe.js`, `docs/database.md`, `docs/decisions.md`).
- **Low confidence, must be verified against live docs before building:** the exact HTTP request/response shapes for Facturama's CFDI API and Envia.com's shipment API. I don't have sandbox access to either from this environment tonight, and I'm not confident enough in my memory of their exact current field names to hand you JSON that silently does the wrong thing if it's subtly wrong (a bad CFDI is a compliance problem, not just a bug). The request bodies below are my best reconstruction of each API's general shape — treat them as a starting point to check against `https://apisandbox.facturama.mx` / Facturama's Postman collection and Envia.com's current API docs, not as verified-correct.

## Trigger

Reuse the existing hook — `api/webhooks/stripe.js` already does, on every successful `checkout.session.completed`:
```js
if (process.env.N8N_WEBHOOK_URL) {
  await fetch(`${process.env.N8N_WEBHOOK_URL}/order-paid`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ order_id: order.id, number: order.number }),
  }).catch((err) => console.error('[n8n] order-paid webhook failed', err));
}
```
No code change needed — the workflow is an n8n **Webhook node**, path `order-paid`, method POST. This already fires today into a void since no workflow listens yet (the `.catch` swallows the failure silently, so nothing is currently broken by that — worth noting, not fixing here).

## Flow

```
Webhook (order-paid) {order_id, number}
  |
  v
Postgres: fetch order + items (see query below)
  |
  v
HTTP Request: Facturama — create CFDI (público en general, see caveat below)
  |
  v
Postgres: UPDATE orders SET cfdi_uuid = <facturama response id/uuid>
  |
  v
HTTP Request: Envia.com — create shipment / get tracking number + label
  |
  v
Postgres: UPDATE orders SET tracking_number = ..., status = 'in_production'
  |
  v
HTTP Request (Resend): order confirmation email
```

Each Postgres write should be its own step so a failure partway (e.g. CFDI succeeds, shipping API is down) doesn't lose the CFDI result — don't batch all three updates into one UPDATE at the end.

## Step 1 — fetch order + items

```sql
SELECT
  o.id, o.number, o.email, o.subtotal_cents, o.shipping_cents, o.total_cents,
  o.shipping_address,
  json_agg(json_build_object(
    'name', COALESCE(p.name, oi.custom_place),
    'size_code', oi.size_code,
    'frame_code', oi.frame_code,
    'qty', oi.qty,
    'unit_price_cents', oi.unit_price_cents
  )) AS items
FROM orders o
JOIN order_items oi ON oi.order_id = o.id
LEFT JOIN places p ON p.id = oi.place_id
WHERE o.id = {{ $json.body.order_id }}
GROUP BY o.id;
```

**Note on `shipping_address` shape:** `docs/database.md`'s comment (`{nombre, calle, ciudad, estado, cp, tel}`) is aspirational/stale — the actual webhook code (`api/webhooks/stripe.js`) stores Stripe's own `shipping_details.address` object verbatim: `{ line1, line2, city, state, postal_code, country }`, no name/phone (Stripe Checkout's shipping collection doesn't capture phone unless configured to). Build against the real shape, not the doc comment. If Envia.com's API needs a phone number, that's a gap — Checkout would need `phone_number_collection: { enabled: true }` added to `api/checkout.js`'s session config, which isn't there today.

## Step 2 — Facturama CFDI (⚠️ verify against live docs)

**Decision made here (no fiscal-data field exists in the schema, and nobody's awake to decide):** issue every CFDI as **"público en general"** — Mexico's standard practice for receipts where the customer didn't request a full invoice with their RFC/razón social. Uses the generic RFC `XAXX010101000`. This unblocks the whole flow without inventing new checkout UI/schema tonight. If Ale wants real per-customer fiscal invoices later, that's a separate, larger feature (checkout step for RFC/razón social/uso CFDI + a `orders.fiscal_data jsonb` column) — flag as a follow-up, don't build speculatively.

```
POST https://api.facturama.mx/api/2/cfdis
Auth: Basic (FACTURAMA_USER / FACTURAMA_PASSWORD)
Content-Type: application/json

{
  "Serie": "A",
  "CfdiType": "I",
  "PaymentForm": "99",
  "PaymentMethod": "PUE",
  "Currency": "MXN",
  "ExpeditionPlace": "<código postal del estudio>",
  "Receiver": {
    "Rfc": "XAXX010101000",
    "Name": "PUBLICO EN GENERAL",
    "CfdiUse": "S01",
    "FiscalRegime": "616",
    "TaxZipCode": "<código postal del estudio>"
  },
  "GlobalInformation": { "Periodicity": "01", "Months": "<mes actual, '01'-'12'>", "Year": <año actual> },
  "Items": [
    // one per order_items row, mapped from the `items` json_agg above —
    // needs a real SAT ProductCode/UnitCode (e.g. "propiedades del arte"
    // or similar craft/decor code) and IVA tax object per item, which I'm
    // not confident enough to fill in blind — check Facturama's docs for
    // the exact `Taxes` sub-object shape.
  ]
}
```
Response should include a UUID/folio fiscal — map that to `orders.cfdi_uuid`.

## Step 3 — Envia.com shipment (⚠️ verify against live docs)

```
POST https://api.envia.com/ship/generate/
Auth: Bearer <ENVIA_API_KEY>   // not yet in .env.example — add it there too
Content-Type: application/json

{
  "origin": { /* studio address — not in the schema anywhere; hardcode or add an env var */ },
  "destination": {
    "street": "{{ $json.shipping_address.line1 }}",
    "number": "",
    "district": "",
    "city": "{{ $json.shipping_address.city }}",
    "state": "{{ $json.shipping_address.state }}",
    "postalCode": "{{ $json.shipping_address.postal_code }}",
    "country": "{{ $json.shipping_address.country }}",
    "reference": "{{ $json.number }}"
  },
  "packages": [ /* dims/weight per size_code — no dimension data exists in `sizes` table yet, check docs/database.md */ ],
  "shipment": { "carrier": "auto", "type": 1 }
}
```
Response should include a tracking number (and often a label URL/PDF) — map tracking number to `orders.tracking_number`.

**Real gap found while writing this:** neither `sizes` (catalog dimensions table) nor anywhere else in the schema stores physical package weight/dimensions per size. Envia.com's API needs these to quote/generate a shipment. This blocks Step 3 more than the exact field names do — needs either a new `sizes.package_weight_kg`/`package_dims_cm` set of columns, or a hardcoded lookup table in the workflow if the size matrix is small and stable (probably fine short-term — there are presumably only a handful of `size_code` values).

## Step 4 — confirmation email (Resend)

Same pattern as `checkout-abandonado`/`review-incentive`/`order-shipped` tonight — HTTP Request node, `from: contacto@relieve.design`, `to: {{ $json.email }}`, boarding-pass-style copy per `docs/api.md`'s existing description of this email. High confidence, straightforward to build once Steps 2-3 land.

## Env vars / credentials needed

- `FACTURAMA_USER` / `FACTURAMA_PASSWORD` — already in `.env.example`, needs an n8n "Facturama" (HTTP Basic Auth) credential.
- `ENVIA_API_KEY` — **not yet in `.env.example`, add it** — needs an n8n "Envia API Key" (HTTP Header/Bearer Auth) credential.
- Reuses "Supabase Postgres" and "Resend API Key" credentials already set up tonight.

## Recommended build order

1. Resolve the two real gaps first (package dimensions per size, studio origin address/postal code) — these block Step 3 regardless of exact API field names.
2. Build Step 1 + Step 4 (confirmation email) alone first and ship it — gets *something* useful live (order confirmation) without being blocked on CFDI/shipping API verification.
3. Verify Facturama's exact request shape against sandbox, build Step 2.
4. Verify Envia.com's exact request shape, build Step 3.
5. Wire the whole chain together, test end-to-end in Stripe test mode + Facturama sandbox before going live.
