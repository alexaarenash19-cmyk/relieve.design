// Trusted Types policy (17 ago 2026, CSP hardening -- PageSpeed Best
// Practices follow-up). `require-trusted-types-for 'script'` in vercel.json
// governs a few sinks browser-wide, most relevantly HTMLScriptElement.src.
// The only place in this codebase that assigns one dynamically is
// googleMapsLoader.js (a <script> tag it builds itself for the Google Maps
// JS API) -- everything else here is plain JSX/GSAP style writes, which
// Trusted Types doesn't govern.
//
// Deliberately narrow: createScriptURL only accepts the exact Google Maps
// API origin/path, not a blanket passthrough -- so even if some future
// change fed this an untrusted URL by mistake, it throws instead of
// quietly creating a TrustedScriptURL for it.
const ALLOWED_SCRIPT_URL_PREFIX = 'https://maps.googleapis.com/maps/api/js?';

let policy;

export function getTrustedTypesPolicy() {
  if (policy !== undefined) return policy;
  if (typeof window === 'undefined' || !window.trustedTypes?.createPolicy) {
    // Browser doesn't support Trusted Types -- the CSP directive is a
    // no-op there, so callers just use the raw string as before.
    policy = null;
    return policy;
  }
  policy = window.trustedTypes.createPolicy('relieve-script-urls', {
    createScriptURL(url) {
      if (!url.startsWith(ALLOWED_SCRIPT_URL_PREFIX)) {
        throw new Error(`Blocked untrusted script URL: ${url}`);
      }
      return url;
    },
  });
  return policy;
}
