// docs/relieve-brand-brief.md sección 5 — "Método Relieve". Único punto de
// entrada desde la ficha de producto: el link "Cómo se hizo esta pieza" en
// Product.jsx, debajo de Personalización (sección 10, punto 9) — no hay
// contenido de este proceso inline en Product.jsx, solo aquí.
//
// 2026-08-09 landing rebrand hand-off §6 — "Reseñas" y "Sobre" dejaron de
// ser rutas/ítems de nav propios (antes /sobre y /colecciones#resenas) y se
// fusionaron aquí como secciones #sobre y #resenas: /sobre redirige aquí
// (vercel.json), y el pasaporte flipbook que antes vivía en pages/About.jsx
// ahora se monta como components/PassportFlipbook.jsx. La lógica de reseñas
// (fetch por lugar) se movió tal cual desde pages/Collections.jsx.
import { useEffect, useState } from 'react';
import { useDocumentHead } from '../lib/useDocumentHead.js';
import { fetchJsonArray } from '../lib/fetchJsonArray.js';
import PassportFlipbook from '../components/PassportFlipbook.jsx';

const STEPS = [
  {
    title: 'Captura',
    detail:
      'No partimos de un mapa genérico. Partimos de datos topográficos reales del lugar, el terreno tal como es.',
  },
  {
    title: 'Curaduría a mano',
    detail:
      'Cada calle, cada edificio, se revisa y se modela a mano, con criterio de arquitecto — para que no se pierda ni un detalle, para que cada pieza se sienta curada, no generada.',
  },
  {
    title: 'Modelado y relieve',
    detail:
      'La geometría curada se convierte en relieve físico, capa por capa, con el mismo cuidado que un modelo de estudio.',
  },
  {
    title: 'Ensamble en parota',
    detail:
      'Cada pieza se enmarca a mano en madera de parota nacional, se revisa, se numera y se firma.',
  },
];

function byName(a, b) {
  return a.name.localeCompare(b.name, 'es');
}

export default function MetodoRelieve() {
  const [reviews, setReviews] = useState([]);

  useDocumentHead({
    title: 'Método Relieve — Relieve',
    description:
      'Cómo se hace cada pieza Relieve: de datos topográficos reales a un relieve físico curado a mano y enmarcado en parota nacional.',
    canonicalPath: '/metodo-relieve',
  });

  // Moved verbatim from Collections.jsx (2026-08-09 hand-off §6) — reviews
  // are aggregated across all places, so this still needs the full place
  // list first, it's just no longer rendered alongside the catalog grid.
  useEffect(() => {
    let cancelled = false;
    fetchJsonArray('/api/places').then((data) => {
      if (cancelled) return;
      const sorted = [...data].sort(byName);
      Promise.all(
        sorted.map((p) => fetchJsonArray(`/api/reviews?place=${p.slug}`)),
      ).then((lists) => {
        if (!cancelled) setReviews(lists.flat());
      });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="mx-auto max-w-[70ch] p-8 leading-relaxed">
      <h1 className="font-heading font-bold text-brand-dark text-3xl mb-2">
        Método Relieve
      </h1>
      <p className="text-graphite/70 mb-10">
        El proceso comparte nombre con la marca — así es como cada pieza
        llega de un lugar real a un relieve físico en tu pared.
      </p>

      <ol className="space-y-8">
        {STEPS.map((step, i) => (
          <li key={step.title} className="flex gap-4">
            <span className="font-label text-graphite/40 text-sm shrink-0 pt-1">
              {String(i + 1).padStart(2, '0')}
            </span>
            <div>
              <h2 className="font-heading font-bold text-brand-dark text-lg mb-1">
                {step.title}
              </h2>
              <p>{step.detail}</p>
            </div>
          </li>
        ))}
      </ol>

      <section id="sobre" className="mt-16 -mx-8">
        <h2 className="font-heading font-bold text-brand-dark text-2xl mb-2 px-8">
          Sobre Relieve
        </h2>
        <PassportFlipbook />
      </section>

      {reviews.length > 0 && (
        <section id="resenas" className="mt-16">
          <h2 className="font-heading font-bold text-brand-dark uppercase tracking-wide text-sm mb-4">
            Reseñas
          </h2>
          <ul className="space-y-2">
            {reviews.map((r, i) => (
              <li key={i} className="border-b border-line pb-2">
                <details>
                  <summary className="cursor-pointer font-body">
                    {r.customer ?? 'Cliente'} · {r.city ?? ''} ·{' '}
                    {'★'.repeat(r.rating)}
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
