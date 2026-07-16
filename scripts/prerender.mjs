// Issue #63 — postbuild step: one static, indexable HTML file per place under
// dist/pieza/<slug>/, with real <title>/<meta description> and Product
// structured data. Vercel serves static files before SPA rewrites apply, so
// crawlers hit real content while the client bundle still hydrates and takes
// over normally. Skips quietly if Supabase env vars aren't set (e.g. local
// builds without secrets) instead of failing the whole build.
import fs from 'node:fs/promises';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

// Issue #64 — sitemap.xml covering all indexable routes.
// /carrito and /pedido/:token are excluded: transactional/private, no
// indexable content of their own.
const STATIC_ROUTES = ['/', '/personaliza', '/buscar', '/sobre', '/envios', '/faq', '/aviso-privacidad', '/terminos'];

export function buildSitemap(siteUrl, dynamicPaths = []) {
  const urls = [...STATIC_ROUTES, ...dynamicPaths]
    .map((p) => `  <url><loc>${siteUrl}${p}</loc></url>`)
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

export function buildPlaceHtml(template, place) {
  const title = `${place.name} — Relieve`;
  const description =
    place.story?.slice(0, 155) ?? `Mapa en relieve de ${place.name}, enmarcado en nogal.`;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: `Relieve · ${place.name}`,
    description,
    image: place.thumb_url ?? undefined,
    offers: {
      '@type': 'Offer',
      priceCurrency: 'MXN',
      price: (place.base_price_cents / 100).toFixed(2),
      availability: 'https://schema.org/InStock',
    },
  };

  return template
    .replace(/<title>.*?<\/title>/, `<title>${title}</title>`)
    .replace(
      '</head>',
      `  <meta name="description" content="${description.replace(/"/g, '&quot;')}" />\n` +
        `  <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>\n` +
        `</head>`
    );
}

async function main() {
  const DIST = path.resolve(import.meta.dirname, '..', 'dist');
  const siteUrl = process.env.SITE_URL || 'http://localhost:5173';

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    await fs.writeFile(path.join(DIST, 'sitemap.xml'), buildSitemap(siteUrl));
    console.log('[prerender] SUPABASE_URL/SUPABASE_SERVICE_KEY not set, wrote static-only sitemap, skipping place prerender.');
    return;
  }

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  const [{ data: places, error: placesError }, { data: collections, error: collectionsError }] = await Promise.all([
    supabase.from('places').select('slug, name, story, thumb_url, base_price_cents, type'),
    supabase.from('collections').select('slug'),
  ]);

  if (placesError || collectionsError) {
    console.error('[prerender] failed to fetch catalog, skipping:', (placesError ?? collectionsError).message);
    await fs.writeFile(path.join(DIST, 'sitemap.xml'), buildSitemap(siteUrl));
    return;
  }

  const template = await fs.readFile(path.join(DIST, 'index.html'), 'utf8');

  for (const place of places) {
    const html = buildPlaceHtml(template, place);
    const outDir = path.join(DIST, 'pieza', place.slug);
    await fs.mkdir(outDir, { recursive: true });
    await fs.writeFile(path.join(outDir, 'index.html'), html);
  }

  const dynamicPaths = [
    ...places.map((p) => `/pieza/${p.slug}`),
    ...collections.map((c) => `/coleccion/${c.slug}`),
  ];
  await fs.writeFile(path.join(DIST, 'sitemap.xml'), buildSitemap(siteUrl, dynamicPaths));

  console.log(`[prerender] wrote ${places.length} place page(s) and sitemap.xml.`);
}

await main();
