// P3 — editorial grid + "pasaporte de los lugares" graphic system
// (sellos, curvas de nivel) per ui-ux.md Sistema gráfico.
// Checkpoint 4 — real photo behind the motifs instead of a flat dark panel.
//
// Copy es borrador — pendiente de revisión/aprobación de Ale antes de
// considerarse final (mismo criterio que Terms.jsx / PrivacyNotice.jsx).
import TopoLines from '../components/TopoLines.jsx';
import Stamp from '../components/Stamp.jsx';
import { ABOUT_PROCESO, ABOUT_IMPRESION } from '../lib/photography.js';
import { useDocumentHead } from '../lib/useDocumentHead.js';

const STEPS = [
  {
    n: '01',
    title: 'Datos de elevación reales',
    body: 'Partimos de datos topográficos del lugar exacto que elegiste — no una interpretación ni un mapa genérico. Si no tenemos el dato real de un lugar, no lo inventamos: lo dejamos fuera del catálogo hasta tenerlo.',
  },
  {
    n: '02',
    title: 'Modelo 3D e impresión',
    body: 'Esos datos se convierten en un modelo tridimensional del terreno y se imprimen en 3D con acabado mate — la misma pieza blanca que ves elevarse en el hero de esta página.',
  },
  {
    n: '03',
    title: 'Marco de nogal macizo',
    body: 'El relieve impreso se monta en un marco de nogal macizo que entra desde los 4 lados y se ensambla a mano, pieza por pieza. Nada de MDF ni chapa: es la madera completa.',
  },
  {
    n: '04',
    title: 'Revisión y empaque',
    body: 'Cada pieza se revisa a mano antes de salir del taller — ajuste del marco, acabado del relieve, limpieza — y se empaca para el envío bajo pedido, no desde inventario.',
  },
];

const NOGAL_REASONS = [
  'Es una madera dura y estable: no se deforma ni se astilla con el tiempo, algo que importa en una pieza que cuelgas y no vuelves a tocar.',
  'Su veta oscura crea contraste con el relieve blanco impreso, así el mapa es lo que se lee primero, no el marco.',
  'Envejece bien — a diferencia de un acabado pintado o laminado, el nogal macizo se ve mejor con los años, no peor.',
];

export default function About() {
  useDocumentHead({
    title: 'Sobre Relieve — Mapas en relieve hechos a mano',
    description: 'Cómo hacemos cada pieza: datos de elevación reales, impresión 3D, marco de nogal armado a mano. Sin coordenadas inventadas.',
    canonicalPath: '/sobre',
  });

  return (
    <main className="max-w-5xl mx-auto p-8">
      <p className="font-label uppercase tracking-wide text-[10px] text-graphite/50 mb-6 border border-line rounded-full inline-block px-3 py-1">
        Borrador — copy pendiente de aprobación final
      </p>

      <div className="grid md:grid-cols-2 gap-12">
        <div className="relative aspect-square rounded-[9px] flex items-center justify-center overflow-hidden">
          <img src={ABOUT_PROCESO} alt="" className="warm-photo absolute inset-0 w-full h-full object-cover" />
          <TopoLines className="absolute inset-0 w-full h-full text-dark-fg mix-blend-screen opacity-70" />
          <Stamp className="relative border-dark-fg text-dark-fg" />
          <p
            className="absolute bottom-4 left-4 font-label uppercase tracking-wide text-[10px] text-dark-fg"
            style={{ textShadow: '0 1px 12px rgba(26,27,25,0.7)' }}
          >
            25.6866° N, 100.3161° W · 540 msnm
          </p>
        </div>

        <div className="leading-relaxed">
          <h1 className="font-display font-light text-3xl mb-6">Sobre Relieve</h1>

          <p className="mb-4">
            Relieve hace mapas en relieve de lugares reales: la topografía de
            una ciudad, montaña, estadio o circuito, impresa en 3D y montada
            en un marco de nogal macizo.
          </p>

          <p className="mb-4">
            Cada pieza se fabrica cuando la pides. No tenemos bodega ni
            inventario por unidad: producimos bajo pedido, en lotes
            pequeños, para no fabricar de más.
          </p>
        </div>
      </div>

      <section className="mt-16">
        <h2 className="font-label uppercase tracking-wide text-xs text-graphite/60 mb-6 border-t border-line pt-4">
          Sin coordenadas inventadas
        </h2>
        <p className="max-w-[65ch] leading-relaxed">
          El catálogo no se llena con lugares genéricos ni terreno
          aproximado. Cada pieza sale de datos de elevación reales del lugar
          exacto — si no tenemos ese dato, el lugar simplemente no está en
          el catálogo todavía, en vez de mostrarte una versión inventada.
          Es más lento que generar terreno de relleno, pero es la única
          forma de que la pieza que cuelgas en tu pared sea el lugar real,
          no una aproximación.
        </p>
      </section>

      <section className="mt-16">
        <h2 className="font-label uppercase tracking-wide text-xs text-graphite/60 mb-6 border-t border-line pt-4">
          El proceso
        </h2>
        <div className="grid sm:grid-cols-2 gap-x-10 gap-y-8">
          {STEPS.map((step) => (
            <div key={step.n}>
              <p className="font-label text-xs text-graphite/40 mb-1">{step.n}</p>
              <h3 className="font-display text-lg mb-1">{step.title}</h3>
              <p className="text-sm leading-relaxed">{step.body}</p>
            </div>
          ))}
        </div>

        <div className="relative aspect-video rounded-[9px] overflow-hidden mt-10">
          <img
            src={ABOUT_IMPRESION}
            alt="Impresión 3D del relieve en proceso"
            className="warm-photo absolute inset-0 w-full h-full object-cover"
          />
        </div>
      </section>

      <section className="mt-16">
        <h2 className="font-label uppercase tracking-wide text-xs text-graphite/60 mb-6 border-t border-line pt-4">
          Materiales
        </h2>
        <p className="max-w-[65ch] leading-relaxed mb-4">
          El relieve del terreno se imprime en 3D con acabado mate. El marco
          es nogal macizo — no MDF, no chapa — que entra desde los 4 lados y
          se ensambla a mano.
        </p>

        <h3 className="font-display text-lg mb-2 mt-6">¿Por qué nogal?</h3>
        <ul className="max-w-[65ch] leading-relaxed list-disc pl-5 space-y-2">
          {NOGAL_REASONS.map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
      </section>
    </main>
  );
}
