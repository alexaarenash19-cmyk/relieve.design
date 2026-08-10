// Sección 7 del brief Rayo X (jul 2026) — página dedicada al comprador de
// regalo con ocasión. El toggle "¿es para regalar?" + nota de regalo ya
// existen en CartDrawer.jsx (isGift/giftMessage en CartContext, ya
// conectados a api/checkout.js) — esta página solo lleva ahí, no duplica
// esa lógica.
import Button from '../components/Button.jsx';

export default function Gift() {
  return (
    // Hallazgo #8 (auditoría 10 ago 2026): pt-32 (no p-8) — mismo fix que Collections.jsx.
    <main className="max-w-2xl mx-auto pt-32 px-8 pb-8 text-center">
      <h1 className="font-heading font-bold text-brand-dark text-3xl md:text-4xl mb-4">
        El regalo que demuestra que sí prestaste atención.
      </h1>
      <p className="text-graphite/70 mb-8">
        No es una tarjeta de regalo. Es el lugar donde empezó su historia, hecho pieza.
      </p>
      <Button as="a" href="/colecciones">
        Encargar como regalo
      </Button>
      <p className="text-xs text-graphite/50 mt-6 max-w-md mx-auto">
        Al elegir tu pieza, activa "Es un regalo" en el carrito para agregar tu mensaje —
        y puedes escribir la dirección de quien lo recibe directo en el envío.
      </p>
    </main>
  );
}
