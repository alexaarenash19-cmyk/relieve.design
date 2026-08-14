import { useDocumentHead } from '../lib/useDocumentHead.js';

export default function Shipping() {
  useDocumentHead({
    title: 'Envíos — Relieve',
    description:
      'Envíos a todo México, siempre incluidos en el precio de tu pieza, con rastreo de tu pedido por correo.',
    canonicalPath: '/envios',
  });

  return (
    <main className="mx-auto max-w-[70ch] p-8 leading-relaxed">
      <h1 className="font-heading font-bold text-brand-dark text-3xl mb-6">Envíos</h1>

      <p className="mb-4">
        Enviamos a todo México. El envío ya está incluido en el precio de tu
        pieza — el tiempo estimado de entrega se calcula en el checkout
        según tu código postal.
      </p>

      <ul className="mb-4 list-disc pl-6 space-y-2">
        <li>Envío siempre incluido, sin costo adicional ni monto mínimo.</li>
        <li>Producción: cada pieza se fabrica bajo pedido, ver tiempo estimado en el checkout.</li>
        <li>Empaque protegido para piezas enmarcadas.</li>
        <li>Recibirás número de rastreo y notificaciones por correo.</li>
      </ul>

      <p>
        Puedes ver el estatus de cualquier pedido en el enlace que te
        enviamos por correo al confirmarse la compra, sin necesidad de
        crear una cuenta.
      </p>
    </main>
  );
}
