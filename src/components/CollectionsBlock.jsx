// Issue #50 — comprar-por-colección: half-screen block, slow hover zoom.
// Shared-element transition into /coleccion/:slug is motion polish saved for
// after M1/M2 land (ui-ux.md — "listo para construir, no para documentar más").
import { useEffect, useState } from 'react';

export default function CollectionsBlock() {
  const [collections, setCollections] = useState([]);

  useEffect(() => {
    fetch('/api/collections').then((res) => res.json()).then(setCollections).catch(() => setCollections([]));
  }, []);

  if (collections.length === 0) return null;

  return (
    <section className="min-h-[50vh] grid sm:grid-cols-2 gap-px bg-line">
      {collections.map((c) => (
        <a key={c.slug} href={`/coleccion/${c.slug}`} className="relative overflow-hidden bg-stone group">
          {c.photo_url ? (
            <img
              src={c.photo_url}
              alt={`Colección ${c.name} — piezas en relieve enmarcadas`}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
          ) : (
            <div className="w-full h-full min-h-[240px]" />
          )}
          <p className="absolute bottom-4 left-4 font-display text-xl text-bg bg-navy/80 px-3 py-1 rounded">
            {c.name}
          </p>
        </a>
      ))}
    </section>
  );
}
