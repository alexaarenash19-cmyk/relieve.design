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

// Hallazgo (auditoría 10 ago 2026): devolvía siempre un array plano — un
// [] por "no hay resultados" y un [] por "la petición falló" eran
// indistinguibles para quien llama, así que ningún consumidor podía
// mostrar un estado de error real en vez de una lista vacía silenciosa.
// { data, failed } es la forma nueva: `data` sigue siendo siempre un
// array (nunca undefined, para no romper ningún .map() existente),
// `failed` es true solo cuando la petición en sí falló (timeout, red,
// respuesta no-ok, JSON inválido) — nunca por una lista genuinamente vacía.
export async function fetchJsonArray(url, timeoutMs = DEFAULT_TIMEOUT_MS) {
  try {
    const res = await fetchWithTimeout(url, undefined, timeoutMs);
    if (!res.ok) return { data: [], failed: true };
    const data = await res.json();
    return Array.isArray(data) ? { data, failed: false } : { data: [], failed: true };
  } catch {
    return { data: [], failed: true };
  }
}

// For single-object endpoints (e.g. GET /api/places/:slug) where the caller
// needs to distinguish success from failure — timeout and a non-ok response
// both throw, so callers can drive a visible error state instead of hanging.
export async function fetchJson(url, options, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const res = await fetchWithTimeout(url, options, timeoutMs);
  if (!res.ok) throw new Error(`http_${res.status}`);
  return res.json();
}
