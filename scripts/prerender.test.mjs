// Minimal self-check for issue #63's HTML templating (title/meta/JSON-LD)
// and issue #64's sitemap.
// Run: node scripts/prerender.test.mjs
import assert from 'node:assert';
import { buildPlaceHtml, buildSitemap } from './prerender.mjs';

const template = '<html><head><title>Relieve</title></head><body></body></html>';
const place = {
  name: 'Monterrey',
  story: 'Rodeada por la Sierra Madre Oriental.',
  thumb_url: null,
  base_price_cents: 129900,
};

const html = buildPlaceHtml(template, place);

assert.ok(html.includes('<title>Monterrey — Relieve</title>'));
assert.ok(html.includes('Rodeada por la Sierra Madre Oriental'));
assert.ok(html.includes('"@type":"Product"'));
assert.ok(html.includes('"price":"1299.00"'));

const sitemap = buildSitemap('https://relieve.mx', ['/pieza/monterrey', '/coleccion/ciudades-mexico']);
assert.ok(sitemap.includes('<loc>https://relieve.mx/</loc>'));
assert.ok(sitemap.includes('<loc>https://relieve.mx/pieza/monterrey</loc>'));
assert.ok(sitemap.includes('<loc>https://relieve.mx/coleccion/ciudades-mexico</loc>'));
assert.ok(!sitemap.includes('/carrito'));
assert.ok(!sitemap.includes('/pedido/'));

console.log('prerender templating checks: OK');
