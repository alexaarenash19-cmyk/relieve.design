// Issue #50 — /coleccion/:slug: pieces grid + approved reviews at the bottom
// via <details>/<summary> (native disclosure — no custom component needed).
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { GalleryCard } from '../components/Gallery.jsx';

export default function Collection() {
  const { slug } = useParams();
  const [places, setPlaces] = useState([]);
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/places?collection=${slug}`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        setPlaces(data);
        Promise.all(
          data.map((p) => fetch(`/api/reviews?place=${p.slug}`).then((r) => r.json()).catch(() => []))
        ).then((lists) => {
          if (!cancelled) setReviews(lists.flat());
        });
      })
      .catch(() => setPlaces([]));
    return () => {
      cancelled = true;
    };
  }, [slug]);

  return (
    <main className="p-8">
      <h1 className="font-display font-light text-3xl mb-6 capitalize">{slug.replace(/-/g, ' ')}</h1>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-px bg-line">
        {places.map((place) => (
          <GalleryCard key={place.slug} place={place} />
        ))}
      </div>

      {reviews.length > 0 && (
        <section className="mt-12 max-w-2xl">
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
