// Reseñas del producto — colapsado por default (solo texto); click revela la
// foto que el cliente subió (pieza instalada en su casa), si tiene una.
import { useEffect, useState } from 'react';
import { fetchJsonArray } from '../lib/fetchJsonArray.js';

function Stars({ rating }) {
  return (
    <span className="text-sello-navy" aria-label={`${rating} de 5 estrellas`}>
      {'★'.repeat(rating)}
      <span className="text-line">{'★'.repeat(5 - rating)}</span>
    </span>
  );
}

function ReviewCard({ review }) {
  const [open, setOpen] = useState(false);
  const hasPhoto = Boolean(review.photo_url);

  return (
    <li className="border border-line rounded-[9px] p-4">
      <button
        type="button"
        onClick={() => hasPhoto && setOpen((o) => !o)}
        aria-expanded={hasPhoto ? open : undefined}
        className={`w-full text-left ${hasPhoto ? 'cursor-pointer' : 'cursor-default'}`}
      >
        <div className="flex items-center justify-between gap-3 mb-1">
          <span className="font-label uppercase tracking-wide text-xs text-graphite/60">
            {review.customer}{review.city ? ` · ${review.city}` : ''}
          </span>
          <Stars rating={review.rating} />
        </div>
        <p className="leading-relaxed">{review.comment}</p>
        {hasPhoto && (
          <span className="font-label uppercase tracking-wide text-[10px] text-brand-dark mt-2 inline-block">
            {open ? 'Ocultar foto ▲' : 'Ver foto del cliente ▼'}
          </span>
        )}
      </button>
      {hasPhoto && open && (
        <img
          src={review.photo_url}
          alt={`Foto de ${review.customer} con su pieza instalada`}
          className="warm-photo mt-3 w-full max-w-xs rounded-[6px] object-cover"
        />
      )}
    </li>
  );
}

export default function Reviews({ slug }) {
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    let cancelled = false;
    fetchJsonArray(`/api/reviews?place=${slug}`).then(({ data, failed }) => {
      if (cancelled) return;
      setReviews(data);
      // Hallazgo (auditoría 10 ago 2026): antes era imposible distinguir
      // "esta pieza no tiene reseñas" (silencio correcto — no hace falta
      // un mensaje) de "la petición falló" (silencio incorrecto — nadie se
      // entera). Reseñas es contenido secundario, así que la UI se queda
      // igual (no mostrar nada), pero el fallo real ahora es visible en
      // consola en vez de indistinguible de "cero reseñas".
      if (failed) console.warn('[reviews] failed to load reviews for', slug);
    });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  // Sección 8 del brief Rayo X (jul 2026) — formato obligatorio: nombre,
  // ciudad y foto de la pieza instalada. Nunca solo estrellas + texto
  // genérico sin foto, aunque algún registro viejo/manual no las tenga.
  const displayable = reviews.filter((r) => r.photo_url && r.customer && r.city);

  if (displayable.length === 0) return null;

  return (
    <section className="mt-8 pt-6 border-t border-line">
      <h2 className="font-heading font-bold text-brand-dark uppercase tracking-wide text-xs mb-4">
        Reseñas ({displayable.length})
      </h2>
      <ul className="flex flex-col gap-3">
        {displayable.map((r, i) => (
          // r.id now comes from api/reviews.js's select (audit 10 ago
          // 2026) — the `customer + índice` fallback stays only for the
          // dummyCatalog reviews path, which has no id column.
          <ReviewCard key={r.id ?? r.customer + i} review={r} />
        ))}
      </ul>
    </section>
  );
}
