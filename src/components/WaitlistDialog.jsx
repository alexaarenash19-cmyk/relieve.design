// Issue #53 — soldout state: native <dialog> (no library needed) -> POST /api/waitlist.
import { useRef, useState } from 'react';
import { SIZES } from '../lib/catalog.js';

export default function WaitlistDialog({ placeSlug }) {
  const dialogRef = useRef(null);
  const [email, setEmail] = useState('');
  const [sizeCode, setSizeCode] = useState(SIZES[1].code);
  const [sent, setSent] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    await fetch('/api/waitlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ place_slug: placeSlug, size_code: sizeCode, email }),
    });
    setSent(true);
  }

  return (
    <>
      <button
        onClick={() => dialogRef.current?.showModal()}
        className="mt-6 border border-navy text-navy px-6 py-3 rounded-[9px] font-body font-medium hover:bg-navy hover:text-bg-dark transition-colors"
      >
        Avisarme cuando vuelva
      </button>

      <dialog ref={dialogRef} className="rounded-[9px] border border-line p-6 backdrop:bg-black/40">
        {sent ? (
          <p>Listo, te avisamos por correo en cuanto vuelva.</p>
        ) : (
          <form onSubmit={onSubmit} className="flex flex-col gap-3 min-w-[280px]">
            <h2 className="font-label uppercase tracking-wide text-sm">Lista de espera</h2>
            <select
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
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@correo.com"
              className="border border-line rounded px-3 py-2"
            />
            <div className="flex justify-end gap-2 mt-2">
              <button type="button" onClick={() => dialogRef.current?.close()} className="text-sm text-text/60">
                Cancelar
              </button>
              <button type="submit" className="bg-navy text-bg-dark px-4 py-2 rounded-[9px] text-sm">
                Avisarme
              </button>
            </div>
          </form>
        )}
      </dialog>
    </>
  );
}
