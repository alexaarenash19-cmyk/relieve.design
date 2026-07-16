// Issue #63 — postbuild step: one static, indexable HTML file per place under
// dist/pieza/<slug>/, with real <title>/<meta description> and Product
// structured data. Vercel serves static files before SPA rewrites apply, so
// crawlers hit real content while the client bundle still hydrates and takes
// over normally. Skips quietly if Supabase env vars aren't set (e.g. local
// builds without secrets) instead of failing the whole build.
import fs from 'node:fs/promises';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

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

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    console.log('[prerender] SUPABASE_URL/SUPABASE_SERVICE_KEY not set, skipping place prerender.');
    return;
  }

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  const { data: places, error } = await supabase
    .from('places')
    .select('slug, name, story, thumb_url, base_price_cents, type');

  if (error) {
    console.error('[prerender] failed to fetch places, skipping:', error.message);
    return;
  }

  const template = await fs.readFile(path.join(DIST, 'index.html'), 'utf8');

  for (const place of places) {
    const html = buildPlaceHtml(template, place);
    const outDir = path.join(DIST, 'pieza', place.slug);
    await fs.mkdir(outDir, { recursive: true });
    await fs.writeFile(path.join(outDir, 'index.html'), html);
  }

  console.log(`[prerender] wrote ${places.length} place page(s).`);
}

await main();
