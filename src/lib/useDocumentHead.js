// Client-side <title>/meta updates for SPA navigation — the static prerender
// (scripts/prerender.mjs) covers the first request crawlers/direct-loads
// see, but once React Router navigates without a full reload those tags
// go stale unless something updates them too. Same tags, two mechanisms.
import { useEffect } from 'react';

const SITE_URL = 'https://relieve-web.vercel.app';

function setMeta(attr, name, content) {
  if (!content) return;
  let el = document.querySelector(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setCanonical(pathname) {
  let el = document.querySelector('link[rel="canonical"]');
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute('href', `${SITE_URL}${pathname}`);
}

// canonicalPath: pass the bare, filter-free path (e.g. '/buscar', not
// '/buscar?type=montana') so filtered/query-string views canonicalize to
// the same URL instead of reading as duplicate content.
export function useDocumentHead({ title, description, image, canonicalPath }) {
  useEffect(() => {
    if (title) document.title = title;
    setMeta('name', 'description', description);
    setMeta('property', 'og:title', title);
    setMeta('property', 'og:description', description);
    setMeta('property', 'og:image', image);
    setMeta('property', 'og:type', image ? 'product' : 'website');
    setMeta('name', 'twitter:card', image ? 'summary_large_image' : 'summary');
    setMeta('name', 'twitter:title', title);
    setMeta('name', 'twitter:description', description);
    setMeta('name', 'twitter:image', image);
    if (canonicalPath) setCanonical(canonicalPath);
  }, [title, description, image, canonicalPath]);
}
