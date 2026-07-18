// "Colecciones" index — two views: a flat alphabetical list of every piece,
// and the same pieces grouped by category (src/lib/categories.js, the same
// taxonomy the experience view's "tipo" filter and /buscar use — no
// separate collections taxonomy). Reviews aggregated across all places live
// at the bottom, since there's no longer a single catch-all collection to
// hang them off of.
import { useEffect, useState } from 'react';
import { GalleryCard } from '../components/Gallery.jsx';
import { fetchJsonArray } from '../lib/fetchJsonArray.js';
import { CATEGORIES } from '../lib/categories.js';
import { useDocumentHead } from '../lib/useDocumentHead.js';

function byName(a, b) {
  return a.name.localeCompare(b.name, 'es');
}

export default function Collections() {
  const [places, setPlaces] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [view, setView] = useState('todos'); // 'todos' | 'categoria'

  useDocumentHead({
    title: 'Colecciones — Relieve',
    description: 'Todos los mapas en relieve de Relieve, o explóralos por categoría: ciudades, montañas, estadios y circuitos de México.',
    canonicalPath: '/colecciones',
  });

  useEffect(() => {
    let cancelled = false;
    fetchJsonArray('/api/places').then((data) => {
      if (cancelled) return;
      const sorted = [...data].sort(byName);
      setPlaces(sorted);
      Promise.all(sorted.map((p) => fetchJsonArray(`/api/reviews?place=${p.slug}`))).then((lists) => {
        if (!cancelled) setReviews(lists.flat());
      });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const byCategory = CATEGORIES.map((cat) => ({
    ...cat,
    places: places.filter((p) => p.type === cat.value).sort(byName),
  })).filter((cat) => cat.places.length > 0);

  return (
    <main className="p-8">
      <h1 className="font-display font-light text-3xl mb-6">Colecciones</h1>

      <div className="flex gap-2 mb-8 font-label uppercase tracking-wide text-xs">
        <button
          onClick={() => setView('todos')}
          className={`rounded-full px-4 py-2 border ${
            view === 'todos' ? 'bg-graphite text-gallery-white border-graphite' : 'border-line text-graphite'
          }`}
        >
          Todos los mapas
        </button>
        <button
          onClick={() => setView('categoria')}
          className={`rounded-full px-4 py-2 border ${
            view === 'categoria' ? 'bg-graphite text-gallery-white border-graphite' : 'border-line text-graphite'
          }`}
        >
          Por categoría
        </button>
      </div>

      {view === 'todos' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-px bg-line">
          {places.map((place) => (
            <GalleryCard key={place.slug} place={place} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-10">
          {byCategory.map((cat) => (
            <section key={cat.value}>
              <a
                href={`/coleccion/${cat.value}`}
                className="block font-label uppercase tracking-wide text-sm mb-3 border-b border-line pb-2 hover:text-passport-ink"
              >
                {cat.label}
              </a>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-px bg-line">
                {cat.places.map((place) => (
                  <GalleryCard key={place.slug} place={place} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {reviews.length > 0 && (
        <section id="resenas" className="mt-12 max-w-2xl">
          <h2 className="font-label uppercase tracking-wide text-sm mb-4">Reseñas</h2>
          <ul className="space-y-2">
            {reviews.map((r, i) => (
              <li key={i} className="border-b border-line pb-2">
                <details>
                  <summary className="cursor-pointer font-body">
                    {r.customer ?? 'Cliente'} · {r.city ?? ''} · {'★'.repeat(r.rating)}
                  </summary>
                  <p className="mt-2 text-graphite/80">{r.comment}</p>
                </details>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
