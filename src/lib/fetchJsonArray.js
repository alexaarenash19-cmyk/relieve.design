// Every list-fetching page/component was doing fetch().then(res=>res.json())
// with no res.ok check — a 500 with a JSON error body ({error:{...}}, not an
// array) parses fine, then crashes the first .map() on it with no error
// boundary to catch it, blanking the whole page. That's the real cause
// behind "la página está completamente vacía" reports, not just an empty
// list. Route every such fetch through here instead.
//
// Both helpers also bound the request with a timeout (AbortController) —
// a fetch that just hangs (flaky network, a cold-start serverless function
// that never resolves) previously left pages stuck on "Cargando…" forever,
// since neither .then nor .catch would ever fire without something forcing
// the promise to settle.
const DEFAULT_TIMEOUT_MS = 10000;

async function fetchWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

// apple-design audit follow-up (11 ago 2026) — Gallery.jsx and
// CartContext.jsx both call fetchJsonArray('/api/places') independently
// on every Home mount, firing two concurrent requests at an already-slow
// backend (~7.2s on preview deploys per an earlier finding). Confirmed
// live: one came back 200, the other 503, on the same page load — two
// simultaneous cold connections apparently contend for something the
// single-request path doesn't. inFlight dedupes by exact URL: a second
// caller during an outstanding request awaits the SAME promise instead of
// firing a second one. The entry is deleted the moment the request
// settles (success or failure) so this only collapses truly concurrent
// calls — it's not a cache, a fetch a second later still goes to the
// network and sees fresh data.
const inFlight = new Map();

// Hallazgo (auditoría 10 ago 2026): devolvía siempre un array plano — un
// [] por "no hay resultados" y un [] por "la petición falló" eran
// indistinguibles para quien llama, así que ningún consumidor podía
// mostrar un estado de error real en vez de una lista vacía silenciosa.
// { data, failed } es la forma nueva: `data` sigue siendo siempre un
// array (nunca undefined, para no romper ningún .map() existente),
// `failed` es true solo cuando la petición en sí falló (timeout, red,
// respuesta no-ok, JSON inválido) — nunca por una lista genuinamente vacía.
export async function fetchJsonArray(url, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const existing = inFlight.get(url);
  if (existing) return existing;

  const promise = (async () => {
    try {
      const res = await fetchWithTimeout(url, undefined, timeoutMs);
      if (!res.ok) return { data: [], failed: true };
      const data = await res.json();
      return Array.isArray(data) ? { data, failed: false } : { data: [], failed: true };
    } catch {
      return { data: [], failed: true };
    } finally {
      inFlight.delete(url);
    }
  })();

  inFlight.set(url, promise);
  return promise;
}

// For single-object endpoints (e.g. GET /api/places/:slug) where the caller
// needs to distinguish success from failure — timeout and a non-ok response
// both throw, so callers can drive a visible error state instead of hanging.
export async function fetchJson(url, options, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const res = await fetchWithTimeout(url, options, timeoutMs);
  if (!res.ok) throw new Error(`http_${res.status}`);
  return res.json();
}
