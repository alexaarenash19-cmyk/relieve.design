// Stripe redirects here with ?session_id=... right after payment. The
// webhook (which creates the order + status_token) is a separate async
// event from Stripe, not guaranteed to have landed yet when the browser
// gets here — so this polls briefly for the order to show up, then hands
// off to the real magic-link page (/pedido/:token) once it exists.
import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

const POLL_MS = 1500;
const MAX_ATTEMPTS = 8; // ~12s — comfortably past normal webhook delivery time

export default function OrderSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = searchParams.get('session_id');
  const [attempt, setAttempt] = useState(0);
  const [gaveUp, setGaveUp] = useState(false);

  useEffect(() => {
    if (!sessionId) {
      setGaveUp(true);
      return;
    }
    let cancelled = false;
    fetch(`/api/orders/by-session/${sessionId}`)
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        if (!cancelled) navigate(`/pedido/${data.status_token}`, { replace: true });
      })
      .catch(() => {
        if (cancelled) return;
        if (attempt >= MAX_ATTEMPTS) {
          setGaveUp(true);
        } else {
          setTimeout(() => setAttempt((a) => a + 1), POLL_MS);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [sessionId, attempt, navigate]);

  if (gaveUp) {
    return (
      // Hallazgo #8 (auditoría 10 ago 2026): pt-32 (no p-8) — mismo fix que Collections.jsx.
      <main className="max-w-2xl mx-auto pt-32 px-8 pb-8 text-center">
        <p className="font-label uppercase tracking-wide text-sm mb-2">Tu pago se confirmó</p>
        <p className="text-graphite/60">
          Estamos terminando de registrar tu pedido — revisa tu correo en unos minutos para el
          enlace de seguimiento.
        </p>
      </main>
    );
  }

  return (
    <p className="p-8 text-center font-label uppercase tracking-wide text-xs text-graphite/60">
      Confirmando tu pedido…
    </p>
  );
}
