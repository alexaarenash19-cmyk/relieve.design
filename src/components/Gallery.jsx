// "Experience view" (Palmer-style) gallery, replacing the old rigid grid.
// Two view modes: scattered infinite canvas (default) and a plain grid
// ("Card Surface").
import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { placeAlt } from '../lib/altText.js';
import { pieceMainPhoto, thumbUrlForWidth } from '../lib/photography.js';
import { fetchJsonArray } from '../lib/fetchJsonArray.js';
import { CATEGORIES, categoryLabel } from '../lib/categories.js';
import { SIZES } from '../lib/catalog.js';
import { useProductPanel } from '../context/ProductPanelContext.jsx';
import Stamp from './Stamp.jsx';

// Uniform-cell brick grid — Ale's 2026-07-27 spec, measured directly off
// the live site: every cell is the same fixed 175x175 footprint at a
// 255px pitch (175 cell + 80 gap). The "one big, one small" look comes
// entirely from each piece's own photo crop (some fill the frame, some
// leave a lot of margin), never from varying the cell/footprint size —
// replaces the old hand-placed 1x1/2x2 TILE_PATTERN. Even columns
// (0-indexed col % 2 === 1) are pushed down COL_OFFSET_BASE so rows don't
// align into a rigid checkerboard.
const CELL_BASE = 175;
const GAP_BASE = 80;
const COL_OFFSET_BASE = 88;
const GRID_COLS = 3;
const GRID_ROWS = 3;
const MOBILE_BREAKPOINT = 640;
const MOBILE_SCALE = 0.62;

// Matches the artifact's priceLabel() exactly — used by the "vista
// cuadrícula" toggle's card meta (name + tipo + price), which the plain
// shared 'grid' variant (used by /buscar, /colecciones) doesn't show.
function priceLabel(cents) {
  return '$' + (cents / 100).toLocaleString('es-MX', { minimumFractionDigits: 0 }) + ' MXN';
}

