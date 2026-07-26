// Issue #63 — postbuild step: one static, indexable HTML file per place
// under dist/pieza/<slug>/, with real <title>/meta description/OG/Twitter
// tags and Product structured data. Vercel serves static files before SPA
// rewrites apply, so crawlers (including link-preview bots like WhatsApp's,
// which don't execute JS) hit real content while the client bundle still
// hydrates and takes over normally for real visitors.
//
// Falls back to the same dummy catalog the API uses (lib/dummyCatalog.js)
// when Supabase isn't connected, instead of skipping prerender entirely —
// otherwise every crawler/share-link hit the generic index.html fallback
// with no per-piece title, description, or image.
import fs from 'node:fs/promises';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { CATEGORIES } from '../src/lib/categories.js';
import { DUMMY_PLACES } from '../lib/dummyCatalog.js';

// Real bug found while testing this: SITE_URL was never actually set as a
// Vercel env var, so the deployed sitemap.xml/canonical URLs have been
// pointing at http://localhost:5173 since prerender existed. Vercel sets
// VERCEL_PROJECT_PRODUCTION_URL (prod deploys) / VERCEL_URL (all deploys)
// automatically — no dashboard config needed — so prefer those over the
// localhost fallback, which now only applies to actual local dev builds.
const AUTO_SITE_URL =
  process.env.SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL && `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`) ||
  (process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`) ||
  'http://localhost:5173';

// Issue #64 — sitemap.xml covering all indexable routes.
// /carrito (a drawer, not a route) and /pedido/:token are excluded:
// transactional/private, no indexable content of their own.
const STATIC_ROUTES = ['/', '/personaliza', '/buscar', '/sobre', '/envios', '/faq', '/aviso-privacidad', '/terminos', '/colecciones'];

// Unique <title>/description per static route, per request — not the
// generic site-wide default repeated everywhere.
const STATIC_PAGES = {
  '/sobre': {
    title: 'Sobre Relieve — Mapas en relieve hechos a mano',
    description: 'Cómo hacemos cada pieza: datos de elevación reales, impresión 3D, marco de parota armado a mano. Sin coordenadas inventadas.',
  },
  '/buscar': {
    title: 'Buscar un lugar — Relieve',
    description: 'Encuentra tu ciudad, montaña, estadio o circuito favorito entre las piezas disponibles en Relieve.',
  },
  '/colecciones': {
    title: 'Colecciones — Relieve',
    description: 'Todos los mapas en relieve de Relieve, o explóralos por categoría: ciudades, montañas, estadios y circuitos de México.',
  },
};

function metaTags({ title, description, image, canonicalUrl, type = 'website' }) {
  const esc = (s) => s.replace(/"/g, '&quot;');
  const lines = [
    `  <meta name="description" content="${esc(description)}" />`,
    `  <link rel="canonical" href="${canonicalUrl}" />`,
    `  <meta property="og:title" content="${esc(title)}" />`,
    `  <meta property="og:description" content="${esc(description)}" />`,
    `  <meta property="og:type" content="${type}" />`,
    `  <meta property="og:url" content="${canonicalUrl}" />`,
    `  <meta name="twitter:title" content="${esc(title)}" />`,
    `  <meta name="twitter:description" content="${esc(description)}" />`,
  ];
  if (image) {
    lines.push(`  <meta property="og:image" content="${image}" />`);
    lines.push(`  <meta name="twitter:card" content="summary_large_image" />`);
    lines.push(`  <meta name="twitter:image" content="${image}" />`);
  } else {
    lines.push(`  <meta name="twitter:card" content="summary" />`);
  }
  return lines.join('\n');
}

// Strips the base template's own default title/description/OG/canonical
// tags so a per-page replacement doesn't end up duplicated alongside them.
function stripDefaultMeta(template) {
  return template
    .replace(/\n\s*<meta name="description"[^>]*\/>/, '')
    .replace(/\n\s*<meta property="og:[^>]*\/>/g, '')
    .replace(/\n\s*<meta name="twitter:[^>]*\/>/g, '')
    .replace(/\n\s*<link rel="canonical"[^>]*\/>/, '');
}

export function buildSitemap(siteUrl, dynamicPaths = []) {
  const urls = [...STATIC_ROUTES, ...dynamicPaths]
    .map((p) => `  <url><loc>${siteUrl}${p}</loc></url>`)
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

export function buildPlaceHtml(template, place, siteUrl = AUTO_SITE_URL) {
  const title = `${place.name} — Mapa en relieve | Relieve`;
  const description =
    place.story?.slice(0, 155) ?? `Mapa en relieve de ${place.name}, enmarcado en nogal.`;
  const canonicalUrl = `${siteUrl}/pieza/${place.slug}`;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: `Relieve · ${place.name}`,
    description,
    image: place.thumb_url ?? undefined,
    offers: {
      '@type': 'Offer',
      priceCurrency: 'MXN',
      price: ((place.base_price_cents ?? place.base_price) / 100).toFixed(2),
      availability: 'https://schema.org/InStock',
    },
  };

  return stripDefaultMeta(template)
    .replace(/<title>.*?<\/title>/, `<title>${title}</title>`)
    .replace(
      '</head>',
      `${metaTags({ title, description, image: place.thumb_url, canonicalUrl, type: 'product' })}\n` +
        `  <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>\n` +
        `</head>`
    );
}

export function buildStaticPageHtml(template, routePath, page, siteUrl = AUTO_SITE_URL) {
  const canonicalUrl = `${siteUrl}${routePath}`;
  return stripDefaultMeta(template)
    .replace(/<title>.*?<\/title>/, `<title>${page.title}</title>`)
    .replace('</head>', `${metaTags({ ...page, canonicalUrl })}\n</head>`);
}

async function writePage(dist, routePath, html) {
  const outDir = routePath === '/' ? dist : path.join(dist, routePath);
  await fs.mkdir(outDir, { recursive: true });
  await fs.writeFile(path.join(outDir, 'index.html'), html);
}

async function main() {
  const DIST = path.resolve(import.meta.dirname, '..', 'dist');
  const siteUrl = AUTO_SITE_URL;
  const template = await fs.readFile(path.join(DIST, 'index.html'), 'utf8');

  let places = DUMMY_PLACES.map(({ base_price_cents, ...p }) => ({ ...p, base_price_cents }));
  let usedFallback = true;

  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY) {
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
    const { data, error } = await supabase
      .from('places')
      .select('slug, name, story, thumb_url, base_price_cents, type');
    if (error) {
      console.error('[prerender] failed to fetch real catalog, using dummy catalog instead:', error.message);
    } else {
      places = data;
      usedFallback = false;
    }
  }

  for (const place of places) {
    const html = buildPlaceHtml(template, place, siteUrl);
    await writePage(DIST, `/pieza/${place.slug}`, html);
  }

  for (const [routePath, page] of Object.entries(STATIC_PAGES)) {
    const html = buildStaticPageHtml(template, routePath, page, siteUrl);
    await writePage(DIST, routePath, html);
  }

  const dynamicPaths = [
    ...places.map((p) => `/pieza/${p.slug}`),
    ...CATEGORIES.map((c) => `/coleccion/${c.value}`),
  ];
  await fs.writeFile(path.join(DIST, 'sitemap.xml'), buildSitemap(siteUrl, dynamicPaths));

  console.log(
    `[prerender] wrote ${places.length} place page(s) (${usedFallback ? 'dummy catalog' : 'real catalog'}), ${Object.keys(STATIC_PAGES).length} static page(s), and sitemap.xml.`
  );
}

await main();
