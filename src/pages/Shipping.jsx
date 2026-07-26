export default function Shipping() {
  return (
    <main className="mx-auto max-w-[70ch] p-8 leading-relaxed">
      <h1 className="font-display font-light text-3xl mb-6">Envíos</h1>

      <p className="mb-4">
        Enviamos a todo México. El costo y tiempo estimado de entrega se
        calculan en el checkout según tu código postal.
      </p>

      <ul className="mb-4 list-disc pl-6 space-y-2">
        <li>Envío incluido en pedidos mayores a $2,500 MXN.</li>
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
