// Issue #51 — base product page layout (image + metadata column).
// Personalization/pricing/bundle/reviews/presale UI are separate sub-issues (#52-54).
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';

export default function Product() {
  const { slug } = useParams();
  const { addItem } = useCart();
  const [place, setPlace] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/places/${slug}`)
      .then((res) => {
        if (!res.ok) throw new Error('not_found');
        return res.json();
      })
      .then((data) => {
        if (!cancelled) setPlace(data);
      })
      .catch(() => {
        if (!cancelled) setError('No pudimos cargar esta pieza.');
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (error) return <p className="p-8">{error}</p>;
  if (!place) return <p className="p-8">Cargando…</p>;

  const specs = [
    ['Tipo', place.type === 'montana' ? 'Montaña' : 'Ciudad'],
    place.elevation_m ? ['Altitud', `${place.elevation_m} msnm`] : null,
    place.lat && place.lng ? ['Coordenadas', `${place.lat}, ${place.lng}`] : null,
    ['Precio', `$${(place.base_price / 100).toLocaleString('es-MX')} MXN`],
  ].filter(Boolean);

  return (
    <main className="grid md:grid-cols-2 gap-8 p-8 max-w-5xl mx-auto">
      <div className="aspect-square bg-stone rounded-[9px] flex items-center justify-center">
        {place.thumb_url ? (
          <img
            src={place.thumb_url}
            alt={place.name}
            className="w-full h-full object-cover rounded-[9px]"
          />
        ) : (
          <span className="font-label uppercase tracking-wide text-xs text-text/60">
            Imagen próximamente
          </span>
        )}
      </div>

      <div>
        <h1 className="font-display font-light text-3xl mb-6">{place.name}</h1>
        <dl className="border-t border-line">
          {specs.map(([label, value]) => (
            <div
              key={label}
              className="grid grid-cols-2 border-b border-line py-2 font-label uppercase tracking-wide text-xs"
            >
              <dt className="text-text/60">{label}</dt>
              <dd className={label === 'Precio' ? 'font-bold' : ''}>{value}</dd>
            </div>
          ))}
        </dl>
        {place.story && <p className="mt-6 leading-relaxed">{place.story}</p>}

        <button
          onClick={() =>
            addItem({
              place_slug: place.slug,
              name: `Relieve · ${place.name} · Mediano · Nogal`,
              unit_price_cents: place.base_price,
              qty: 1,
            })
          }
          className="mt-6 bg-navy text-bg-dark px-6 py-3 rounded-[9px] font-body font-medium hover:opacity-90"
        >
          Agregar al carrito
        </button>
      </div>
    </main>
  );
}
