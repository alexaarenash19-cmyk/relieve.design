// Issue #58 — draft términos y condiciones. Borrador; requiere revisión legal antes de lanzamiento.
import { useDocumentHead } from '../lib/useDocumentHead.js';

export default function Terms() {
  useDocumentHead({
    title: 'Términos y Condiciones — Relieve',
    description:
      'Condiciones de producto, precios y pago, envíos, cancelaciones y devoluciones, y facturación para tu compra en Relieve.',
    canonicalPath: '/terminos',
  });

  return (
    <main className="mx-auto max-w-[70ch] p-8 leading-relaxed">
      <h1 className="font-heading font-bold text-brand-dark text-3xl mb-6">
        Términos y Condiciones
      </h1>

      <h2 className="font-heading font-bold text-brand-dark text-xl mt-8 mb-3">Pieza</h2>
      <p className="mb-4">
        Cada pieza se fabrica sobre pedido (made-to-order); no manejamos
        inventario por unidad. Los tiempos de producción se muestran en tu
        página de estatus del pedido.
      </p>

      <h2 className="font-heading font-bold text-brand-dark text-xl mt-8 mb-3">Precios y pago</h2>
      <p className="mb-4">
        Los precios se muestran en pesos mexicanos (MXN) e incluyen IVA. El
        pago se procesa mediante Stripe (tarjeta u OXXO, de contado — no
        ofrecemos meses sin intereses). El precio final se recalcula en el
        servidor al momento del pago.
      </p>

      <h2 className="font-heading font-bold text-brand-dark text-xl mt-8 mb-3">Envíos</h2>
      <p className="mb-4">
        Enviamos a todo México. El costo y tiempo de envío se muestran en el
        checkout; pedidos mayores a $2,500 MXN incluyen envío sin costo.
      </p>

      <h2 className="font-heading font-bold text-brand-dark text-xl mt-8 mb-3">
        Cancelaciones y devoluciones
      </h2>
      <p className="mb-4">
        Por ser piezas hechas por encargo, de fabricación bajo pedido, no
        aplican cambios ni devoluciones salvo defecto de fabricación.
        Escríbenos a{' '}
        <a className="text-passport-ink underline" href="mailto:contacto@relieve.design">
          contacto@relieve.design
        </a>{' '}
        dentro de los 7 días posteriores a la entrega.
      </p>

      <h2 className="font-heading font-bold text-brand-dark text-xl mt-8 mb-3">Facturación</h2>
      <p className="mb-4">
        Si necesitas factura (CFDI), solicítala dentro del mismo mes de tu
        compra proporcionando tus datos fiscales.
      </p>

      <p className="text-sm text-graphite/70 mt-10">
        Última actualización: 16 de julio de 2026.
      </p>
    </main>
  );
}
