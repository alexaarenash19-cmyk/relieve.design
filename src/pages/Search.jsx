// Issue #49 — "Encuentra tu lugar": live search, A-Z index, filters.
// P3 — "pasaporte de los lugares" graphic system: baggage-tag filter chips,
// results styled as a departures-board manifest.
// Fetches the (small, pilot-sized) catalog once and filters client-side —
// no network round-trip per keystroke. size/frame/orientation aren't place
// attributes in the schema (they're per-order personalization), so the real
// place filter is series (places.series — Origen/Travesía/Cumbre), same
// taxonomy as /colecciones' "por categoría" view (src/lib/categories.js
// SERIES). Distinct from `type` (ciudad/juego), which the Explorar canvas
// still uses for its own separate "tipo" filter.
import { useEffect, useMemo, useRef, useState } from 'react';
import TopoLines from '../components/TopoLines.jsx';
import DeparturesBoard from '../components/DeparturesBoard.jsx';
import { fetchJsonArray } from '../lib/fetchJsonArray.js';
import { SERIES, seriesLabel } from '../lib/categories.js';
import { useDocumentHead } from '../lib/useDocumentHead.js';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export default function Search() {
  const [places, setPlaces] = useState([]);
  const [query, setQuery] = useState('');
  const [series, setSeries] = useState('');
  const [letter, setLetter] = useState(null);
  const inputRef = useRef(null);

  // Canonicalizes to the bare path regardless of query/series/letter filters
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
    if (series && p.series !== series) return false;
    if (letter && p.name[0].toUpperCase() !== letter) return false;
    return true;
  });

  return (
    // Hallazgo #8 (auditoría 10 ago 2026): pt-32 (no p-8), mismo fix que
    // Collections.jsx ya tiene.
    <main className="max-w-3xl mx-auto pt-32 px-8 pb-8">
      <div className="relative mb-6 rounded-[9px] bg-dark-bg text-dark-fg px-6 py-8 overflow-hidden">
        <TopoLines className="absolute inset-0 w-full h-full text-dark-fg/30" />
        {/* Encontrado de paso al revisar hallazgo #4 en este mismo archivo:
            text-brand-dark sobre bg-dark-bg medía ~2.33:1 (WCAG AA pide
            3:1 mínimo incluso para texto grande) — mismo bug de fondo/texto
            fijo que el h1 de Product.jsx, aquí sobre un bloque oscuro en
            vez de un accent de color. text-dark-fg (~14:1) es el token que
            ya usa el párrafo justo debajo. */}
        <h1 className="relative font-heading font-bold text-dark-fg text-3xl">Encuentra tu lugar</h1>
        <p className="relative font-label uppercase tracking-wide text-xs text-dark-fg/60 mt-2">
          {places.length} destinos en catálogo
        </p>
      </div>

      {/* Hallazgo (auditoría 10 ago 2026): solo tenía placeholder, sin
          nombre accesible para lectores de pantalla. */}
      <label htmlFor="search-query" className="sr-only">
        Buscar por nombre
      </label>
      <input
        id="search-query"
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
            className={`w-7 h-7 text-xs font-heading font-bold rounded ${
              letter === l ? 'bg-brand-dark text-dark-bg' : 'text-brand-dark/70'
            } ${available.has(l) ? 'hover:bg-line' : 'opacity-20 cursor-default'}`}
          >
            {l}
          </button>
        ))}
      </div>

      <div className="flex gap-3 mb-6 font-label uppercase tracking-wide text-xs">
        <div className="baggage-tag border border-dashed border-line rounded pr-3 py-1">
          <select value={series} onChange={(e) => setSeries(e.target.value)} className="bg-transparent">
            <option value="">Todas las series</option>
            {SERIES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {query && filtered.length === 0 ? (
        // Business differentiator is "si no tenemos el dato real, lo
        // dejamos en blanco" — someone searching for a place we don't have
        // needs to know that clearly, with a way to ask for it, instead of
        // silently seeing an empty list and assuming search is broken.
        <div className="border border-line rounded-[9px] p-6 text-center">
          <p className="font-label uppercase tracking-wide text-xs text-graphite/60 mb-2">
            No disponible
          </p>
          <p className="mb-4">
            No tenemos “{query}” en el catálogo todavía.
          </p>
          <a
            href={`mailto:contacto@relieve.design?subject=${encodeURIComponent(`Solicito: ${query}`)}&body=${encodeURIComponent(`Me gustaría un mapa en relieve de: ${query}`)}`}
            className="font-label uppercase tracking-wide text-xs text-passport-ink underline"
          >
            Solicita tu lugar →
          </a>
        </div>
      ) : (
        <DeparturesBoard
          rows={filtered.map((p) => ({
            key: p.slug,
            node: (
              <a
                href={`/pieza/${p.slug}`}
                className="flex items-center justify-between py-3 hover:bg-line/40 px-1"
              >
                <span className="font-display font-light text-lg normal-case">{p.name}</span>
                {/* Hallazgo #4 (auditoría 10 ago 2026): text-explorer-blue
                    sobre el fondo gallery-white de esta página medía
                    ~1.49:1 (WCAG AA pide 4.5:1) — casi invisible. Cambiado a
                    text-passport-ink (~6.61:1), el mismo token que ya usa
                    el link "Solicita tu lugar →" un poco más arriba. */}
                <span className="uppercase tracking-wide text-xs text-passport-ink">
                  {seriesLabel(p.series)}
                </span>
              </a>
            ),
          }))}
        />
      )}
    </main>
  );
}
