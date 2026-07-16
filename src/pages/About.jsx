export default function About() {
  return (
    <main className="mx-auto max-w-[70ch] p-8 leading-relaxed">
      <h1 className="font-display font-light text-3xl mb-6">Sobre Relieve</h1>

      <p className="mb-4">
        Relieve hace mapas en relieve de lugares reales: la topografía de una
        ciudad o una montaña, impresa en 3D y montada en un marco de nogal.
        Sin coordenadas inventadas — si no tenemos el dato real, lo dejamos
        en blanco.
      </p>

      <p className="mb-4">
        Cada pieza se fabrica cuando la pides. No tenemos bodega ni
        inventario por unidad: producimos bajo pedido, en lotes pequeños,
        para no fabricar de más.
      </p>

      <h2 className="font-display font-light text-xl mt-8 mb-3">Proceso</h2>
      <p className="mb-4">
        Partimos de datos de elevación reales del lugar elegido. El modelo
        se imprime en 3D, se pinta en acabado mate y se ensambla en un marco
        de nogal hecho a mano. El resultado es una pieza física de un lugar
        que existe, no una ilustración genérica.
      </p>
    </main>
  );
}
