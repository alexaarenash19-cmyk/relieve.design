// docs/relieve-brand-brief.md sección 8 + §16 decisión 9 — comunidad "Curva
// de Nivel". A nivel sitio (no por pieza), vive en Home.jsx justo debajo
// del canvas (Hero → Canvas → Curva de Nivel → Footer, sección 11). Copy
// verbatim de la sección 8. Nunca "Suscribirse" en el CTA — "Quiero ser
// parte", igual que WaitlistDialog.jsx's fetch-then-confirm shape pero
// inline en la página en vez de un <dialog>, porque esto no cuelga de una
// acción puntual (soldout) sino que es contenido permanente del home.
import { useState } from 'react';
import Stamp from './Stamp.jsx';

const BENEFITS = [
  'Acceso anticipado a nuevas ciudades',
  'Ediciones especiales antes que nadie',
  'Descuento en tu segunda pieza',
];

export default function CurvaDeNivel() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError(false);
    try {
      const res = await fetch('/api/curva-de-nivel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error('request failed');
      setSent(true);
    } catch {
      setError(true);
    }
  }

  // Hallazgo (reporte de bug): `sent` no tenía forma de volver a `false` —
  // a diferencia de WaitlistDialog.jsx (un <dialog>, donde cerrarlo ya es
  // el reset), esta sección vive inline y permanente en Home, así que sin
  // esto la confirmación se quedaba pegada el resto de la visita, sin
  // manera de volver a ver el formulario.
  function onReset() {
    setSent(false);
    setEmail('');
  }

  return (
    <section className="max-w-md mx-auto text-center px-8 py-20">
      {sent ? (
        <>
          <Stamp label="Confirmado" className="mb-4" />
          <p>Listo, ya eres parte de la Curva de Nivel.</p>
          <button
            type="button"
            onClick={onReset}
            className="mt-4 text-xs text-graphite/60 underline"
          >
            Volver
          </button>
        </>
      ) : (
        <>
          <h2 className="font-heading font-bold text-brand-dark text-2xl mb-3">
            Sé parte de la Curva de Nivel
          </h2>
          <p className="text-graphite/70 mb-6">
            Antes de que una ciudad nueva llegue a todos, llega primero a la
            Curva de Nivel.
          </p>
          <ul className="font-label uppercase tracking-wide text-xs text-graphite/60 mb-8 space-y-1">
            {BENEFITS.map((b) => (
              <li key={b}>— {b}</li>
            ))}
          </ul>
          <form onSubmit={onSubmit} className="flex flex-col gap-3">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@correo.com"
              className="border border-line rounded px-3 py-2"
            />
            {/* apple-design audit (11 ago 2026) — Liquid Glass, same as
                every other CTA site-wide (Button.jsx). */}
            <button
              type="submit"
              className="pill-glass-active text-gallery-white px-6 py-3 rounded-[9px] font-heading font-bold"
            >
              Quiero ser parte
            </button>
          </form>
          {error && (
            <p className="text-xs text-graphite/60 mt-3">
              No pudimos registrarte, intenta de nuevo en un momento.
            </p>
          )}
        </>
      )}
    </section>
  );
}
