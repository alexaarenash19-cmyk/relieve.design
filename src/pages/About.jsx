// P3 — editorial grid + "pasaporte de los lugares" graphic system
// (sellos, curvas de nivel) per ui-ux.md Sistema gráfico.
// Checkpoint 4 — real photo behind the motifs instead of a flat dark panel.
import TopoLines from '../components/TopoLines.jsx';
import Stamp from '../components/Stamp.jsx';
import { ABOUT_PROCESO } from '../lib/photography.js';
import { useDocumentHead } from '../lib/useDocumentHead.js';

export default function About() {
  useDocumentHead({
    title: 'Sobre Relieve — Mapas en relieve hechos a mano',
    description: 'Cómo hacemos cada pieza: datos de elevación reales, impresión 3D, marco de nogal armado a mano. Sin coordenadas inventadas.',
    canonicalPath: '/sobre',
  });

  return (
    <main className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto p-8">
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
          una ciudad o una montaña, impresa en 3D y montada en un marco de
          nogal. Sin coordenadas inventadas — si no tenemos el dato real, lo
          dejamos en blanco.
        </p>

        <p className="mb-4">
          Cada pieza se fabrica cuando la pides. No tenemos bodega ni
          inventario por unidad: producimos bajo pedido, en lotes pequeños,
          para no fabricar de más.
        </p>

        <h2 className="font-label uppercase tracking-wide text-xs text-graphite/60 mt-8 mb-3 border-t border-line pt-4">
          Proceso
        </h2>
        <p className="mb-4">
          Partimos de datos de elevación reales del lugar elegido. El modelo
          se imprime en 3D, se pinta en acabado mate y se ensambla en un
          marco de nogal hecho a mano. El resultado es una pieza física de un
          lugar que existe, no una ilustración genérica.
        </p>
      </div>
    </main>
  );
}
