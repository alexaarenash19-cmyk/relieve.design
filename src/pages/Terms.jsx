// Issue #58 — draft términos y condiciones. Borrador; requiere revisión legal antes de lanzamiento.
export default function Terms() {
  return (
    <main className="mx-auto max-w-[70ch] p-8 leading-relaxed">
      <h1 className="font-display font-light text-3xl mb-6">
        Términos y Condiciones
      </h1>

      <h2 className="font-display font-light text-xl mt-8 mb-3">Producto</h2>
      <p className="mb-4">
        Cada pieza se fabrica sobre pedido (made-to-order); no manejamos
        inventario por unidad. Los tiempos de producción se muestran en tu
        página de estatus del pedido.
      </p>

      <h2 className="font-display font-light text-xl mt-8 mb-3">Precios y pago</h2>
      <p className="mb-4">
        Los precios se muestran en pesos mexicanos (MXN) e incluyen IVA. El
        pago se procesa mediante Stripe (tarjeta, OXXO, meses sin intereses
        según elegibilidad). El precio final se recalcula en el servidor al
        momento del pago.
      </p>

      <h2 className="font-display font-light text-xl mt-8 mb-3">Envíos</h2>
      <p className="mb-4">
        Enviamos a todo México. El costo y tiempo de envío se muestran en el
        checkout; pedidos mayores a $2,500 MXN incluyen envío sin costo.
      </p>

      <h2 className="font-display font-light text-xl mt-8 mb-3">
        Cancelaciones y devoluciones
      </h2>
      <p className="mb-4">
        Por ser piezas personalizadas de fabricación bajo pedido, no
        aplican cambios ni devoluciones salvo defecto de fabricación.
        Escríbenos a{' '}
        <a className="text-ink underline" href="mailto:hola@relieve.mx">
          hola@relieve.mx
        </a>{' '}
        dentro de los 7 días posteriores a la entrega.
      </p>

      <h2 className="font-display font-light text-xl mt-8 mb-3">Facturación</h2>
      <p className="mb-4">
        Si necesitas factura (CFDI), solicítala dentro del mismo mes de tu
        compra proporcionando tus datos fiscales.
      </p>

      <p className="text-sm text-text/70 mt-10">
        Última actualización: 16 de julio de 2026.
      </p>
    </main>
  );
}
