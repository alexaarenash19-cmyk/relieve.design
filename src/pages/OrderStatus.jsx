// Issue #57 — /pedido/:token departures-board status page. No login, magic link only.
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

const STAGES = [
  { code: 'paid', label: 'Confirmado' },
  { code: 'in_production', label: 'En producción' },
  { code: 'shipped', label: 'Enviado' },
  { code: 'delivered', label: 'Entregado' },
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
      <main className="max-w-2xl mx-auto p-8">
        <h1 className="font-label uppercase tracking-wide text-lg mb-4">
          Pedido {order.number}
        </h1>
        <p>Este pedido fue cancelado.</p>
      </main>
    );
  }

  const currentIndex = STAGES.findIndex((s) => s.code === order.status);

  return (
    <main className="max-w-2xl mx-auto p-8">
      <h1 className="font-label uppercase tracking-wide text-lg mb-8">
        Pedido {order.number}
      </h1>

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

      <ul className="mt-8 divide-y divide-line font-label uppercase tracking-wide text-xs">
        {order.items?.map((item, i) => (
          <li key={i} className="py-2 flex justify-between">
            <span>
              {item.custom_place ?? item.place_id} · {item.size_code} · {item.frame_code}
            </span>
            <span>×{item.qty}</span>
          </li>
        ))}
      </ul>
    </main>
  );
}
