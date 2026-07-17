// Issue #49 — "Encuentra tu lugar": live search, A-Z index, filters.
// P3 — "pasaporte de los lugares" graphic system: baggage-tag filter chips,
// results styled as a departures-board manifest.
// Fetches the (small, pilot-sized) catalog once and filters client-side —
// no network round-trip per keystroke. size/frame/orientation aren't place
// attributes in the schema (they're per-order personalization), so the only
// real place filters are collection and type; those are what's wired here.
import { useEffect, useMemo, useRef, useState } from 'react';
import TopoLines from '../components/TopoLines.jsx';

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
      <div className="relative mb-6 rounded-[9px] bg-bg-dark text-text-dark px-6 py-8 overflow-hidden">
        <TopoLines className="absolute inset-0 w-full h-full text-text-dark/30" />
        <h1 className="relative font-display font-light text-3xl">Encuentra tu lugar</h1>
        <p className="relative font-label uppercase tracking-wide text-xs text-text-dark/60 mt-2">
          {places.length} destinos en catálogo
        </p>
      </div>

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
        <div className="baggage-tag border border-dashed border-line rounded pr-3 py-1">
          <select
            value={collection}
            onChange={(e) => setCollection(e.target.value)}
            className="bg-transparent"
          >
            <option value="">Toda colección</option>
            {collections.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="baggage-tag border border-dashed border-line rounded pr-3 py-1">
          <select value={type} onChange={(e) => setType(e.target.value)} className="bg-transparent">
            <option value="">Todos</option>
            <option value="ciudad">Ciudades</option>
            <option value="montana">Montañas</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-text/60">Sin resultados.</p>
      ) : (
        <ul className="border-t border-line font-label">
          {filtered.map((p) => (
            <li key={p.slug} className="border-b border-line">
              <a
                href={`/pieza/${p.slug}`}
                className="flex items-center justify-between py-3 hover:bg-line/40 px-1"
              >
                <span className="font-display font-light text-lg normal-case">{p.name}</span>
                <span
                  className={`uppercase tracking-wide text-xs ${
                    p.type === 'montana' ? 'text-walnut' : 'text-blue'
                  }`}
                >
                  {p.type === 'montana' ? 'Montaña' : 'Ciudad'}
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
