// "Experience view" (Palmer-style) gallery, replacing the old rigid grid.
// Two view modes: scattered infinite canvas (default) and a plain grid
// ("Card Surface").
import { useEffect, useRef, useState } from 'react';
import { placeAlt } from '../lib/altText.js';
import { pieceMainPhoto } from '../lib/photography.js';
import { fetchJsonArray } from '../lib/fetchJsonArray.js';
import { CATEGORIES } from '../lib/categories.js';
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
// Only fully-in-view tiles render (see ScatteredCanvas), so CELL/GAP need
// to be small enough that a full block — ideally more than one — fits
// inside a typical viewport; too large and almost nothing survives the
// visibility filter, leaving the canvas looking empty.
const CELL = 180;
const GAP = 50;
const GRID_COLS = 4;
const GRID_ROWS = 4;
// One GAP per column/row, including a trailing one after the last — not
// (COLS - 1) gaps — so the repeat period leaves a real gutter at the seam
// between tiled blocks too, not just between cells inside one block.
const BLOCK_W = GRID_COLS * (CELL + GAP);
const BLOCK_H = GRID_ROWS * (CELL + GAP);

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
// wraps (modulo BLOCK_W/H) and repeats in a grid of copies around the
// wrapped origin, so panning in any direction never runs out of tiles.
//
// Every candidate tile's on-screen rect is computed in JS and only
// rendered if it's FULLY inside the viewport — a tile straddling the
// edge is skipped entirely rather than letting overflow:hidden crop it.
// That's the only way to guarantee no photo is ever partially cut off:
// CSS clipping crops whatever geometry lands on the boundary, it can't
// selectively hide only-partial elements.
function ScatteredCanvas({ items, zoom }) {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [size, setSize] = useState({ w: 0, h: 0 });
  const containerRef = useRef(null);
  const draggingRef = useRef(false);
  const startRef = useRef({ x: 0, y: 0 });
  const movedRef = useRef(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setSize({ w: entry.contentRect.width, h: entry.contentRect.height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

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
  // Enough repeats either side to cover the viewport even when zoomed out
  // (min zoom 0.75 needs ~1.3x the unzoomed span) and at wide viewports.
  const REPEAT = [-2, -1, 0, 1, 2];
  const centerX = size.w / 2;
  const centerY = size.h / 2;

  const tiles = [];
  if (size.w && size.h) {
    for (const j of REPEAT) {
      for (const i of REPEAT) {
        const blockLeft = wrappedX + i * BLOCK_W - BLOCK_W / 2;
        const blockTop = wrappedY + j * BLOCK_H - BLOCK_H / 2;
        items.forEach((place, idx) => {
          const slot = tilePx(TILE_PATTERN[idx % TILE_PATTERN.length]);
          const rawLeft = centerX + blockLeft + slot.left;
          const rawTop = centerY + blockTop + slot.top;
          const screenLeft = centerX + (rawLeft - centerX) * zoom;
          const screenTop = centerY + (rawTop - centerY) * zoom;
          const screenSize = slot.size * zoom;
          const fullyVisible =
            screenLeft >= 0 && screenTop >= 0 && screenLeft + screenSize <= size.w && screenTop + screenSize <= size.h;
          if (!fullyVisible) return;
          tiles.push({ key: `${i}-${j}-${place.slug}`, place, left: rawLeft, top: rawTop, size: slot.size });
        });
      }
    }
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden select-none cursor-grab active:cursor-grabbing"
      style={{ height: '100vh' }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
      onClickCapture={onClickCapture}
    >
      <div className="absolute inset-0" style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}>
        {tiles.map((t) => (
          <GalleryCard
            key={t.key}
            place={t.place}
            variant="scattered"
            slot={{ left: t.left, top: t.top, size: t.size }}
          />
        ))}
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
        className="flex items-center gap-2 rounded-full border border-graphite px-4 py-[7px] font-body text-xs bg-transparent"
      >
        <svg viewBox="0 0 12 12" width="10" height="10" aria-hidden="true">
          {[0, 1, 2].flatMap((r) => [0, 1, 2].map((c) => <circle key={`${r}-${c}`} cx={c * 5 + 1} cy={r * 5 + 1} r="1" fill="currentColor" />))}
        </svg>
        experience view
      </button>
    </div>
  );
}

// Ghost pill (closed/inactive) vs. dark pill (active/expanded or a child
// chip). Ghost pills are fully transparent — no fill at all, per Palmer:
// "no background fill, it's an outlined ghost pill" — so they float
// directly over whatever's behind them (photo or canvas), not a solid
// panel. Dark pills are the deliberate exception (active-state fill).
const GHOST_PILL =
  'rounded-full border border-graphite bg-transparent text-graphite px-3 py-2 font-label uppercase tracking-wide text-xs flex items-center gap-1.5';
const DARK_PILL =
  'rounded-full bg-graphite text-gallery-white px-3 py-2 font-label uppercase tracking-wide text-xs flex items-center gap-1.5';

// Same taxonomy as /buscar and /colecciones — CATEGORIES is the one
// source of truth, not a separate list per filter UI.
const TYPE_OPTIONS = [{ value: '', label: 'Todos' }, ...CATEGORIES];

function MenuIcon() {
  return (
    <svg viewBox="0 0 14 10" width="12" height="9" aria-hidden="true">
      <line x1="0" y1="1" x2="14" y2="1" stroke="currentColor" />
      <line x1="0" y1="5" x2="14" y2="5" stroke="currentColor" />
      <line x1="0" y1="9" x2="14" y2="9" stroke="currentColor" />
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg viewBox="0 0 14 10" width="12" height="9" aria-hidden="true">
      <circle cx="1.5" cy="1.5" r="1.5" fill="currentColor" />
      <line x1="5" y1="1.5" x2="14" y2="1.5" stroke="currentColor" />
      <circle cx="1.5" cy="8.5" r="1.5" fill="currentColor" />
      <line x1="5" y1="8.5" x2="14" y2="8.5" stroke="currentColor" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 10 10" width="10" height="10" aria-hidden="true">
      <line x1="0" y1="0" x2="10" y2="10" stroke="currentColor" />
      <line x1="10" y1="0" x2="0" y2="10" stroke="currentColor" />
    </svg>
  );
}

function FilterChip({ label, active, onClick }) {
  return (
    <button onClick={onClick} className={DARK_PILL} aria-expanded={active}>
      {label} <span className="text-[10px]">+</span>
    </button>
  );
}

// Center cluster: menu/filter pills. Palmer keeps this separate from the
// drag-hint/zoom cluster, which sits at bottom-right instead of sharing
// this centered row.
function BottomControlBar({ type, setType, resetFilters }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [activeChip, setActiveChip] = useState(null); // 'color' | 'tipo' | 'tamano' | null

  function toggleMenu() {
    setMenuOpen((o) => !o);
    setFilterOpen(false);
    setActiveChip(null);
  }
  function toggleFilter() {
    setFilterOpen((o) => !o);
    setMenuOpen(false);
    setActiveChip(null);
  }
  function toggleChip(chip) {
    setActiveChip((c) => (c === chip ? null : chip));
  }
  function handleReset() {
    resetFilters();
    setActiveChip(null);
  }

  // sticky (not fixed) — same reason as ExperienceToggle above: a
  // viewport-fixed bar would float over Testimonials/footer once you
  // scroll past the gallery.
  return (
    <div className="sticky bottom-5 mt-96 z-30 flex justify-center">
    <div className="relative flex flex-wrap items-center justify-center gap-2 px-4">
      <button onClick={toggleMenu} className={menuOpen ? DARK_PILL : GHOST_PILL}>
        {menuOpen ? <CloseIcon /> : <MenuIcon />}
        {menuOpen ? 'cerrar' : 'menu'}
      </button>
      {menuOpen && (
        <>
          <a href="/colecciones" className={DARK_PILL}>colección</a>
          <a href="/sobre" className={DARK_PILL}>sobre</a>
          {/* Points at the reviews section on the collections index page.
              No "contacto" pill: there's no real destination for it yet (no
              contact page, and a mailto: link launches the visitor's mail
              app, which read as a broken/unexpected interaction) — removed
              rather than fake it. */}
          <a href="/colecciones#resenas" className={DARK_PILL}>reviews</a>
        </>
      )}

      <button onClick={toggleFilter} className={filterOpen ? DARK_PILL : GHOST_PILL}>
        {filterOpen ? <CloseIcon /> : <FilterIcon />}
        {filterOpen ? 'cerrar' : 'filter'}
      </button>
      {filterOpen && (
        <>
          <FilterChip label="color" active={activeChip === 'color'} onClick={() => toggleChip('color')} />
          <FilterChip label="tipo" active={activeChip === 'tipo'} onClick={() => toggleChip('tipo')} />
          <FilterChip label="⌀ tamaño" active={activeChip === 'tamano'} onClick={() => toggleChip('tamano')} />
          <button onClick={handleReset} className={GHOST_PILL}>reset</button>
        </>
      )}

      {activeChip === 'tipo' && (
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 bg-gallery-white border border-line rounded-[9px] p-2 flex gap-1.5">
          {TYPE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setType(opt.value)}
              className={`rounded-full px-3 py-1.5 font-label uppercase tracking-wide text-[10px] ${
                type === opt.value ? 'bg-graphite text-gallery-white' : 'border border-line text-graphite'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
      {(activeChip === 'color' || activeChip === 'tamano') && (
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 bg-gallery-white border border-line rounded-[9px] px-3 py-2 whitespace-nowrap">
          <span className="font-label uppercase tracking-wide text-[10px] text-graphite/50">Próximamente</span>
        </div>
      )}
    </div>
    </div>
  );
}

// Right cluster: drag hint + zoom, deliberately separate from the centered
// menu/filter cluster and right-aligned (Palmer: "sits at bottom-right"),
// small type, not sharing the centered row.
function DragHintAndZoom({ setZoom, showHint }) {
  return (
    <div className="sticky bottom-5 z-30 flex justify-end pr-6">
      <div className="flex items-center gap-2">
        {showHint && (
          <span className="font-label uppercase tracking-wide text-[9px] text-graphite/50">
            drag to explore
          </span>
        )}
        <button
          onClick={() => setZoom((z) => Math.max(0.75, z - 0.15))}
          aria-label="Alejar"
          className="w-6 h-6 rounded-full border border-graphite bg-transparent flex items-center justify-center text-xs text-graphite"
        >
          −
        </button>
        <button
          onClick={() => setZoom((z) => Math.min(1.4, z + 0.15))}
          aria-label="Acercar"
          className="w-6 h-6 rounded-full border border-graphite bg-transparent flex items-center justify-center text-xs text-graphite"
        >
          +
        </button>
      </div>
    </div>
  );
}

export default function Gallery() {
  const [places, setPlaces] = useState([]);
  const [type, setType] = useState('');
  const [view, setView] = useState('scattered');
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    const query = type ? `?type=${type}` : '';
    fetchJsonArray(`/api/places${query}`).then(setPlaces);
  }, [type]);

  function resetFilters() {
    setType('');
  }

  return (
    <section className="relative pb-28">
      <ExperienceToggle view={view} onChange={setView} />

      {view === 'scattered' ? (
        <>
          <ScatteredCanvas items={SCATTER_DEMO_ITEMS} zoom={zoom} />
          {/* No content after the canvas in this view — at least 1/4
              screen of empty space, nothing to scroll into. */}
          <div style={{ height: '25vh' }} aria-hidden="true" />
        </>
      ) : (
        <div
          className="grid gap-px bg-line p-px"
          style={{ gridTemplateColumns: `repeat(${Math.round(3 * zoom)}, minmax(0, 1fr))` }}
        >
          {places.map((place) => (
            <GalleryCard key={place.slug} place={place} variant="grid" />
          ))}
        </div>
      )}

      <BottomControlBar type={type} setType={setType} resetFilters={resetFilters} />
      <DragHintAndZoom setZoom={setZoom} showHint={view === 'scattered'} />
    </section>
  );
}