export function GalleryCard({ place, variant = 'grid', slot }) {
  const { openProduct } = useProductPanel();
  const photo = thumbUrlForWidth(
    pieceMainPhoto(place.slug) ?? place.thumb_url,
    360,
  );
  const cursorLabel = variant === 'scattered' ? `+ ${place.name}` : undefined;
  const [loaded, setLoaded] = useState(false);
  const rootRef = useRef(null);

  // Entrance pop, confirmed 2026-07-27 against the artifact's actual JS
  // (gsap.set/gsap.to on tile creation) — GSAP, not a CSS keyframe, exact
  // values: duration 0.5s / ease power1.inOut / delay Math.random()*0.4,
  // 0.01s duration under prefers-reduced-motion. No rotation or 3D
  // perspective — confirmed absent from the artifact, not invented here.
  // Runs once per mount (React mounts/unmounts a tile's DOM node each time
  // it scrolls in/out of the visible window, unlike the artifact's
  // plain-DOM version which reused elements and only played this once
  // ever per element — a reasonable approximation given that difference).
  // GSAP tweens the inline style directly and then stops touching the
  // element, so .canvas-tile:hover's own animation/transition (already
  // ported, untouched here) has nothing to fight afterward.
  useEffect(() => {
    if (variant !== 'scattered' || !rootRef.current) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    gsap.set(rootRef.current, { scale: 0, opacity: 0 });
    gsap.to(rootRef.current, {
      scale: 1,
      opacity: 1,
      duration: reduced ? 0.01 : 0.5,
      ease: 'power1.inOut',
      delay: reduced ? 0 : Math.random() * 0.4,
    });
  }, [variant]);

  const tileStyle =
    variant === 'scattered'
      ? {
          position: 'absolute',
          top: slot.top,
          left: slot.left,
          width: slot.size,
          height: slot.size,
        }
      : undefined;

  // Scattered (canvas) tiles open the product panel in place — a real
  // navigation here would tear down the whole canvas just to preview one
  // piece. Grid tiles (search/collections pages) keep navigating normally;
  // /pieza/:slug stays the real destination either way (panel CTA, direct
  // links, SEO).
  function handleClick(e) {
    if (variant !== 'scattered') return;
    e.preventDefault();
    openProduct(place.slug);
  }

  return (
    <a
      ref={rootRef}
      href={`/pieza/${place.slug}`}
      onClick={handleClick}
      data-cursor-label={cursorLabel}
      className={
        variant === 'scattered'
          ? 'group block select-none canvas-tile'
          : variant === 'explorarGrid'
            // "vista cuadrícula" toggle only (this file) — the artifact's
            // .grid-card is a flat, borderless tile; the hairline seams
            // between cards come from the wrap's own gap-px/bg-line, not a
            // per-card border. Deliberately a separate variant, not a
            // change to the shared 'grid' below (used by /buscar and
            // /colecciones — those keep their own bordered-card look).
            ? 'group block bg-gallery-white overflow-hidden select-none'
            : 'group block border border-line rounded-[9px] bg-gallery-white overflow-hidden select-none'
      }
      style={tileStyle}
    >
      <div
        className={`warm-photo relative w-full h-full aspect-square bg-stone overflow-hidden flex items-center justify-center ${
          variant === 'scattered'
            ? 'shadow-[0_16px_32px_-16px_rgba(35,35,35,0.35)]'
            : ''
        }`}
      >
        {photo ? (
          <img
            src={photo}
            alt={placeAlt(place)}
            onLoad={() => setLoaded(true)}
            className={
              variant === 'scattered'
                // Canvas tiles: the outer .canvas-tile handles scale/lift/
                // rotate on hover (see index.css) — the image itself only
                // gets the artifact's own drop-shadow deepen, not a second
                // independent scale (that would compound with the tile's).
                ? `w-full h-full object-cover transition-[filter,opacity] duration-300 drop-shadow-[0_1px_1px_rgba(35,35,35,0.06)] group-hover:drop-shadow-[0_16px_22px_rgba(35,35,35,0.2)] ${
                    loaded ? 'opacity-100' : 'opacity-0'
                  }`
                : `w-full h-full object-cover transition-[transform,opacity] duration-300 group-hover:scale-105 ${
                    loaded ? 'opacity-100' : 'opacity-0'
                  }`
            }
            draggable={false}
            loading="eager"
            decoding="async"
          />
        ) : (
          <span className="font-label uppercase tracking-wide text-xs text-graphite/60">
            {place.name}
          </span>
        )}
        {variant === 'grid' && (
          <Stamp
            label="Ver pieza"
            className="absolute inset-0 m-auto w-fit h-fit opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 bg-gallery-white/90"
          />
        )}
      </div>
      {variant === 'explorarGrid' && (
        <div className="pt-[14px] px-1 pb-[22px]">
          <p className="font-display font-normal text-base m-0 mb-1">{place.name}</p>
          <p className="font-label uppercase tracking-wide text-[11px] text-graphite/55 flex gap-2 m-0">
            <span>{categoryLabel(place.type)}</span>
            <span className="font-bold text-graphite">{priceLabel(place.base_price)}</span>
          </p>
        </div>
      )}
      {variant === 'grid' && (
        <p className="font-display text-sm px-3 py-2">{place.name}</p>
      )}
    </a>
  );
}

