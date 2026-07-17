// "Experience view" (Palmer-style) gallery, replacing the old rigid grid.
// Two view modes: scattered curated canvas (default) and a plain grid
// ("Card Surface"). Drag-to-rotate stays a CSS 3D tilt, not a WebGL canvas
// per card (see prior note — dozens of live R3F scenes would tank perf).
import { useEffect, useState } from 'react';
import { placeAlt } from '../lib/altText.js';
import { pieceMainPhoto } from '../lib/photography.js';
import Stamp from './Stamp.jsx';
import TopoLines from './TopoLines.jsx';

// Curated, hand-placed offsets — "layout curado, no grid rígido" — cycled
// and scaled if there are more pieces than positions.
const SCATTER_SLOTS = [
  { top: '2%', left: '6%', w: 26, rotate: -3 },
  { top: '14%', left: '38%', w: 22, rotate: 2 },
  { top: '4%', left: '68%', w: 24, rotate: -2 },
  { top: '38%', left: '16%', w: 20, rotate: 3 },
  { top: '46%', left: '52%', w: 26, rotate: -4 },
  { top: '34%', left: '78%', w: 18, rotate: 2 },
  { top: '68%', left: '4%', w: 22, rotate: -2 },
  { top: '72%', left: '40%', w: 24, rotate: 3 },
  { top: '64%', left: '70%', w: 20, rotate: -3 },
];

export function GalleryCard({ place, variant = 'grid', slot }) {
  const [rotateY, setRotateY] = useState(0);
  const [dragStartX, setDragStartX] = useState(null);
  const photo = pieceMainPhoto(place.slug) ?? place.thumb_url;

  function onPointerDown(e) {
    setDragStartX(e.clientX);
  }
  function onPointerMove(e) {
    if (dragStartX === null) return;
    setRotateY((e.clientX - dragStartX) * 0.4);
  }
  function onPointerUp() {
    setDragStartX(null);
  }

  const tileStyle =
    variant === 'scattered'
      ? {
          position: 'absolute',
          top: slot.top,
          left: slot.left,
          width: `${slot.w}%`,
          transform: `rotate(${slot.rotate}deg)`,
        }
      : undefined;

  return (
    <a
      href={`/pieza/${place.slug}`}
      className={
        variant === 'scattered'
          ? 'group block select-none'
          : 'group block border border-line rounded-[9px] bg-gallery-white overflow-hidden select-none'
      }
      style={{ ...tileStyle, perspective: '800px' }}
    >
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        className={`warm-photo relative aspect-square bg-stone flex items-center justify-center cursor-grab active:cursor-grabbing ${
          variant === 'scattered' ? 'shadow-[0_20px_40px_-14px_rgba(35,35,35,0.45)]' : ''
        }`}
        style={{ transform: `rotateY(${rotateY}deg)`, transition: dragStartX ? 'none' : 'transform 0.3s' }}
      >
        {photo ? (
          <img src={photo} alt={placeAlt(place)} className="w-full h-full object-cover" draggable={false} />
        ) : (
          <span className="font-label uppercase tracking-wide text-xs text-graphite/60">{place.name}</span>
        )}
        {/* Route/contour overlay drawn ON the photo, not floating alone. */}
        <TopoLines className="absolute inset-0 w-full h-full text-dark-fg mix-blend-screen opacity-70 pointer-events-none" />
        <Stamp
          label="Ver pieza"
          className="absolute inset-0 m-auto w-fit h-fit opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 bg-gallery-white/90"
        />
      </div>
      {variant !== 'scattered' && <p className="font-display text-sm px-3 py-2">{place.name}</p>}
    </a>
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
          drag to rotate
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
    fetch(`/api/places${query}`).then((res) => res.json()).then(setPlaces).catch(() => setPlaces([]));
    fetch('/api/collections').then((res) => res.json()).then(setCollections).catch(() => setCollections([]));
  }, [type]);

  const filtered = collection ? places.filter((p) => p.collection === collection) : places;

  return (
    <section className="relative pb-28">
      <ExperienceToggle view={view} onChange={setView} />

      {view === 'scattered' ? (
        <div
          className="relative mx-auto"
          style={{ minHeight: '110vh', maxWidth: 1100, transform: `scale(${zoom})`, transformOrigin: 'top center' }}
        >
          {filtered.map((place, i) => (
            <GalleryCard key={place.slug} place={place} variant="scattered" slot={SCATTER_SLOTS[i % SCATTER_SLOTS.length]} />
          ))}
        </div>
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
