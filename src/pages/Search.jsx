// Issue #49 — "Encuentra tu lugar": live search, A-Z index, filters.
// Fetches the (small, pilot-sized) catalog once and filters client-side —
// no network round-trip per keystroke. size/frame/orientation aren't place
// attributes in the schema (they're per-order personalization), so the only
// real place filters are collection and type; those are what's wired here.
import { useEffect, useMemo, useRef, useState } from 'react';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export default function Search() {
  const [places, setPlaces] = useState([]);
  const [collections, setCollections] = useState([]);
  const [query, setQuery] = useState('');
  const [collection, setCollection] = useState('');
  const [type, setType] = useState('');
  const [letter, setLetter] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    fetch('/api/places').then((res) => res.json()).then(setPlaces).catch(() => setPlaces([]));
    fetch('/api/collections').then((res) => res.json()).then(setCollections).catch(() => setCollections([]));
  }, []);

  useEffect(() => {
    function onSlash(e) {
      if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }
    window.addEventListener('keydown', onSlash);
    return () => window.removeEventListener('keydown', onSlash);
  }, []);

  const available = useMemo(
    () => new Set(places.map((p) => p.name[0].toUpperCase())),
    [places]
  );

  const filtered = places.filter((p) => {
    if (query && !p.name.toLowerCase().includes(query.toLowerCase())) return false;
    if (type && p.type !== type) return false;
    if (collection && p.collection !== collection) return false;
    if (letter && p.name[0].toUpperCase() !== letter) return false;
    return true;
  });

  return (
    <main className="max-w-3xl mx-auto p-8">
      <h1 className="font-display font-light text-3xl mb-6">Encuentra tu lugar</h1>

      <input
        ref={inputRef}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar por nombre… (atajo: /)"
        className="w-full border border-line rounded-[9px] px-4 py-3 mb-4 font-body"
      />

      <div className="flex flex-wrap gap-1 mb-6">
        {ALPHABET.map((l) => (
          <button
            key={l}
            disabled={!available.has(l)}
            onClick={() => setLetter(letter === l ? null : l)}
            className={`w-7 h-7 text-xs font-label rounded ${
              letter === l ? 'bg-navy text-bg-dark' : 'text-text/70'
            } ${available.has(l) ? 'hover:bg-line' : 'opacity-20 cursor-default'}`}
          >
            {l}
          </button>
        ))}
      </div>

      <div className="flex gap-3 mb-6 font-label uppercase tracking-wide text-xs">
        <select
          value={collection}
          onChange={(e) => setCollection(e.target.value)}
          className="border border-line rounded-full px-3 py-1"
        >
          <option value="">Toda colección</option>
          {collections.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="border border-line rounded-full px-3 py-1"
        >
          <option value="">Todos</option>
          <option value="ciudad">Ciudades</option>
          <option value="montana">Montañas</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <p className="text-text/60">Sin resultados.</p>
      ) : (
        <ul className="divide-y divide-line">
          {filtered.map((p) => (
            <li key={p.slug} className="py-3">
              <a href={`/pieza/${p.slug}`} className="hover:underline">
                {p.name}
              </a>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
