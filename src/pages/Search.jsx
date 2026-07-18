// Issue #49 — "Encuentra tu lugar": live search, A-Z index, filters.
// P3 — "pasaporte de los lugares" graphic system: baggage-tag filter chips,
// results styled as a departures-board manifest.
// Fetches the (small, pilot-sized) catalog once and filters client-side —
// no network round-trip per keystroke. size/frame/orientation aren't place
// attributes in the schema (they're per-order personalization), so the only
// real place filter is category (`type`) — same taxonomy as the experience
// view's "tipo" chip and /colecciones, not a separate collections list.
import { useEffect, useMemo, useRef, useState } from 'react';
import TopoLines from '../components/TopoLines.jsx';
import DeparturesBoard from '../components/DeparturesBoard.jsx';
import { fetchJsonArray } from '../lib/fetchJsonArray.js';
import { CATEGORIES, categoryLabel } from '../lib/categories.js';
import { useDocumentHead } from '../lib/useDocumentHead.js';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export default function Search() {
  const [places, setPlaces] = useState([]);
  const [query, setQuery] = useState('');
  const [type, setType] = useState('');
  const [letter, setLetter] = useState(null);
  const inputRef = useRef(null);

  // Canonicalizes to the bare path regardless of query/type/letter filters
  // so filtered views don't read as duplicate content.
  useDocumentHead({
    title: 'Buscar un lugar — Relieve',
    description: 'Encuentra tu ciudad, montaña, estadio o circuito favorito entre las piezas disponibles en Relieve.',
    canonicalPath: '/buscar',
  });

  useEffect(() => {
    fetchJsonArray('/api/places').then(setPlaces);
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
    if (letter && p.name[0].toUpperCase() !== letter) return false;
    return true;
  });

  return (
    <main className="max-w-3xl mx-auto p-8">
      <div className="relative mb-6 rounded-[9px] bg-dark-bg text-dark-fg px-6 py-8 overflow-hidden">
        <TopoLines className="absolute inset-0 w-full h-full text-dark-fg/30" />
        <h1 className="relative font-display font-light text-3xl">Encuentra tu lugar</h1>
        <p className="relative font-label uppercase tracking-wide text-xs text-dark-fg/60 mt-2">
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
              letter === l ? 'bg-sello-navy text-dark-bg' : 'text-graphite/70'
            } ${available.has(l) ? 'hover:bg-line' : 'opacity-20 cursor-default'}`}
          >
            {l}
          </button>
        ))}
      </div>

      <div className="flex gap-3 mb-6 font-label uppercase tracking-wide text-xs">
        <div className="baggage-tag border border-dashed border-line rounded pr-3 py-1">
          <select value={type} onChange={(e) => setType(e.target.value)} className="bg-transparent">
            <option value="">Todas las categorías</option>
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <DeparturesBoard
        rows={filtered.map((p) => ({
          key: p.slug,
          node: (
            <a
              href={`/pieza/${p.slug}`}
              className="flex items-center justify-between py-3 hover:bg-line/40 px-1"
            >
              <span className="font-display font-light text-lg normal-case">{p.name}</span>
              <span
                className={`uppercase tracking-wide text-xs ${
                  p.type === 'montana' ? 'text-walnut' : 'text-explorer-blue'
                }`}
              >
                {categoryLabel(p.type)}
              </span>
            </a>
          ),
        }))}
      />
    </main>
  );
}
