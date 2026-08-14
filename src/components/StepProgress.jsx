// Museográfico pass (11 ago 2026) — chrome de "un paso a la vez" para el
// selector de producto en Product.jsx (barra + Atrás/Continuar). Adapta el
// PATRÓN de un componente de referencia que Ale mandó (dots + barra
// deslizante con spring, framer-motion, azul/verde) sin copiar su
// implementación: la barra segmentada mirrors el patrón que
// OrderStatus.jsx YA usa para su propio progreso por etapas (STAGES.map
// con bg-sello-navy/bg-line por segmento) — más simple, ya establecido en
// el repo, y una transición CSS (transition-colors) resuelve el mismo
// movimiento sin necesitar GSAP ni una segunda librería de animación
// (framer-motion) en paralelo a la que ya usa todo el sitio.
// Corrección (14 ago 2026): esto decía usar cempasúchil, pero ese acento
// se retiró del sitio — ahora sí usa bg-sello-navy, igual que
// OrderStatus.jsx, tal como este mismo comentario ya decía que hacía.
import Button from './Button.jsx';

export default function StepProgress({
  total,
  current,
  labels,
  onBack,
  onContinue,
  isLast = false,
  finalAction = null,
}) {
  return (
    <div className="mt-6">
      <ol className="flex gap-2 mb-3" aria-hidden="true">
        {Array.from({ length: total }, (_, i) => i + 1).map((n) => (
          <li key={n} className="flex-1">
            <div
              className={`h-1 rounded-full transition-colors duration-300 ${
                n <= current ? 'bg-sello-navy' : 'bg-line'
              }`}
            />
          </li>
        ))}
      </ol>
      {labels && (
        <p className="font-label uppercase tracking-wide text-xs text-graphite/50 mb-4">
          Paso {current} de {total}
          {labels[current - 1] ? ` — ${labels[current - 1]}` : ''}
        </p>
      )}
      <div className="flex items-center gap-3">
        {current > 1 && (
          <button
            type="button"
            onClick={onBack}
            className="pill-glass rounded-full px-4 py-2 font-label uppercase tracking-wide text-xs shrink-0"
          >
            Atrás
          </button>
        )}
        {isLast ? (
          <div className="flex-1 min-w-0">{finalAction}</div>
        ) : (
          <Button type="button" onClick={onContinue} className="flex-1">
            Continuar
          </Button>
        )}
      </div>
    </div>
  );
}
