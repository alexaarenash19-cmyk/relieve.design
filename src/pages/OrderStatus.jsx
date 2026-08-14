// Issue #57 — /pedido/:token departures-board status page. No login, magic link only.
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import FichaTecnica from '../components/FichaTecnica.jsx';
import { COUNTRY_NAMES } from '../lib/catalog.js';

const STAGES = [
  { code: 'paid', label: 'Confirmado' },
  { code: 'in_production', label: 'En producción' },
  { code: 'shipped', label: 'Enviado' },
  { code: 'delivered', label: 'Entregado' },
];

// Sección 6 + 10 del brief Rayo X (jul 2026) — copy narrativo por estado,
// no solo un tablero de estado técnico. 'paid' (recién recibido) lleva el
// tratamiento completo (cuerpo + línea de tiempo + cierre); los estados
// siguientes son solo una línea, ya con contexto suficiente. Sin entrada
// para 'delivered' — el brief no da copy para ese estado, no se inventa.
const STATE_COPY = {
  paid: {
    headline: 'Tu pieza empieza a existir ahora.',
    body: 'Esto es lo que va a pasar en las próximas semanas: encargamos y preparamos tu marco, tallamos tu lugar con precisión cartográfica, lo montamos y lo empacamos como parte de la pieza — no como contenedor. Te avisamos en cada paso.',
    closing: 'Gracias por confiar en un objeto que no existía hasta que lo pediste.',
  },
  in_production: {
    headline: 'Estamos tallando tu lugar ahora mismo.',
  },
  shipped: {
    headline: 'Tu pieza va en camino — como toda pieza de encargo, no hay otra igual.',
  },
};

const CONFIRMATION_TIMELINE = [
  'Preparamos tu marco',
  'Tallamos tu lugar con precisión cartográfica',
  'Montamos y empacamos tu pieza',
];

export default function OrderStatus() {
  const { token } = useParams();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/orders/${token}`)
      .then((res) => {
        if (!res.ok) throw new Error('not_found');
        return res.json();
      })
      .then((data) => {
        if (!cancelled) setOrder(data);
      })
      .catch(() => {
        if (!cancelled) setError('No encontramos ese pedido.');
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (error) return <p className="p-8">{error}</p>;
  if (!order) return <p className="p-8">Cargando…</p>;

  if (order.status === 'cancelled') {
    return (
      // Hallazgo #8 (auditoría 10 ago 2026): pt-32 (no p-8) — mismo fix que Collections.jsx.
    <main className="max-w-2xl mx-auto pt-32 px-8 pb-8">
        <h1 className="font-heading font-bold text-brand-dark uppercase tracking-wide text-lg mb-4">
          Pedido {order.number}
        </h1>
        <p>Este pedido fue cancelado.</p>
      </main>
    );
  }

  const currentIndex = STAGES.findIndex((s) => s.code === order.status);
  const stateCopy = STATE_COPY[order.status];

  // docs/superpowers/specs/2026-08-13-personaliza-checkout-design.md sección 5
  // — headline propio SOLO cuando el pedido es 100% personalizado. Un
  // carrito mixto (catálogo + personalizado) no está cubierto por la spec
  // — se queda con el copy genérico existente en vez de inventar texto
  // para ese caso.
  const isFullyPersonalized = order.items?.length > 0 && order.items.every((i) => i.custom_location);

  return (
    // Hallazgo #8 (auditoría 10 ago 2026): pt-32 (no p-8) — mismo fix que Collections.jsx.
    <main className="max-w-2xl mx-auto pt-32 px-8 pb-8">
      <p className="font-label uppercase tracking-wide text-xs text-graphite/60 mb-2">
        Pedido {order.number}
      </p>

      {isFullyPersonalized && order.status === 'paid' ? (
        <h1 className="font-heading font-bold text-brand-dark text-2xl md:text-3xl mb-4">
          Tu Relieve está en marcha.
        </h1>
      ) : (
        stateCopy && (
          <h1 className="font-heading font-bold text-brand-dark text-2xl md:text-3xl mb-4">
            {stateCopy.headline}
          </h1>
        )
      )}

      {stateCopy?.body && (
        <>
          <p className="text-graphite/80 mb-4">{stateCopy.body}</p>
          <ol className="mb-6 pl-5 list-decimal text-sm text-graphite/70 space-y-1">
            {CONFIRMATION_TIMELINE.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          <p className="text-graphite/80 mb-8 italic">{stateCopy.closing}</p>
        </>
      )}

      <ol className="flex justify-between">
        {STAGES.map((stage, i) => (
          <li key={stage.code} className="flex-1 text-center">
            <div
              className={`h-1 mb-2 ${i <= currentIndex ? 'bg-sello-navy' : 'bg-line'} ${
                i === 0 ? 'rounded-l-full' : ''
              } ${i === STAGES.length - 1 ? 'rounded-r-full' : ''}`}
            />
            <span
              className={`font-label uppercase tracking-wide text-xs ${
                i === currentIndex ? 'font-bold text-sello-navy' : 'text-graphite/60'
              }`}
            >
              {stage.label}
            </span>
          </li>
        ))}
      </ol>

      {order.tracking_number && (
        <p className="font-label uppercase tracking-wide text-sm mt-8">
          Guía: {order.tracking_number}
        </p>
      )}

      {/* brand-brief.md — cada pieza pagada ya tiene un piece_number real
          (asignado en el momento del pago, ver api/catalog.js getOrder).
          Antes esta lista mostraba el place_id crudo en vez del nombre del
          lugar — bug preexistente, corregido de paso al integrar
          FichaTecnica aquí. Piezas con custom_place (lugar no catalogado,
          sin fila en `places`) no tienen datos para una ficha completa —
          se quedan con la línea simple anterior, no se inventa una ficha. */}
      <div className="mt-8 space-y-6">
        {order.items?.map((item, i) =>
          item.places ? (
            <FichaTecnica
              key={i}
              pieceNumber={item.piece_number}
              editionNumber={item.piece_number}
              collectionName={item.places.type === 'juego' ? 'Juego' : 'Ciudades del Mundo'}
              series={item.places.series}
              placeName={item.places.name}
              country={COUNTRY_NAMES[item.places.country] ?? item.places.country}
              sizeCode={item.size_code}
              frameCode={item.places.type === 'juego' ? undefined : item.frame_code}
              colorCode={item.places.type === 'juego' ? undefined : item.color_code}
            />
          ) : item.custom_location ? (
            <div key={i} className="py-4 border-b border-line text-sm">
              <p className="font-label uppercase tracking-wide text-xs text-graphite/60">Ubicación</p>
              <p className="mb-2">{item.custom_place}</p>
              <p className="font-label uppercase tracking-wide text-xs text-graphite/60">Tamaño</p>
              <p className="mb-2">{item.size_code}</p>
              <p className="font-label uppercase tracking-wide text-xs text-graphite/60">Color</p>
              <p className="mb-2">{item.color_code}</p>
              <p className="font-label uppercase tracking-wide text-xs text-graphite/60">Marco</p>
              <p>{item.frame_code}</p>
            </div>
          ) : (
            <div key={i} className="py-2 flex justify-between font-label uppercase tracking-wide text-xs border-b border-line">
              <span>
                {item.custom_place} · {item.size_code} · {item.frame_code}
              </span>
              <span>×{item.qty}</span>
            </div>
          ),
        )}
      </div>
    </main>
  );
}
