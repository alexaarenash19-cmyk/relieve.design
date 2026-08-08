// Issue #50 — /coleccion/:slug: pieces in one series, grid + approved
// reviews at the bottom via <details>/<summary> (native disclosure — no
// custom component needed). `:slug` is a series value (src/lib/
// categories.js SERIES: origen/travesia/cumbre — places.series column),
// not a separate collections-table slug — seriesLabel() gives the proper
// display name instead of title-casing the raw slug.
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { GalleryCard } from '../components/Gallery.jsx';
import { fetchJsonArray } from '../lib/fetchJsonArray.js';
import { seriesLabel } from '../lib/categories.js';

export default function Collection() {
  const { slug } = useParams();
  const [places, setPlaces] = useState([]);
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    let cancelled = false;
    fetchJsonArray(`/api/places?series=${slug}`).then((data) => {
      if (cancelled) return;
      const sorted = [...data].sort((a, b) => a.name.localeCompare(b.name, 'es'));
      setPlaces(sorted);
      Promise.all(sorted.map((p) => fetchJsonArray(`/api/reviews?place=${p.slug}`))).then((lists) => {
        if (!cancelled) setReviews(lists.flat());
      });
    });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  return (
    <main className="p-8">
      <h1 className="font-heading font-bold text-brand-dark text-3xl mb-6">{seriesLabel(slug)}</h1>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-px bg-line">
        {places.map((place) => (
          <GalleryCard key={place.slug} place={place} />
        ))}
      </div>

      {reviews.length > 0 && (
        <section id="resenas" className="mt-12 max-w-2xl">
          <h2 className="font-heading font-bold text-brand-dark uppercase tracking-wide text-sm mb-4">Reseñas</h2>
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
