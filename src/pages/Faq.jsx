const FAQS = [
  {
    q: '¿Cómo elijo el lugar de mi pieza?',
    a: 'Puedes buscar entre nuestro catálogo de ciudades y montañas, o pedir una ubicación personalizada en /personaliza si el lugar que quieres no está en el catálogo.',
  },
  {
    q: '¿Cuánto tarda en llegar?',
    a: 'Cada pieza se fabrica bajo pedido. El tiempo estimado de producción y envío se muestra en el checkout antes de pagar, y puedes rastrearlo después desde tu enlace de pedido.',
  },
  {
    q: '¿De qué material es el marco?',
    a: 'Nogal macizo. El relieve se imprime en 3D con acabado mate.',
  },
  {
    q: '¿Puedo pedir factura?',
    a: 'Sí, solicítala dentro del mismo mes de tu compra con tus datos fiscales.',
  },
  {
    q: '¿Aceptan devoluciones?',
    a: 'Por ser piezas personalizadas de fabricación bajo pedido, no aplican cambios ni devoluciones salvo defecto de fabricación.',
  },
  {
    q: '¿Qué pasa si mi lugar está agotado?',
    a: 'Puedes anotarte en la lista de espera desde la página de la pieza; te avisamos por correo en cuanto vuelva a estar disponible.',
  },
];

export default function Faq() {
  return (
    <main className="mx-auto max-w-[70ch] p-8 leading-relaxed">
      <h1 className="font-display font-light text-3xl mb-6">
        Preguntas frecuentes
      </h1>
      <dl className="space-y-6">
        {FAQS.map(({ q, a }) => (
          <div key={q}>
            <dt className="font-label uppercase tracking-wide text-sm mb-1">
              {q}
            </dt>
            <dd>{a}</dd>
          </div>
        ))}
      </dl>
    </main>
  );
}
