// Issue #48 — infinite gallery grid. "Drag-to-rotate mini 3D preview" is implemented
// as a lightweight CSS 3D tilt (not a WebGL canvas per card — dozens of live R3F
// scenes on one grid would tank perf); the hero's real R3F scene is issue #44.
import { useEffect, useState } from 'react';
import { placeAlt } from '../lib/altText.js';

export function GalleryCard({ place }) {
  const [rotateY, setRotateY] = useState(0);
  const [dragStartX, setDragStartX] = useState(null);

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

  return (
    <a
      href={`/pieza/${place.slug}`}
      className="block border border-line rounded-[9px] bg-gallery-white overflow-hidden select-none"
      style={{ perspective: '800px' }}
    >
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        className="aspect-square bg-stone flex items-center justify-center cursor-grab active:cursor-grabbing"
        style={{ transform: `rotateY(${rotateY}deg)`, transition: dragStartX ? 'none' : 'transform 0.3s' }}
      >
        {place.thumb_url ? (
          <img src={place.thumb_url} alt={placeAlt(place)} className="w-full h-full object-cover" draggable={false} />
        ) : (
          <span className="font-label uppercase tracking-wide text-xs text-graphite/60">{place.name}</span>
        )}
      </div>
      <p className="font-display text-sm px-3 py-2">{place.name}</p>
    </a>
  );
}

export default function Gallery() {
  const [places, setPlaces] = useState([]);
  const [type, setType] = useState('');
  const [cols, setCols] = useState(3);

  useEffect(() => {
    const query = type ? `?type=${type}` : '';
    fetch(`/api/places${query}`)
      .then((res) => res.json())
      .then(setPlaces)
      .catch(() => setPlaces([]));
  }, [type]);

  return (
    <section className="relative pb-24">
      <div
        className="grid gap-px bg-line p-px"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {places.map((place) => (
          <GalleryCard key={place.slug} place={place} />
        ))}
      </div>

      <div className="fixed bottom-6 left-1/2 -translate-x-1/2">
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="font-label uppercase tracking-wide text-xs border border-line rounded-full px-4 py-2 bg-gallery-white"
        >
          <option value="">Todos</option>
          <option value="ciudad">Ciudades</option>
          <option value="montana">Montañas</option>
        </select>
      </div>

      <div className="fixed bottom-6 right-6 flex gap-1">
        {[2, 3, 4].map((n) => (
          <button
            key={n}
            onClick={() => setCols(n)}
            aria-label={`${n} columnas`}
            className={`w-8 h-8 rounded-full border border-line text-xs font-label ${
              cols === n ? 'bg-sello-navy text-dark-bg' : 'bg-gallery-white'
            }`}
          >
            {n}
          </button>
        ))}
      </div>
    </section>
  );
}
