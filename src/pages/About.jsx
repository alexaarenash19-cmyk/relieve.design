// P3 — editorial grid + "pasaporte de los lugares" graphic system
// (sellos, curvas de nivel) per ui-ux.md Sistema gráfico.
import TopoLines from '../components/TopoLines.jsx';
import Stamp from '../components/Stamp.jsx';

export default function About() {
  return (
    <main className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto p-8">
      <div className="relative aspect-square bg-dark-bg text-dark-fg rounded-[9px] flex items-center justify-center overflow-hidden">
        <TopoLines className="absolute inset-0 w-full h-full text-dark-fg/40" />
        <Stamp className="relative border-dark-fg text-dark-fg" />
        <p className="absolute bottom-4 left-4 font-label uppercase tracking-wide text-[10px] text-dark-fg/60">
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
