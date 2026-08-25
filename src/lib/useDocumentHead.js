// Client-side <title>/meta updates for SPA navigation — the static prerender
// (scripts/prerender.mjs) covers the first request crawlers/direct-loads
// see, but once React Router navigates without a full reload those tags
// go stale unless something updates them too. Same tags, two mechanisms.
import { useEffect } from 'react';

// Must match the production domain used by robots.txt, index.html's
// Organization JSON-LD, and scripts/prerender.mjs's AUTO_SITE_URL — this
// used to point at the Vercel preview domain, which told Google the
// canonical home of every SPA-navigated page was relieve-web.vercel.app.
const SITE_URL = 'https://relieve.design';

// vercel.json's CSP enforces `require-trusted-types-for 'script'`, which
// covers assigning textContent/innerHTML on a <script> element (even
// type="application/ld+json") — not just executable script. It also
// restricts createPolicy to the one name the CSP allow-lists via
// `trusted-types relieve-script-urls`. Without this policy, setJsonLd's
// plain string assignment throws (browser enforcing Trusted Types treats
// the write as a blocked script sink), which crashes the whole render
// since it happens inside an effect with no boundary — that's what took
// down every /pieza and /coleccion/* page after CSP went from
// report-only to enforced.
let ttPolicy;
function getTrustedTypesPolicy() {
  if (typeof window === 'undefined' || !window.trustedTypes?.createPolicy) return null;
  if (ttPolicy === undefined) {
    try {
      ttPolicy = window.trustedTypes.createPolicy('relieve-script-urls', {
        createScript: (s) => s,
      });
    } catch {
      // Policy already created (e.g. hot reload) or blocked — fall back
      // to a plain string, which is safe on browsers without Trusted
      // Types enforcement anyway.
      ttPolicy = null;
    }
  }
  return ttPolicy;
}

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

// scripts/prerender.mjs's buildPlaceHtml() already injects this same
// Product/Offer JSON-LD for the first request (crawlers, direct loads,
// link-preview bots) — but that's static HTML from the last build. Once
// React Router navigates client-side onto a product page without a full
// reload, nothing updates it, so a real visitor never sees it and it goes
// stale the moment prices change. One <script> tag, replaced wholesale on
// each call rather than merged, since JSON-LD has no per-field API like
// <meta> — id-based lookup, same pattern as setCanonical above.
function setJsonLd(data) {
  let el = document.getElementById('page-jsonld');
  if (!data) {
    el?.remove();
    return;
  }
  if (!el) {
    el = document.createElement('script');
    el.id = 'page-jsonld';
    el.type = 'application/ld+json';
    document.head.appendChild(el);
  }
  const json = JSON.stringify(data);
  const policy = getTrustedTypesPolicy();
  el.textContent = policy ? policy.createScript(json) : json;
}

// canonicalPath: pass the bare, filter-free path (e.g. '/buscar', not
// '/buscar?type=montana') so filtered/query-string views canonicalize to
// the same URL instead of reading as duplicate content.
export function useDocumentHead({ title, description, image, canonicalPath, jsonLd }) {
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
    setJsonLd(jsonLd);
  }, [title, description, image, canonicalPath, jsonLd]);
}
