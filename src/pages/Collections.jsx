// "Colecciones" index — dos vistas: lista alfabética plana de cada pieza, y
// las mismas piezas agrupadas por serie (src/lib/categories.js SERIES — la
// columna real places.series: Origen/Travesía/Cumbre, brand-brief.md
// sección 3).
// 2026-08-09 landing rebrand hand-off §6 — las reseñas agregadas que vivían
// al fondo de esta página se movieron a MetodoRelieve.jsx (#resenas); esta
// página vuelve a ser solo el catálogo.
// pt-32 (not p-8) — the nav's wordmark logo grew to h-14 (2026-08-09) and
// visibly overlapped this page's H1 at the old p-8 top padding; nav is
// `fixed`/out of flow on purpose (floats over the hero elsewhere), so
// content has to leave room for it instead.
import { useEffect, useState } from 'react';
import { GalleryCard } from '../components/Gallery.jsx';
import { fetchJsonArray } from '../lib/fetchJsonArray.js';
import { SERIES } from '../lib/categories.js';
import { useDocumentHead } from '../lib/useDocumentHead.js';

function byName(a, b) {
  return a.name.localeCompare(b.name, 'es');
}

export default function Collections() {
  const [places, setPlaces] = useState([]);
  const [loadFailed, setLoadFailed] = useState(false);
  const [view, setView] = useState('todos'); // 'todos' | 'categoria'

  useDocumentHead({
    title: 'Colecciones — Relieve',
    description: 'Todos los mapas en relieve de Relieve, o explóralos por serie: Origen, Travesía y Cumbre.',
    canonicalPath: '/colecciones',
  });

  useEffect(() => {
    let cancelled = false;
    // Hallazgo (auditoría 10 ago 2026): distingue "no hay piezas" de "la
    // petición falló".
    fetchJsonArray('/api/places').then(({ data, failed }) => {
      if (cancelled) return;
      setPlaces([...data].sort(byName));
      setLoadFailed(failed);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const bySeries = SERIES.map((s) => ({
    ...s,
    places: places.filter((p) => p.series === s.value).sort(byName),
  })).filter((s) => s.places.length > 0);

  return (
    <main className="pt-32 px-8 pb-8">
      <h1 className="font-heading font-bold text-brand-dark text-3xl mb-6">Colecciones</h1>

      {loadFailed && places.length === 0 && (
        <p className="font-label uppercase tracking-wide text-xs text-graphite/60 mb-6">
          No pudimos cargar el catálogo. Intenta recargar la página.
        </p>
      )}

      {/* apple-design audit (11 ago 2026) — Liquid Glass, same
          pill-glass/pill-glass-active split as everywhere else. */}
      <div className="flex gap-2 mb-8 font-label uppercase tracking-wide text-xs">
        <button
          onClick={() => setView('todos')}
          className={`rounded-full px-4 py-2 font-heading font-bold ${
            view === 'todos' ? 'pill-glass-active text-gallery-white' : 'pill-glass text-brand-dark'
          }`}
        >
          Todos los mapas
        </button>
        <button
          onClick={() => setView('categoria')}
          className={`rounded-full px-4 py-2 font-heading font-bold ${
            view === 'categoria' ? 'pill-glass-active text-gallery-white' : 'pill-glass text-brand-dark'
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
          {bySeries.map((s) => (
            <section key={s.value}>
              <a
                href={`/coleccion/${s.value}`}
                className="block font-label uppercase tracking-wide text-sm mb-3 border-b border-line pb-2 hover:text-passport-ink"
              >
                {s.label}
              </a>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-px bg-line">
                {s.places.map((place) => (
                  <div key={place.slug} className="relative">
                    <GalleryCard place={place} />
                    {/* El puzzle vive dentro de Serie Cumbre, no como categoría
                        aparte — solo distinguido con esta etiqueta (handoff
                        8 ago 2026, sección 1). */}
                    {s.value === 'cumbre' && place.type === 'juego' && (
                      <span className="absolute top-2 left-2 rounded-full bg-brand-dark text-gallery-white px-2 py-1 font-label uppercase tracking-wide text-[10px]">
                        Edición Puzzle
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </main>
  );
}
