// Issue #58 — draft aviso de privacidad (LFPDPPP). Borrador; requiere revisión legal antes de lanzamiento.
export default function PrivacyNotice() {
  return (
    <main className="mx-auto max-w-[70ch] p-8 leading-relaxed">
      <h1 className="font-display font-light text-3xl mb-6">Aviso de Privacidad</h1>

      <p className="mb-4">
        Relieve ("nosotros"), con domicilio en México, es responsable del
        tratamiento de tus datos personales conforme a la Ley Federal de
        Protección de Datos Personales en Posesión de los Particulares
        (LFPDPPP).
      </p>

      <h2 className="font-display font-light text-xl mt-8 mb-3">Datos que recabamos</h2>
      <p className="mb-4">
        Nombre, correo electrónico, dirección de envío, teléfono y, en su
        caso, datos fiscales para facturación (CFDI). No solicitamos datos
        sensibles ni creamos cuenta de usuario: el pedido se rastrea con tu
        correo y un enlace único.
      </p>

      <h2 className="font-display font-light text-xl mt-8 mb-3">Finalidades</h2>
      <p className="mb-4">
        Procesar tu pedido, fabricar y enviar tu pieza, facturar cuando lo
        solicites, notificarte el estatus de tu compra y, si nos autorizas,
        pedirte una reseña una vez entregada la pieza.
      </p>

      <h2 className="font-display font-light text-xl mt-8 mb-3">Terceros</h2>
      <p className="mb-4">
        Compartimos datos estrictamente necesarios con nuestros proveedores
        de pago (Stripe), facturación (Facturama) y paquetería, únicamente
        para cumplir con tu pedido.
      </p>

      <h2 className="font-display font-light text-xl mt-8 mb-3">
        Derechos ARCO
      </h2>
      <p className="mb-4">
        Puedes acceder, rectificar, cancelar u oponerte al tratamiento de tus
        datos escribiendo a{' '}
        <a className="text-passport-ink underline" href="mailto:hola@relieve.mx">
          hola@relieve.mx
        </a>
        .
      </p>

      <p className="text-sm text-graphite/70 mt-10">
        Última actualización: 16 de julio de 2026.
      </p>
    </main>
  );
}
