// "Colecciones" — the Explorar free-drag canvas (see docs/superpowers/specs/
// 2026-07-26-explorar-colecciones-design.md). Reviews stay aggregated at
// the bottom under the same #resenas anchor Gallery.jsx's menu already
// links to (/colecciones#resenas) — don't rename that id.
import { useEffect, useState } from 'react';
import ExplorarCanvas from '../components/ExplorarCanvas.jsx';
import { fetchJsonArray } from '../lib/fetchJsonArray.js';
import { useDocumentHead } from '../lib/useDocumentHead.js';

export default function Collections() {
  const [reviews, setReviews] = useState([]);

  useDocumentHead({
    title: 'Colecciones — Relieve',
    description: 'Explora todos los mapas en relieve de Relieve en un lienzo interactivo, o cámbialo a vista de cuadrícula.',
    canonicalPath: '/colecciones',
  });

  useEffect(() => {
    let cancelled = false;
    fetchJsonArray('/api/places').then((places) => {
      Promise.all(places.map((p) => fetchJsonArray(`/api/reviews?place=${p.slug}`))).then((lists) => {
        if (!cancelled) setReviews(lists.flat());
      });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main>
      <ExplorarCanvas />

      {reviews.length > 0 && (
        <section id="resenas" className="p-8 max-w-2xl mx-auto">
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
