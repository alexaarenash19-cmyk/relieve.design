// "Experience view" (Palmer-style) gallery, replacing the old rigid grid.
// Two view modes: scattered infinite canvas (default) and a plain grid
// ("Card Surface").
import { useEffect, useRef, useState } from 'react';
import { placeAlt } from '../lib/altText.js';
import { pieceMainPhoto } from '../lib/photography.js';
import { fetchJsonArray } from '../lib/fetchJsonArray.js';
import Stamp from './Stamp.jsx';
import TopoLines from './TopoLines.jsx';

// TEMPORARY — hardcoded so the scatter/drag/zoom interaction is checkable
// today without depending on /api/places or /api/collections. Not real
// catalog data; delete this and switch the scattered view back to `filtered`
// once those endpoints are trusted again.
const SCATTER_DEMO_ITEMS = [
  { slug: 'demo-1', name: 'Monterrey', variant: 'Mediano', thumb_url: 'https://images.unsplash.com/photo-1642321215251-bd9999b0b408?fm=jpg&q=70&w=800&auto=format&fit=crop' },
  { slug: 'demo-2', name: 'Ciudad de México', variant: 'Grande', thumb_url: 'https://images.unsplash.com/photo-1591049433264-618fa2f4558f?fm=jpg&q=70&w=800&auto=format&fit=crop' },
  { slug: 'demo-3', name: 'Popocatépetl', variant: 'Especial', thumb_url: 'https://images.unsplash.com/photo-1562196531-60920785b7ca?fm=jpg&q=70&w=800&auto=format&fit=crop' },
  { slug: 'demo-4', name: 'Oaxaca', variant: 'Mini', thumb_url: 'https://images.unsplash.com/photo-1641511256207-3e3ced99393e?fm=jpg&q=70&w=800&auto=format&fit=crop' },
  { slug: 'demo-5', name: 'San Miguel de Allende', variant: 'Mediano', thumb_url: 'https://images.unsplash.com/photo-1598535989263-cb097f8ac3f0?fm=jpg&q=70&w=800&auto=format&fit=crop' },
  { slug: 'demo-6', name: 'Manila', variant: 'Mini', thumb_url: 'https://images.unsplash.com/photo-1526731955462-f6085f39e742?fm=jpg&q=70&w=800&auto=format&fit=crop' },
  { slug: 'demo-7', name: 'Sala', variant: 'Mediano', thumb_url: 'https://images.unsplash.com/photo-1769117549887-d7ab37279060?fm=jpg&q=70&w=800&auto=format&fit=crop' },
  { slug: 'demo-8', name: 'Muro', variant: 'Mini', thumb_url: 'https://images.unsplash.com/photo-1738682767944-d3c255abac3c?fm=jpg&q=70&w=800&auto=format&fit=crop' },
  { slug: 'demo-9', name: 'Retrato', variant: 'Grande', thumb_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?fm=jpg&q=70&w=800&auto=format&fit=crop' },
];

// Grid-aligned, hand-placed cells — straight, never overlapping, varied
// sizes (1x1 / 2x2) but locked to a 4-col grid, not free/random positions.
const CELL = 170;
const GAP = 24;
const GRID_COLS = 4;
const GRID_ROWS = 4;
const BLOCK_W = GRID_COLS * CELL + (GRID_COLS - 1) * GAP;
const BLOCK_H = GRID_ROWS * CELL + (GRID_ROWS - 1) * GAP;

const TILE_PATTERN = [
  { col: 0, row: 0, span: 2 },
  { col: 2, row: 0, span: 1 },
  { col: 3, row: 0, span: 1 },
  { col: 2, row: 1, span: 1 },
  { col: 3, row: 1, span: 1 },
  { col: 0, row: 2, span: 1 },
  { col: 1, row: 2, span: 2 },
  { col: 3, row: 2, span: 1 },
  { col: 0, row: 3, span: 1 },
];

function tilePx({ col, row, span }) {
  return {
    left: col * (CELL + GAP),
    top: row * (CELL + GAP),
    size: span * CELL + (span - 1) * GAP,
  };
}

export function GalleryCard({ place, variant = 'grid', slot }) {
  const photo = pieceMainPhoto(place.slug) ?? place.thumb_url;
  const cursorLabel =
    variant === 'scattered' ? `+ ${place.name}${place.variant ? ` — ${place.variant}` : ''}` : undefined;

  const tileStyle =
    variant === 'scattered'
      ? { position: 'absolute', top: slot.top, left: slot.left, width: slot.size, height: slot.size }
      : undefined;

  return (
    <a
      href={`/pieza/${place.slug}`}
      data-cursor-label={cursorLabel}
      className={
        variant === 'scattered'
          ? 'group block select-none'
          : 'group block border border-line rounded-[9px] bg-gallery-white overflow-hidden select-none'
      }
      style={tileStyle}
    >
      <div
        className={`warm-photo relative w-full h-full aspect-square bg-stone overflow-hidden flex items-center justify-center ${
          variant === 'scattered' ? 'shadow-[0_16px_32px_-16px_rgba(35,35,35,0.35)]' : ''
        }`}
      >
        {photo ? (
          <img
            src={photo}
            alt={placeAlt(place)}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            draggable={false}
            loading={variant === 'scattered' ? 'lazy' : undefined}
          />
        ) : (
          <span className="font-label uppercase tracking-wide text-xs text-graphite/60">{place.name}</span>
        )}
        {/* Route/contour overlay drawn ON the photo, not floating alone. */}
        <TopoLines className="absolute inset-0 w-full h-full text-dark-fg mix-blend-screen opacity-70 pointer-events-none" />
        {variant !== 'scattered' && (
          <Stamp
            label="Ver pieza"
            className="absolute inset-0 m-auto w-fit h-fit opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 bg-gallery-white/90"
          />
        )}
      </div>
      {variant !== 'scattered' && <p className="font-display text-sm px-3 py-2">{place.name}</p>}
    </a>
  );
}

// Infinite pannable canvas: drag translates an offset; the tile pattern
// wraps (modulo BLOCK_W/H) and repeats in a 3x3 grid of copies around the
// wrapped origin, so panning in any direction never runs out of tiles.
function ScatteredCanvas({ items, zoom }) {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const draggingRef = useRef(false);
  const startRef = useRef({ x: 0, y: 0 });
  const movedRef = useRef(false);

  function onPointerDown(e) {
    draggingRef.current = true;
    movedRef.current = false;
    startRef.current = { x: e.clientX - offset.x, y: e.clientY - offset.y };
  }
  function onPointerMove(e) {
    if (!draggingRef.current) return;
    const next = { x: e.clientX - startRef.current.x, y: e.clientY - startRef.current.y };
    if (Math.abs(next.x - offset.x) > 4 || Math.abs(next.y - offset.y) > 4) movedRef.current = true;
    setOffset(next);
  }
  function onPointerUp() {
    draggingRef.current = false;
  }
  // Cancel the tile's own link navigation if that pointerup ended a pan,
  // not a click.
  function onClickCapture(e) {
    if (movedRef.current) {
      e.preventDefault();
      e.stopPropagation();
    }
  }

  const wrappedX = ((offset.x % BLOCK_W) + BLOCK_W) % BLOCK_W;
  const wrappedY = ((offset.y % BLOCK_H) + BLOCK_H) % BLOCK_H;
  const REPEAT = [-1, 0, 1];

  return (
    <div
      className="relative mx-auto overflow-hidden select-none cursor-grab active:cursor-grabbing"
      style={{ height: '78vh', maxWidth: 1400 }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
      onClickCapture={onClickCapture}
    >
      <div className="absolute inset-0" style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}>
        {REPEAT.flatMap((j) =>
          REPEAT.map((i) => (
            <div
              key={`${i}-${j}`}
              className="absolute"
              style={{
                left: `calc(50% + ${wrappedX + i * BLOCK_W - BLOCK_W / 2}px)`,
                top: `calc(50% + ${wrappedY + j * BLOCK_H - BLOCK_H / 2}px)`,
                width: BLOCK_W,
                height: BLOCK_H,
              }}
            >
              {items.map((place, idx) => (
                <GalleryCard
                  key={place.slug}
                  place={place}
                  variant="scattered"
                  slot={tilePx(TILE_PATTERN[idx % TILE_PATTERN.length])}
                />
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function ExperienceToggle({ view, onChange }) {
  // sticky (not fixed) so it stops tracking once the gallery section scrolls
  // past — a viewport-fixed pill would otherwise float over Testimonials
  // and the footer below.
  return (
    <div className="sticky top-20 z-30 flex justify-center">
      <button
        onClick={() => onChange(view === 'scattered' ? 'grid' : 'scattered')}
        className="flex items-center gap-2 rounded-full border border-graphite px-4 py-[7px] font-body text-xs bg-gallery-white/80 backdrop-blur"
      >
        <svg viewBox="0 0 12 12" width="10" height="10" aria-hidden="true">
          {[0, 1, 2].flatMap((r) => [0, 1, 2].map((c) => <circle key={`${r}-${c}`} cx={c * 5 + 1} cy={r * 5 + 1} r="1" fill="currentColor" />))}
        </svg>
        experience view
      </button>
    </div>
  );
}

function BottomControlBar({ type, setType, collection, setCollection, collections, setZoom, showHint }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);

  // sticky (not fixed) — same reason as ExperienceToggle above: a
  // viewport-fixed bar would float over Testimonials/footer once you
  // scroll past the gallery.
  return (
    <div className="sticky bottom-6 z-30 flex justify-center">
    <div className="relative flex items-center gap-2">
      {menuOpen && (
        <div className="absolute bottom-12 left-0 bg-gallery-white border border-line rounded-[3px] p-3 flex flex-col gap-2 font-label uppercase tracking-wide text-xs whitespace-nowrap">
          <a href="/buscar" className="hover:text-passport-ink">Buscar</a>
          <a href="/sobre" className="hover:text-passport-ink">Sobre</a>
          <a href="/coleccion/ciudades-mexico" className="hover:text-passport-ink">Colecciones</a>
        </div>
      )}
      <button
        onClick={() => { setMenuOpen((o) => !o); setFilterOpen(false); }}
        className="rounded-[3px] border border-graphite bg-gallery-white px-3 py-2 font-label uppercase tracking-wide text-xs flex items-center gap-1.5"
      >
        <svg viewBox="0 0 14 10" width="12" height="9" aria-hidden="true">
          <line x1="0" y1="1" x2="14" y2="1" stroke="currentColor" />
          <line x1="0" y1="5" x2="14" y2="5" stroke="currentColor" />
          <line x1="0" y1="9" x2="14" y2="9" stroke="currentColor" />
        </svg>
        menu
      </button>

      {filterOpen && (
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 bg-gallery-white border border-line rounded-[3px] p-3 flex flex-col gap-2 font-label uppercase tracking-wide text-xs">
          <select value={collection} onChange={(e) => setCollection(e.target.value)} className="border border-line rounded px-2 py-1 bg-transparent">
            <option value="">Toda colección</option>
            {collections.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
          </select>
          <select value={type} onChange={(e) => setType(e.target.value)} className="border border-line rounded px-2 py-1 bg-transparent">
            <option value="">Todos</option>
            <option value="ciudad">Ciudades</option>
            <option value="montana">Montañas</option>
          </select>
        </div>
      )}
      <button
        onClick={() => { setFilterOpen((o) => !o); setMenuOpen(false); }}
        className="rounded-[3px] border border-graphite bg-gallery-white px-3 py-2 font-label uppercase tracking-wide text-xs flex items-center gap-1.5"
      >
        <svg viewBox="0 0 14 10" width="12" height="9" aria-hidden="true">
          <circle cx="1.5" cy="1.5" r="1.5" fill="currentColor" />
          <line x1="5" y1="1.5" x2="14" y2="1.5" stroke="currentColor" />
          <circle cx="1.5" cy="8.5" r="1.5" fill="currentColor" />
          <line x1="5" y1="8.5" x2="14" y2="8.5" stroke="currentColor" />
        </svg>
        filter
      </button>

      {showHint && (
        <span className="hidden sm:inline font-label uppercase tracking-wide text-[10px] text-graphite/50 ml-2">
          drag to explore
        </span>
      )}

      <div className="flex gap-1 ml-2">
        <button
          onClick={() => setZoom((z) => Math.max(0.75, z - 0.15))}
          aria-label="Alejar"
          className="w-6 h-6 rounded-full border border-graphite bg-gallery-white flex items-center justify-center text-xs text-graphite"
        >
          −
        </button>
        <button
          onClick={() => setZoom((z) => Math.min(1.4, z + 0.15))}
          aria-label="Acercar"
          className="w-6 h-6 rounded-full border border-graphite bg-gallery-white flex items-center justify-center text-xs text-graphite"
        >
          +
        </button>
      </div>
    </div>
    </div>
  );
}

export default function Gallery() {
  const [places, setPlaces] = useState([]);
  const [collections, setCollections] = useState([]);
  const [type, setType] = useState('');
  const [collection, setCollection] = useState('');
  const [view, setView] = useState('scattered');
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    const query = type ? `?type=${type}` : '';
    fetchJsonArray(`/api/places${query}`).then(setPlaces);
    fetchJsonArray('/api/collections').then(setCollections);
  }, [type]);

  const filtered = collection ? places.filter((p) => p.collection === collection) : places;

  return (
    <section className="relative pb-28">
      <ExperienceToggle view={view} onChange={setView} />

      {view === 'scattered' ? (
        <ScatteredCanvas items={SCATTER_DEMO_ITEMS} zoom={zoom} />
      ) : (
        <div
          className="grid gap-px bg-line p-px"
          style={{ gridTemplateColumns: `repeat(${Math.round(3 * zoom)}, minmax(0, 1fr))` }}
        >
          {filtered.map((place) => (
            <GalleryCard key={place.slug} place={place} variant="grid" />
          ))}
        </div>
      )}

      <BottomControlBar
        type={type} setType={setType}
        collection={collection} setCollection={setCollection}
        collections={collections}
        setZoom={setZoom}
        showHint={view === 'scattered'}
      />
    </section>
  );
}
