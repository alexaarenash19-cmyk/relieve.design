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
          <span className="font-label uppercase tracking-wide text-[10px] text-sello-navy mt-2 inline-block">
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
    fetchJsonArray(`/api/reviews?place=${slug}`).then((data) => {
      if (!cancelled) setReviews(data);
    });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (reviews.length === 0) return null;

  return (
    <section className="mt-8 pt-6 border-t border-line">
      <h2 className="font-label uppercase tracking-wide text-xs text-graphite/60 mb-4">
        Reseñas ({reviews.length})
      </h2>
      <ul className="flex flex-col gap-3">
        {reviews.map((r, i) => (
          <ReviewCard key={r.customer + i} review={r} />
        ))}
      </ul>
    </section>
  );
}
