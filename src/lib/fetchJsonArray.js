// Every list-fetching page/component was doing fetch().then(res=>res.json())
// with no res.ok check — a 500 with a JSON error body ({error:{...}}, not an
// array) parses fine, then crashes the first .map() on it with no error
// boundary to catch it, blanking the whole page. That's the real cause
// behind "la página está completamente vacía" reports, not just an empty
// list. Route every such fetch through here instead.
export async function fetchJsonArray(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}