// Infinite pannable canvas: drag translates an offset; the grid wraps
// (modulo blockW/blockH) and repeats in a grid of copies around the
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
    const next = {
      x: e.clientX - startRef.current.x,
      y: e.clientY - startRef.current.y,
    };
    // >6px (not >4) before counting as a drag — a tighter threshold was
    // swallowing taps on the canvas that worked fine from the plain grid
    // view (which has no drag detection at all), since any pointer jitter
    // past the old threshold canceled the click that opens ProductPanel.
    if (Math.abs(next.x - offset.x) > 6 || Math.abs(next.y - offset.y) > 6)
      movedRef.current = true;
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

  const mobileScale = size.w && size.w < MOBILE_BREAKPOINT ? MOBILE_SCALE : 1;
  const cell = CELL_BASE * mobileScale;
  const gap = GAP_BASE * mobileScale;
  const colOffsetY = COL_OFFSET_BASE * mobileScale;
  const step = cell + gap;
  const blockW = GRID_COLS * step;
  const blockH = GRID_ROWS * step;

  const wrappedX = ((offset.x % blockW) + blockW) % blockW;
  const wrappedY = ((offset.y % blockH) + blockH) % blockH;
  // Enough repeats either side to cover the viewport even when zoomed out
  // (min zoom 0.75 needs ~1.3x the unzoomed span) and at wide viewports.
  const REPEAT = [-2, -1, 0, 1, 2];
  const centerX = size.w / 2;
  const centerY = size.h / 2;

  const tiles = [];
  if (size.w && size.h && items.length) {
    for (const j of REPEAT) {
      for (const i of REPEAT) {
        const blockLeft = wrappedX + i * blockW - blockW / 2;
        const blockTop = wrappedY + j * blockH - blockH / 2;
        for (let row = 0; row < GRID_ROWS; row++) {
          for (let col = 0; col < GRID_COLS; col++) {
            const cellIdx = row * GRID_COLS + col;
            const place = items[cellIdx % items.length];
            const rawLeft = centerX + blockLeft + col * step;
            const rawTop =
              centerY + blockTop + row * step + (col % 2 === 1 ? colOffsetY : 0);
            const screenLeft = centerX + (rawLeft - centerX) * zoom;
            const screenTop = centerY + (rawTop - centerY) * zoom;
            const screenSize = cell * zoom;
            const fullyVisible =
              screenLeft >= 0 &&
              screenTop >= 0 &&
              screenLeft + screenSize <= size.w &&
              screenTop + screenSize <= size.h;
            if (!fullyVisible) continue;
            tiles.push({
              key: `${i}-${j}-${row}-${col}-${place.slug}`,
              place,
              left: rawLeft,
              top: rawTop,
              size: cell,
            });
          }
        }
      }
    }
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden select-none cursor-grab active:cursor-grabbing"
      // Pointer events already handle touch same as mouse (drag-to-explore
      // needs no separate mobile implementation) — but without this, a
      // touch-drag here would also try to natively scroll the page at the
      // same time, since touch gestures default to scrolling unless told
      // otherwise. Blocks that conflict; panning inside a full-viewport
      // canvas is a familiar mobile pattern (maps apps), not something to
      // replace on small screens.
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
        }}
      >
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
          {[0, 1, 2].flatMap((r) =>
            [0, 1, 2].map((c) => (
              <circle
                key={`${r}-${c}`}
                cx={c * 5 + 1}
                cy={r * 5 + 1}
                r="1"
                fill="currentColor"
              />
            )),
          )}
        </svg>
        {view === 'scattered' ? 'vista cuadrícula' : 'vista lienzo'}
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

// Every piece is made to order in any size/color — these chips don't
// narrow `places` (there's no per-piece size/color field), they're a
// preview toggle so visitors can browse the format they're picturing.
// SIZES is the same catalog used at checkout (src/lib/catalog.js).
const SIZE_OPTIONS = [
  { value: '', label: 'Todos' },
  ...SIZES.map((s) => ({ value: s.code, label: s.label })),
];
const COLOR_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'blanco', label: 'Blanco' },
  { value: 'negro', label: 'Negro mate' },
];

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

function reduceMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// Menu toggle icon: square -> circle, three lines -> an X, label slides
// away — a one-shot GSAP timeline (played/reversed on click), ported
// verbatim from the artifact's menuIconTl. This is a discrete,
// user-triggered timeline, not tied to the page-load scroll ticker, so it
// doesn't carry the shared-ticker risk noted for the old tile-entrance
// GSAP attempt.
function MenuButton({ open, onToggle }) {
  const btnRef = useRef(null);
  const boxRef = useRef(null);
  const lineTopRef = useRef(null);
  const lineMidRef = useRef(null);
  const lineBotRef = useRef(null);
  const labelRef = useRef(null);
  const tlRef = useRef(null);

  useEffect(() => {
    const tl = gsap.timeline({ paused: true })
      .to(boxRef.current, { borderRadius: '3em', duration: 0.8, ease: 'power2.out' }, 0)
      .to(lineMidRef.current, { scaleX: 0, duration: 0.6, ease: 'back.out(1.7)' }, 0)
      .to(lineTopRef.current, { rotate: 45, marginTop: 0, duration: 0.7, ease: 'back.out(1.7)' }, 0)
      .to(lineBotRef.current, { rotate: -45, marginTop: 0, duration: 0.7, ease: 'back.out(1.7)' }, 0)
      .to(labelRef.current, { yPercent: 200, opacity: 0, duration: 0.6, ease: 'back.out(1.7)' }, 0);
    if (window.innerWidth < MOBILE_BREAKPOINT) {
      tl.to(btnRef.current, { x: '2.5em', duration: 0.7, ease: 'back.out(1.7)' }, 0);
    }
    if (reduceMotion()) tl.duration(0.01);
    tlRef.current = tl;
    return () => tl.kill();
  }, []);

  useEffect(() => {
    tlRef.current?.[open ? 'play' : 'reverse']();
  }, [open]);

  function onEnter() {
    if (open) {
      gsap.to(lineTopRef.current, { rotate: 35, duration: 0.3, ease: 'power2.out' });
      gsap.to(lineBotRef.current, { rotate: -35, duration: 0.3, ease: 'power2.out' });
    } else {
      gsap.to(lineMidRef.current, { scaleX: 0.4, duration: 0.3, ease: 'power2.out' });
    }
  }
  function onLeave() {
    if (open) {
      gsap.to(lineTopRef.current, { rotate: 45, duration: 0.3, ease: 'power2.out' });
      gsap.to(lineBotRef.current, { rotate: -45, duration: 0.3, ease: 'power2.out' });
    } else {
      gsap.to(lineMidRef.current, { scaleX: 1, duration: 0.3, ease: 'power2.out' });
    }
  }

  return (
    <button
      ref={btnRef}
      onClick={onToggle}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      className="rounded-full border border-graphite bg-transparent text-graphite pl-[10px] pr-4 py-2 font-label uppercase tracking-wide text-xs inline-flex items-center gap-2 overflow-hidden"
    >
      <span ref={boxRef} className="explorar-menu-icon-box">
        <span ref={lineTopRef} className="explorar-menu-line explorar-line-top" />
        <span ref={lineMidRef} className="explorar-menu-line" />
        <span ref={lineBotRef} className="explorar-menu-line explorar-line-bot" />
      </span>
      <span className="explorar-menu-label-clip">
        <span ref={labelRef} className="explorar-menu-label">menu</span>
      </span>
    </button>
  );
}

function liftOnHover(e) {
  gsap.to(e.currentTarget, { y: -4, duration: 0.3, ease: 'power2.out' });
}
function liftOffHover(e) {
  gsap.to(e.currentTarget, { y: 0, duration: 0.3, ease: 'power2.out' });
}

// Shared by the menu-links row and the filter-chips row: the panel sits
// inline in the bottom bar and grows the row's width open (not a floating
// dropdown — that's the separate absolutely-positioned chip-value lists
// below), matching the artifact's .inline-panel + openMenuPanel/
// closeMenuPanel technique exactly, generalized to take any children.
function InlinePanel({ open, children }) {
  const panelRef = useRef(null);
  const didMountRef = useRef(false);

  useEffect(() => {
    const el = panelRef.current;
    if (!el) return;
    const reduced = reduceMotion();
    const kids = [...el.children];
    if (!didMountRef.current) {
      didMountRef.current = true;
      el.style.width = '0px';
      el.style.display = 'none';
      gsap.set(kids, { yPercent: 800, opacity: 0 });
      return;
    }
    if (open) {
      el.style.display = 'flex';
      el.style.width = 'auto';
      const targetW = el.offsetWidth;
      gsap.fromTo(
        el,
        { width: 0 },
        {
          width: targetW,
          duration: reduced ? 0.01 : 0.6,
          ease: 'power2.out',
          onComplete: () => { el.style.width = 'auto'; },
        },
      );
      gsap.fromTo(
        kids,
        { yPercent: 800, opacity: 0 },
        { yPercent: 0, opacity: 1, duration: reduced ? 0.01 : 0.6, ease: 'back.out(1.7)', stagger: 0.08, delay: 0.05 },
      );
    } else {
      gsap.to(kids, { yPercent: 800, opacity: 0, duration: reduced ? 0.01 : 0.4, ease: 'back.in(1.7)', stagger: 0.05 });
      gsap.to(el, {
        width: 0,
        duration: reduced ? 0.01 : 0.5,
        ease: 'power2.out',
        delay: 0.05,
        onComplete: () => { el.style.display = 'none'; },
      });
    }
  }, [open]);

  return (
    <div
      ref={panelRef}
      className="flex gap-2 overflow-hidden whitespace-nowrap items-center"
      style={{ display: 'none', width: 0 }}
    >
      {children}
    </div>
  );
}

