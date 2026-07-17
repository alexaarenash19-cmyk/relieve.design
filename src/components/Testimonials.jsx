// Checkpoint 4 — testimonios como pancartas remolcadas por avión, cruzando
// la pantalla una tras otra (loop). prefers-reduced-motion: lista estática,
// sin vuelo. Se revela con fade/slide-up al hacer scroll hasta aquí.
//
// PLACEHOLDER — Ale no ha vendido piezas todavía, no hay reseñas reales.
// Reemplazar este arreglo con reseñas reales antes de lanzar.
import { useFadeInView } from '../lib/useFadeInView.js';
import { TESTIMONIAL_PHOTOS } from '../lib/photography.js';

const TESTIMONIALS = [
  { name: 'Cliente piloto', place: 'Monterrey', text: 'La pieza llegó exacta a como se veía en la vista previa — la topografía se siente real.' },
  { name: 'Cliente piloto', place: 'CDMX', text: 'El marco de nogal es precioso en persona, mejor que en foto.' },
  { name: 'Cliente piloto', place: 'Oaxaca', text: 'Pedí mi ciudad natal y quedó como regalo perfecto para mis papás.' },
].map((t, i) => ({ ...t, photo: TESTIMONIAL_PHOTOS[i] ?? null }));

function PlaneBanner({ text, photo, index }) {
  return (
    <div
      className="flap-banner absolute top-0 left-0 flex items-center gap-3 whitespace-nowrap"
      style={{ animationDelay: `${index * 9}s` }}
    >
      <svg viewBox="0 0 40 24" width="40" height="24" className="text-graphite shrink-0" aria-hidden="true">
        <path
          d="M2 14 L26 10 L36 4 L34 10 L26 14 L36 18 L20 16 L14 20 L16 15 L2 14 Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
      </svg>
      <div className="h-px w-8 bg-graphite/50 shrink-0" />
      <div className="flex items-center gap-3 border border-graphite bg-gallery-white px-5 py-3">
        {photo && (
          <img
            src={photo}
            alt=""
            className="warm-photo w-8 h-8 rounded-full object-cover shrink-0"
            aria-hidden="true"
          />
        )}
        <p className="font-label uppercase tracking-wide text-xs text-graphite">{text}</p>
      </div>
    </div>
  );
}

export default function Testimonials() {
  const [ref, visible] = useFadeInView();

  return (
    <section
      ref={ref}
      className="relative py-20 border-t border-line transition-all duration-700"
      style={{ opacity: visible ? 1 : 0, transform: visible ? 'none' : 'translateY(24px)' }}
    >
      <h2 className="font-label uppercase tracking-wide text-xs text-graphite/60 text-center mb-10">
        Lo que dicen
      </h2>

      {/* Flying version — hidden under prefers-reduced-motion. */}
      <div className="relative h-24 overflow-hidden motion-reduce:hidden" aria-hidden="true">
        {TESTIMONIALS.map((t, i) => (
          <PlaneBanner key={t.name + i} text={t.text} photo={t.photo} index={i} />
        ))}
      </div>

      {/* Static fallback — shown only under prefers-reduced-motion. */}
      <ul className="hidden motion-reduce:flex mx-auto max-w-xl flex-col gap-4 px-8">
        {TESTIMONIALS.map((t, i) => (
          <li key={t.name + i} className="flex items-center gap-4 border border-line rounded-[9px] p-4">
            {t.photo && (
              <img src={t.photo} alt="" className="warm-photo w-10 h-10 rounded-full object-cover shrink-0" aria-hidden="true" />
            )}
            <div>
              <p className="font-label uppercase tracking-wide text-xs mb-2">{t.text}</p>
              <p className="text-graphite/50 text-sm">{t.name} · {t.place}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
