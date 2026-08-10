// Issue #53 — soldout state: native <dialog> (no library needed) -> POST /api/waitlist.
import { useRef, useState } from 'react';
import { SIZES } from '../lib/catalog.js';
import Stamp from './Stamp.jsx';

export default function WaitlistDialog({ placeSlug }) {
  const dialogRef = useRef(null);
  const [email, setEmail] = useState('');
  const [sizeCode, setSizeCode] = useState(SIZES[1].code);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ place_slug: placeSlug, size_code: sizeCode, email }),
      });
      // Hallazgo #3 (auditoría 10 ago 2026): sin este chequeo, un 4xx/5xx
      // (rate limit excedido, place_slug inválido) o un fallo de red
      // igual mostraba "Confirmado" sin que el registro se guardara.
      if (!res.ok) {
        throw new Error(
          res.status === 429
            ? 'Ya lo intentaste varias veces, espera un momento.'
            : 'No pudimos guardar tu correo, intenta de nuevo.'
        );
      }
      setSent(true);
    } catch (err) {
      setError(err.message || 'No pudimos guardar tu correo, intenta de nuevo.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <button
        onClick={() => dialogRef.current?.showModal()}
        className="mt-6 border border-brand-dark text-brand-dark px-6 py-3 rounded-[9px] font-heading font-bold hover:bg-brand-dark hover:text-dark-bg transition-colors"
      >
        Avisarme cuando vuelva
      </button>

      <dialog
        ref={dialogRef}
        className="boarding-pass-edge rounded-[9px] border border-line p-6 pl-8 ml-4 backdrop:bg-graphite/40"
      >
        {sent ? (
          <div className="text-center min-w-[280px] py-4">
            <Stamp label="Confirmado" className="mb-4" />
            <p>Listo, te avisamos por correo en cuanto vuelva.</p>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="flex flex-col gap-3 min-w-[280px]">
            <h2 className="font-heading font-bold text-brand-dark uppercase tracking-wide text-sm">Lista de espera</h2>
            {/* Hallazgo (auditoría 10 ago 2026): ninguno de los dos campos
                tenía <label> asociado, solo placeholder en el de correo. */}
            <label htmlFor="waitlist-size" className="sr-only">
              Tamaño
            </label>
            <select
              id="waitlist-size"
              value={sizeCode}
              onChange={(e) => setSizeCode(e.target.value)}
              className="border border-line rounded px-3 py-2"
            >
              {SIZES.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.label}
                </option>
              ))}
            </select>
            <label htmlFor="waitlist-email" className="sr-only">
              Correo electrónico
            </label>
            <input
              id="waitlist-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@correo.com"
              className="border border-line rounded px-3 py-2"
            />
            {error && <p className="text-sm text-red-700">{error}</p>}
            <div className="flex justify-end gap-2 mt-2">
              <button type="button" onClick={() => dialogRef.current?.close()} className="text-sm text-graphite/60">
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="bg-brand-dark text-dark-bg px-4 py-2 rounded-[9px] text-sm font-heading font-bold disabled:opacity-60"
              >
                {submitting ? 'Guardando…' : 'Avisarme'}
              </button>
            </div>
          </form>
        )}
      </dialog>
    </>
  );
}
