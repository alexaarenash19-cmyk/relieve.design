// docs/relieve-brand-brief.md sección 5 — "Método Relieve". Página nueva
// (no existía). Único punto de entrada desde la ficha de producto: el link
// "Cómo se hizo esta pieza" en Product.jsx, debajo de Personalización
// (sección 10, punto 9) — no hay contenido de este proceso inline en
// Product.jsx, solo aquí.
import { useDocumentHead } from '../lib/useDocumentHead.js';

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

export default function MetodoRelieve() {
  useDocumentHead({
    title: 'Método Relieve — Relieve',
    description:
      'Cómo se hace cada pieza Relieve: de datos topográficos reales a un relieve físico curado a mano y enmarcado en parota nacional.',
    canonicalPath: '/metodo-relieve',
  });

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
    </main>
  );
}