// Center cluster: menu/filter pills. Palmer keeps this separate from the
// drag-hint/zoom cluster, which sits at bottom-right instead of sharing
// this centered row.
function BottomControlBar({
  type,
  setType,
  size,
  setSize,
  color,
  setColor,
  resetFilters,
}) {
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

  // fixed (not sticky) — always floating and clickable regardless of scroll
  // position in the infinite canvas, per Ale's feedback (was sticky, which
  // stopped tracking once you scrolled past its containing section).
  return (
    <div className="fixed bottom-5 inset-x-0 z-30 flex justify-center pointer-events-none">
      <div className="relative flex flex-wrap items-center justify-center gap-2 px-4 max-w-[calc(100vw-28rem)] pointer-events-auto">
        <MenuButton open={menuOpen} onToggle={toggleMenu} />
        <InlinePanel open={menuOpen}>
          <a href="/colecciones" className={DARK_PILL} onMouseEnter={liftOnHover} onMouseLeave={liftOffHover}>
            colecciones
          </a>
          <a href="/sobre" className={DARK_PILL} onMouseEnter={liftOnHover} onMouseLeave={liftOffHover}>
            sobre
          </a>
          {/* Points at the reviews section on the collections index page.
            No "contacto" pill: there's no real destination for it yet (no
            contact page, and a mailto: link launches the visitor's mail
            app, which read as a broken/unexpected interaction) — removed
            rather than fake it. */}
          <a
            href="/colecciones#resenas"
            className={DARK_PILL}
            onMouseEnter={liftOnHover}
            onMouseLeave={liftOffHover}
          >
            reseñas
          </a>
        </InlinePanel>

        <button
          onClick={toggleFilter}
          className={filterOpen ? DARK_PILL : GHOST_PILL}
        >
          {filterOpen ? <CloseIcon /> : <FilterIcon />}
          {filterOpen ? 'cerrar' : 'filtrar'}
        </button>
        <InlinePanel open={filterOpen}>
          <FilterChip
            label="color"
            active={activeChip === 'color'}
            onClick={() => toggleChip('color')}
          />
          <FilterChip
            label="tipo"
            active={activeChip === 'tipo'}
            onClick={() => toggleChip('tipo')}
          />
          <FilterChip
            label="⌀ tamaño"
            active={activeChip === 'tamano'}
            onClick={() => toggleChip('tamano')}
          />
          <button onClick={handleReset} className={`${GHOST_PILL} group`}>
            <span className="inline-block transition-transform duration-1000 ease-[cubic-bezier(0.2,0.6,0.2,1)] group-hover:rotate-[360deg]">
              ↻
            </span>{' '}
            reset
          </button>
        </InlinePanel>

        {activeChip === 'tipo' && (
          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 bg-gallery-white border border-line rounded-[9px] p-2 flex gap-1.5">
            {TYPE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setType(opt.value)}
                className={`rounded-full px-3 py-1.5 font-label uppercase tracking-wide text-[10px] ${
                  type === opt.value
                    ? 'bg-graphite text-gallery-white'
                    : 'border border-line text-graphite'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
        {activeChip === 'color' && (
          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 bg-gallery-white border border-line rounded-[9px] p-2 flex gap-1.5">
            {COLOR_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setColor(opt.value)}
                className={`rounded-full px-3 py-1.5 font-label uppercase tracking-wide text-[10px] ${
                  color === opt.value
                    ? 'bg-graphite text-gallery-white'
                    : 'border border-line text-graphite'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
        {activeChip === 'tamano' && (
          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 bg-gallery-white border border-line rounded-[9px] p-2 flex gap-1.5">
            {SIZE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setSize(opt.value)}
                className={`rounded-full px-3 py-1.5 font-label uppercase tracking-wide text-[10px] ${
                  size === opt.value
                    ? 'bg-graphite text-gallery-white'
                    : 'border border-line text-graphite'
                }`}
              >
                {opt.label}
              </button>
            ))}
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
    <div className="sticky bottom-5 z-30 flex justify-end pr-6 pointer-events-none">
      <div className="flex items-center gap-2 pointer-events-auto">
        {showHint && (
          <span className="font-label uppercase tracking-wide text-[9px] text-graphite/50">
            arrastra para explorar
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

// PRD sección 3.2 — the canvas mounts oversized and settles down to its
// final scale right after the hero-once wipe reveals it (Home.jsx passes
// zoomIn only for that one transition, never on a direct/repeat load).
// Two renders on purpose: paint at scale(1.15) first, THEN flip to 1 on the
// next frame — setting both in the same render never animates, since CSS
// transitions only fire on a *change* the browser gets to paint in between.
function useZoomIn(zoomIn) {
  const [settled, setSettled] = useState(!zoomIn);
  useEffect(() => {
    if (!zoomIn) return;
    const id = requestAnimationFrame(() => setSettled(true));
    return () => cancelAnimationFrame(id);
  }, [zoomIn]);
  return settled;
}

export default function Gallery({ zoomIn = false }) {
  const [places, setPlaces] = useState([]);
  const [type, setType] = useState('');
  // size/color are a browsing preview only — every piece is made to order
  // in any size/color, so these don't touch the /api/places query.
  const [size, setSize] = useState('');
  const [color, setColor] = useState('');
  const [view, setView] = useState('scattered');
  const [zoom, setZoom] = useState(1);
  const settled = useZoomIn(zoomIn);

  useEffect(() => {
    const query = type ? `?type=${type}` : '';
    fetchJsonArray(`/api/places${query}`).then(setPlaces);
  }, [type]);

  function resetFilters() {
    setType('');
    setSize('');
    setColor('');
  }

  return (
    <section className="relative pb-28">
      {/* transform lives here, not on the <section> itself — a transform
          on any ancestor of a `position: fixed` element makes it a new
          containing block, which was trapping BottomControlBar's
          `fixed bottom-5` inside this (much taller than one screen)
          section instead of the real viewport. Keeping BottomControlBar
          and DragHintAndZoom as direct children of the untransformed
          <section> below fixes that. */}
      <div
        className="transition-transform duration-500 ease-out"
        style={{
          transform: settled
            ? 'scale(1) translateY(0)'
            : 'scale(1.15) translateY(-70px)',
        }}
      >
        <ExperienceToggle view={view} onChange={setView} />

        {view === 'scattered' ? (
          <>
            <ScatteredCanvas items={places} zoom={zoom} />
            {/* No content after the canvas in this view — at least 1/4
                screen of empty space, nothing to scroll into. */}
            <div style={{ height: '25vh' }} aria-hidden="true" />
          </>
        ) : (
          // Artifact's #grid-view/.grid-wrap exactly: responsive auto-fill
          // columns (not tied to the canvas zoom stepper — the artifact's
          // grid view doesn't respond to zoom at all, it's a separate
          // fixed layout), max-width 1100px centered, top/bottom page
          // padding matching a full-page scrollable view rather than the
          // canvas's fixed 100vh.
          <div className="pt-[110px] px-6 pb-[140px]">
            <div
              className="grid gap-px bg-line max-w-[1100px] mx-auto"
              style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}
            >
              {places.map((place) => (
                <GalleryCard key={place.slug} place={place} variant="explorarGrid" />
              ))}
            </div>
          </div>
        )}
      </div>

      <BottomControlBar
        type={type}
        setType={setType}
        size={size}
        setSize={setSize}
        color={color}
        setColor={setColor}
        resetFilters={resetFilters}
      />
      <DragHintAndZoom setZoom={setZoom} showHint={view === 'scattered'} />
    </section>
  );
}
