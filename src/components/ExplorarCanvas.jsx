// Explorar spec (docs/superpowers/specs/2026-07-26-explorar-colecciones-
// design.md) — the /colecciones free-drag canvas. Built as a separate,
// self-contained implementation rather than a refactor of Gallery.jsx's
// ScatteredCanvas (used by Home.jsx): the two share a lot of the same
// drag/zoom/tile-repeat math, but extracting a shared engine would risk a
// regression on the live Home page with no way to test it short of a full
// Vercel-preview round-trip. See the design doc's architecture-pivot note.
import { useEffect, useLayoutEffect, useRef, useState, useCallback } from 'react';
import { fetchJsonArray } from '../lib/fetchJsonArray.js';
import { CATEGORIES, categoryLabel } from '../lib/categories.js';
import { explorerCutout } from '../lib/photography.js';
import { PIECE_PALETTE } from '../lib/piecePalette.js';
import TopoLines from './TopoLines.jsx';
import RollingPrice from './RollingPrice.jsx';
import ProductFocus from './ProductFocus.jsx';

const CELL_BASE = 210;
const GAP_BASE = 56;
const GRID_COLS = 3;
const GRID_ROWS = 3;
const MOBILE_BREAKPOINT = 640;
const MOBILE_SCALE = 0.56;
const MIN_ZOOM = 0.75;
const MAX_ZOOM = 1.4;
const ZOOM_STEP = 0.15;

// Deliberately non-uniform collage slots (spec §3.1: "columnas flexibles,
// alturas y espaciados variables — nunca grid uniforme"), one per real
// piece, tiled/repeated the same way Gallery.jsx's ScatteredCanvas does.
const TILE_PATTERN = [
  { col: 0, row: 0.3, span: 1.25 },
  { col: 1.55, row: 0, span: 1 },
  { col: 2.2, row: 1.15, span: 0.9 },
  { col: 0.15, row: 1.6, span: 1 },
  { col: 1.3, row: 1.75, span: 1.15 },
  { col: 0.6, row: 2.85, span: 1 },
];

function tilePx({ col, row, span }, cell, gap) {
  return {
    left: col * (cell + gap),
    top: row * (cell + gap),
    size: span * cell + (span - 1) * gap,
  };
}

function cursorLabelFor(place) {
  return place.type === 'juego' ? `Puzzle — ${place.name}` : place.name;
}

function CenterDotIcon() {
  return (
    <svg viewBox="0 0 14 14" width="14" height="14" aria-hidden="true" className="text-graphite/50">
      {[0, 1, 2].flatMap((r) =>
        [0, 1, 2].map((c) => (
          <circle key={`${r}-${c}`} cx={c * 6 + 1} cy={r * 6 + 1} r="1" fill="currentColor" />
        )),
      )}
    </svg>
  );
}

