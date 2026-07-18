// Minimal self-check for issue #63's HTML templating (title/meta/OG/JSON-LD)
// and issue #64's sitemap.
// Run: node scripts/prerender.test.mjs
import assert from 'node:assert';
import { buildPlaceHtml, buildStaticPageHtml, buildSitemap } from './prerender.mjs';

const template = [
  '<html><head>',
  '<title>Relieve</title>',
  '<meta name="description" content="default" />',
  '<meta property="og:title" content="default" />',
  '</head><body></body></html>',
].join('\n');

const place = {
  slug: 'monterrey',
  name: 'Monterrey',
  story: 'Rodeada por la Sierra Madre Oriental.',
  thumb_url: 'https://images.unsplash.com/photo-abc',
  base_price_cents: 129900,
};

const html = buildPlaceHtml(template, place, 'https://relieve.mx');

assert.ok(html.includes('<title>Monterrey — Mapa en relieve | Relieve</title>'));
assert.ok(html.includes('Rodeada por la Sierra Madre Oriental'));
assert.ok(html.includes('"@type":"Product"'));
assert.ok(html.includes('"price":"1299.00"'));
assert.ok(html.includes('property="og:image" content="https://images.unsplash.com/photo-abc"'));
assert.ok(html.includes('name="twitter:card" content="summary_large_image"'));
assert.ok(html.includes('rel="canonical" href="https://relieve.mx/pieza/monterrey"'));
// The template's own default meta tags aren't left duplicated alongside
// the per-place ones.
assert.strictEqual((html.match(/name="description"/g) ?? []).length, 1);
assert.strictEqual((html.match(/property="og:title"/g) ?? []).length, 1);

const staticHtml = buildStaticPageHtml(
  template,
  '/sobre',
  { title: 'Sobre Relieve', description: 'Cómo hacemos cada pieza.' },
  'https://relieve.mx'
);
assert.ok(staticHtml.includes('<title>Sobre Relieve</title>'));
assert.ok(staticHtml.includes('rel="canonical" href="https://relieve.mx/sobre"'));

const sitemap = buildSitemap('https://relieve.mx', ['/pieza/monterrey', '/coleccion/montana']);
assert.ok(sitemap.includes('<loc>https://relieve.mx/</loc>'));
assert.ok(sitemap.includes('<loc>https://relieve.mx/pieza/monterrey</loc>'));
assert.ok(sitemap.includes('<loc>https://relieve.mx/coleccion/montana</loc>'));
assert.ok(!sitemap.includes('/carrito'));
assert.ok(!sitemap.includes('/pedido/'));

console.log('prerender templating checks: OK');