function ExplorarTile({ place, style, onOpen }) {
  const [loaded, setLoaded] = useState(false);
  const [peekLabel, setPeekLabel] = useState(false);
  const holdTimer = useRef(null);
  const photo = explorerCutout(place.slug) ?? place.thumb_url;

  function onTouchStart() {
    holdTimer.current = setTimeout(() => setPeekLabel(true), 200);
  }
  function clearTouch() {
    if (holdTimer.current) clearTimeout(holdTimer.current);
    setTimeout(() => setPeekLabel(false), 200);
  }

  return (
    <div
      style={{ position: 'absolute', ...style }}
      data-cursor-label={cursorLabelFor(place)}
      data-collection={place.type === 'juego' ? 'puzzle' : 'pared'}
      onClick={() => onOpen(place)}
      onTouchStart={onTouchStart}
      onTouchEnd={clearTouch}
      onTouchCancel={clearTouch}
      className="group cursor-pointer select-none"
    >
      {photo ? (
        <img
          src={photo}
          alt={place.name}
          draggable={false}
          onLoad={() => setLoaded(true)}
          className={`w-full h-full object-contain transition-opacity duration-[350ms] ${
            loaded ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ transitionTimingFunction: 'cubic-bezier(0.2,0.6,0.2,1)' }}
        />
      ) : (
        // PLACEHOLDER — no real photo exists yet for this piece (currently
        // only nevado-de-toluca); same TopoLines idiom used elsewhere in
        // this codebase for missing media (e.g. HowItArrives.jsx).
        <div className="w-full h-full flex items-center justify-center opacity-90">
          <TopoLines className="w-2/3 text-graphite/40" />
        </div>
      )}
      <span
        className={`md:hidden fixed z-[90] pointer-events-none -translate-x-1/2 transition-opacity duration-200 ${
          peekLabel ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ left: '50%', bottom: '30%' }}
      >
        <span className="flex items-center justify-center h-9 px-4 rounded-full bg-sello-navy text-dark-bg font-label uppercase tracking-wide text-xs whitespace-nowrap">
          {cursorLabelFor(place)}
        </span>
      </span>
    </div>
  );
}

// Free pannable/zoomable collage: drag translates an offset with inertia on
// release; the tile pattern wraps and repeats around the wrapped origin so
// panning never runs out of tiles (spec §3.1's "se repiten/duplican dentro
// del lienzo"); only fully-in-view tiles render, same reasoning as
// Gallery.jsx — a tile straddling the viewport edge is skipped rather than
// letting overflow:hidden crop it.
function ScatteredField({ places, zoom, onOpen }) {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [interacting, setInteracting] = useState(false);
  const containerRef = useRef(null);
  const draggingRef = useRef(false);
  const startRef = useRef({ x: 0, y: 0 });
  const movedRef = useRef(false);
  const lastPosRef = useRef({ x: 0, y: 0, t: 0 });
  const velocityRef = useRef({ x: 0, y: 0 });
  const inertiaFrameRef = useRef(null);

  // Read the initial size synchronously (getBoundingClientRect, before
  // paint) rather than waiting on ResizeObserver's first async callback —
  // layout itself is computed immediately even when the tab is backgrounded
  // (unlike observer callback delivery, which browsers can defer for a
  // hidden/unfocused tab), so this also avoids a same-frame flash of zero
  // tiles on a normal, focused first load. ResizeObserver still owns
  // updates for any actual resize after mount.
  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    // Falls back to the viewport itself (not 0) when the container's own
    // box hasn't settled yet at this exact synchronous point — the
    // container is styled full-viewport (100vh/w-full) anyway, so this is
    // an accurate stand-in, not a guess, and ResizeObserver corrects it the
    // moment a real resize/observation fires.
    setSize({
      w: rect.width || window.innerWidth,
      h: rect.height || window.innerHeight,
    });
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setSize({ w: entry.contentRect.width, h: entry.contentRect.height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // §3.4 — resize/orientationchange also gets a brief settle instead of an
  // instant snap.
  useEffect(() => {
    function onOrientation() {
      setInteracting(true);
      setTimeout(() => setInteracting(false), 500);
    }
    window.addEventListener('orientationchange', onOrientation);
    return () => window.removeEventListener('orientationchange', onOrientation);
  }, []);

  function stopInertia() {
    if (inertiaFrameRef.current) cancelAnimationFrame(inertiaFrameRef.current);
    inertiaFrameRef.current = null;
  }

  function runInertia() {
    const DECAY = 0.92;
    function tick() {
      velocityRef.current = {
        x: velocityRef.current.x * DECAY,
        y: velocityRef.current.y * DECAY,
      };
      if (Math.hypot(velocityRef.current.x, velocityRef.current.y) < 0.05) {
        setInteracting(false);
        stopInertia();
        return;
      }
      setOffset((o) => ({
        x: o.x + velocityRef.current.x,
        y: o.y + velocityRef.current.y,
      }));
      inertiaFrameRef.current = requestAnimationFrame(tick);
    }
    inertiaFrameRef.current = requestAnimationFrame(tick);
  }

  function onPointerDown(e) {
    stopInertia();
    draggingRef.current = true;
    movedRef.current = false;
    setInteracting(true);
    startRef.current = { x: e.clientX - offset.x, y: e.clientY - offset.y };
    lastPosRef.current = { x: e.clientX, y: e.clientY, t: performance.now() };
    velocityRef.current = { x: 0, y: 0 };
  }
  function onPointerMove(e) {
    if (!draggingRef.current) return;
    const next = {
      x: e.clientX - startRef.current.x,
      y: e.clientY - startRef.current.y,
    };
    if (Math.abs(next.x - offset.x) > 4 || Math.abs(next.y - offset.y) > 4) movedRef.current = true;
    const now = performance.now();
    const dt = Math.max(1, now - lastPosRef.current.t);
    velocityRef.current = {
      x: ((e.clientX - lastPosRef.current.x) / dt) * 16,
      y: ((e.clientY - lastPosRef.current.y) / dt) * 16,
    };
    lastPosRef.current = { x: e.clientX, y: e.clientY, t: now };
    setOffset(next);
  }
  function onPointerUp() {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    if (Math.hypot(velocityRef.current.x, velocityRef.current.y) > 0.3) {
      runInertia();
    } else {
      setInteracting(false);
    }
  }
  // Suppress the tile's own click if that pointerup ended a pan, not a tap.
  function onClickCapture(e) {
    if (movedRef.current) {
      e.preventDefault();
      e.stopPropagation();
    }
  }

  const mobileScale = size.w && size.w < MOBILE_BREAKPOINT ? MOBILE_SCALE : 1;
  const cell = CELL_BASE * mobileScale;
  const gap = GAP_BASE * mobileScale;
  const blockW = GRID_COLS * (cell + gap);
  const blockH = GRID_ROWS * (cell + gap);

  const wrappedX = ((offset.x % blockW) + blockW) % blockW;
  const wrappedY = ((offset.y % blockH) + blockH) % blockH;
  const REPEAT = [-2, -1, 0, 1, 2];
  const centerX = size.w / 2;
  const centerY = size.h / 2;

  const tiles = [];
  if (size.w && size.h && places.length) {
    for (const j of REPEAT) {
      for (const i of REPEAT) {
        const blockLeft = wrappedX + i * blockW - blockW / 2;
        const blockTop = wrappedY + j * blockH - blockH / 2;
        places.forEach((place, idx) => {
          const slot = tilePx(TILE_PATTERN[idx % TILE_PATTERN.length], cell, gap);
          const rawLeft = centerX + blockLeft + slot.left;
          const rawTop = centerY + blockTop + slot.top;
          const screenLeft = centerX + (rawLeft - centerX) * zoom;
          const screenTop = centerY + (rawTop - centerY) * zoom;
          const screenSize = slot.size * zoom;
          const fullyVisible =
            screenLeft >= 0 &&
            screenTop >= 0 &&
            screenLeft + screenSize <= size.w &&
            screenTop + screenSize <= size.h;
          if (!fullyVisible) return;
          tiles.push({
            key: `${i}-${j}-${place.slug}`,
            place,
            left: rawLeft,
            top: rawTop,
            size: slot.size,
          });
        });
      }
    }
  }
  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden select-none cursor-grab active:cursor-grabbing"
      style={{ height: '100vh', touchAction: 'none' }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
      onClickCapture={onClickCapture}
    >
      <div
        className="absolute inset-0"
        style={{
          transform: `scale(${zoom})`,
          transformOrigin: 'center center',
          willChange: interacting ? 'transform' : 'auto',
        }}
      >
        {tiles.map((t) => (
          <ExplorarTile
            key={t.key}
            place={t.place}
            style={{ left: t.left, top: t.top, width: t.size, height: t.size }}
            onOpen={onOpen}
          />
        ))}
      </div>
    </div>
  );
}

function GridCard({ place }) {
  return (
    <a
      href={`/pieza/${place.slug}`}
      className="block border border-line rounded-[9px] bg-gallery-white overflow-hidden"
    >
      <div className="relative aspect-square bg-stone/40 flex items-center justify-center overflow-hidden">
        {explorerCutout(place.slug) || place.thumb_url ? (
          <img
            src={explorerCutout(place.slug) ?? place.thumb_url}
            alt={place.name}
            className="w-full h-full object-contain p-4"
          />
        ) : (
          <TopoLines className="w-1/2 text-graphite/40" />
        )}
      </div>
      <div className="p-3 font-label uppercase tracking-wide text-xs">
        <p className="font-display normal-case text-sm mb-1">{place.name}</p>
        <p className="text-graphite/60 mb-1">{categoryLabel(place.type)}</p>
        <RollingPrice cents={place.base_price} className="font-bold" />
      </div>
    </a>
  );
}

const GHOST_PILL =
  'rounded-full border border-graphite bg-transparent text-graphite px-3 py-2 font-label uppercase tracking-wide text-xs flex items-center gap-1.5';
const DARK_PILL =
  'rounded-full bg-graphite text-gallery-white px-3 py-2 font-label uppercase tracking-wide text-xs flex items-center gap-1.5';

const COLOR_SWATCHES = Object.entries(PIECE_PALETTE).reduce((acc, [, v]) => {
  if (!acc.some((c) => c.token === v.token)) acc.push(v);
  return acc;
}, []);
const SIZE_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: '15x15', label: '15×15 cm' },
  { value: '20x20', label: '20×20 cm' },
];

function BottomBar({ view, setView, zoom, setZoom, type, setType, dragHintVisible }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [activeChip, setActiveChip] = useState(null);

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

  return (
    <div className="fixed bottom-5 inset-x-0 z-30 flex justify-center pointer-events-none">
      <div className="relative flex flex-wrap items-center justify-center gap-2 px-4 max-w-[calc(100vw-2rem)] pointer-events-auto">
        <button onClick={toggleMenu} className={menuOpen ? DARK_PILL : GHOST_PILL}>
          {menuOpen ? '×' : '☰'} {menuOpen ? 'cerrar' : 'menu'}
        </button>
        {menuOpen && (
          <>
            <a href="/colecciones" className={DARK_PILL}>colecciones</a>
            <a href="/sobre" className={DARK_PILL}>sobre</a>
            <a href="/colecciones#resenas" className={DARK_PILL}>reseñas</a>
          </>
        )}

        <button onClick={toggleFilter} className={filterOpen ? DARK_PILL : GHOST_PILL}>
          {filterOpen ? '×' : '⚏'} {filterOpen ? 'cerrar' : 'filter'}
        </button>
        {filterOpen && (
          <>
            <button onClick={() => toggleChip('color')} className={DARK_PILL}>color +</button>
            <button onClick={() => toggleChip('tipo')} className={DARK_PILL}>tipo +</button>
            <button onClick={() => toggleChip('tamano')} className={DARK_PILL}>tamaño +</button>
            <button onClick={() => setType('')} className={GHOST_PILL}>reset</button>
          </>
        )}

        <button
          onClick={() => setView(view === 'scattered' ? 'grid' : 'scattered')}
          className={GHOST_PILL}
        >
          {view === 'scattered' ? 'vista cuadrícula' : 'vista libre'}
        </button>

        {activeChip === 'tipo' && (
          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 bg-gallery-white border border-line rounded-[9px] p-2 flex gap-1.5 flex-wrap max-w-[80vw]">
            {[{ value: '', label: 'Todos' }, ...CATEGORIES].map((opt) => (
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
        {activeChip === 'color' && (
          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 bg-gallery-white border border-line rounded-[9px] p-2 flex gap-2">
            {COLOR_SWATCHES.map((c) => (
              // Inline style, not a dynamic `bg-${token}` class — Tailwind's
              // build-time scanner can't see an interpolated class name, so
              // it would never generate the utility. Referencing the CSS
              // custom property directly (src/index.css's @theme tokens)
              // works regardless of what Tailwind's scanner finds.
              <span
                key={c.token}
                className="w-6 h-6 rounded-full border border-line"
                style={{ backgroundColor: `var(--color-${c.token})` }}
                aria-hidden="true"
              />
            ))}
          </div>
        )}
        {activeChip === 'tamano' && (
          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 bg-gallery-white border border-line rounded-[9px] p-2 flex gap-1.5">
            {SIZE_OPTIONS.map((opt) => (
              <span
                key={opt.value}
                className="rounded-full px-3 py-1.5 font-label uppercase tracking-wide text-[10px] border border-line text-graphite"
              >
                {opt.label}
              </span>
            ))}
          </div>
        )}
      </div>

      {view === 'scattered' && (
        <div className="absolute right-4 flex items-center gap-2 pointer-events-auto">
          {dragHintVisible && (
            <span className="hidden md:inline font-label uppercase tracking-wide text-[9px] text-graphite/50">
              arrastra para explorar
            </span>
          )}
          <button
            onClick={() => setZoom((z) => Math.max(MIN_ZOOM, +(z - ZOOM_STEP).toFixed(2)))}
            disabled={zoom <= MIN_ZOOM}
            aria-label="Alejar"
            className="w-7 h-7 rounded-full border border-graphite bg-transparent flex items-center justify-center text-xs text-graphite disabled:opacity-30 disabled:cursor-not-allowed"
          >
            −
          </button>
          <button
            onClick={() => setZoom((z) => Math.min(MAX_ZOOM, +(z + ZOOM_STEP).toFixed(2)))}
            disabled={zoom >= MAX_ZOOM}
            aria-label="Acercar"
            className="w-7 h-7 rounded-full border border-graphite bg-transparent flex items-center justify-center text-xs text-graphite disabled:opacity-30 disabled:cursor-not-allowed"
          >
            +
          </button>
        </div>
      )}
    </div>
  );
}

export default function ExplorarCanvas({ initialPlaces = [] }) {
  const [places, setPlaces] = useState(initialPlaces);
  const [view, setView] = useState('scattered');
  const [zoom, setZoom] = useState(1);
  const [type, setType] = useState('');
  const [focusPlace, setFocusPlace] = useState(null);
  const [uiVisible, setUiVisible] = useState(false);
  const [centerVisible, setCenterVisible] = useState(false);
  const [dragHintVisible, setDragHintVisible] = useState(true);

  // No type filter: use the parent's already-fetched list (Collections.jsx
  // fetches once and passes it down as initialPlaces) instead of firing a
  // second concurrent /api/places request on mount — two simultaneous
  // requests to the same endpoint was enough to make one of them fail on a
  // cold-started preview deployment, silently emptying the canvas since
  // fetchJsonArray swallows non-ok responses into []. Only filtering by a
  // specific type needs its own request.
  useEffect(() => {
    if (!type) {
      setPlaces(initialPlaces);
      return;
    }
    fetchJsonArray(`/api/places?type=${type}`).then(setPlaces);
  }, [type, initialPlaces]);

  useEffect(() => {
    const t1 = setTimeout(() => setCenterVisible(true), 350);
    const t2 = setTimeout(() => setUiVisible(true), 550);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  const handleOpen = useCallback((place) => {
    setDragHintVisible(false);
    setFocusPlace(place);
  }, []);

  return (
    <section className="relative">
      {view === 'scattered' ? (
        <ScatteredField places={places} zoom={zoom} onOpen={handleOpen} />
      ) : (
        <div className="min-h-screen p-8 pb-28">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {places.map((place) => (
              <GridCard key={place.slug} place={place} />
            ))}
          </div>
        </div>
      )}

      <div
        aria-hidden="true"
        className={`fixed inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-300 ${
          centerVisible && view === 'scattered' ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <CenterDotIcon />
      </div>

      <div className={`transition-opacity duration-300 ${uiVisible ? 'opacity-100' : 'opacity-0'}`}>
        <BottomBar
          view={view}
          setView={setView}
          zoom={zoom}
          setZoom={setZoom}
          type={type}
          setType={setType}
          dragHintVisible={dragHintVisible}
        />
      </div>

      {focusPlace && <ProductFocus place={focusPlace} onClose={() => setFocusPlace(null)} />}
    </section>
  );
}
