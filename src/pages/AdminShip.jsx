// Handoff 8 ago 2026 sección 3.3, opción (b): Ale probó (a) por curl/
// PowerShell y se le complicó (Invoke-WebRequest espera -Headers como
// hashtable, no como texto plano de curl real) — este es el "form interno"
// que la sección ya preveía como upgrade natural de (a) en cuanto hiciera
// falta una interfaz más amigable. No agrega seguridad propia: sigue
// protegido por el mismo ADMIN_TOKEN que ya exige el backend
// (lib/adminAuth.js) — esta página solo evita que Ale tenga que abrir una
// terminal.
//
// Hallazgo #2 (auditoría 10 ago 2026): el token vivía en localStorage,
// legible por JS desde cualquier página del sitio (no solo /admin) y
// persistente entre sesiones — un XSS futuro en cualquier componente
// tendría control total sobre las rutas /api/admin/*. sessionStorage es la
// mitigación mínima (mismo problema de "JS puede leerlo" si hay XSS, pero
// ya no sobrevive a cerrar la pestaña, y no se comparte entre pestañas
// nuevas). El fix robusto de verdad — cookie httpOnly seteada por un login
// del servidor, para que JS nunca toque el valor — es un cambio de
// arquitectura más grande (necesita un endpoint de login dedicado) y queda
// fuera de este PR.
import { useState } from 'react';

const TOKEN_KEY = 'relieve_admin_token';

export default function AdminShip() {
  const [token, setToken] = useState(() => sessionStorage.getItem(TOKEN_KEY) ?? '');
  const [orderId, setOrderId] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [result, setResult] = useState(null); // { ok, message }
  const [loading, setLoading] = useState(false);

  function saveToken(value) {
    setToken(value);
    sessionStorage.setItem(TOKEN_KEY, value);
  }

  function logout() {
    setToken('');
    sessionStorage.removeItem(TOKEN_KEY);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(`/api/admin/orders/${encodeURIComponent(orderId.trim())}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tracking_number: trackingNumber.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setResult({ ok: false, message: data?.error?.message ?? `Error ${res.status}` });
      } else {
        setResult({
          ok: true,
          message: `Pedido ${data.number} marcado como enviado — el cliente ya recibió el correo de rastreo.`,
        });
        setOrderId('');
        setTrackingNumber('');
      }
    } catch {
      setResult({ ok: false, message: 'No se pudo conectar. Revisa tu internet e intenta de nuevo.' });
    } finally {
      setLoading(false);
    }
  }

  return (
    // Hallazgo #8 (auditoría 10 ago 2026): pt-32 (no p-8) — mismo fix que Collections.jsx.
    <main className="max-w-md mx-auto pt-32 px-8 pb-8">
      <h1 className="font-heading font-bold text-brand-dark text-2xl mb-2">Marcar pedido enviado</h1>
      <p className="text-sm text-graphite/70 mb-8">
        Al enviar, el cliente recibe automáticamente el correo con el número de rastreo.
      </p>

      <div className="mb-6">
        <label htmlFor="admin-token" className="font-label uppercase tracking-wide text-xs block mb-1">
          Token de administrador
        </label>
        <input
          id="admin-token"
          type="password"
          value={token}
          onChange={(e) => saveToken(e.target.value)}
          placeholder="Se guarda solo mientras esta pestaña está abierta"
          className="w-full border border-line rounded px-3 py-2"
        />
        {token && (
          <button type="button" onClick={logout} className="mt-2 text-xs text-graphite/60 underline">
            Cerrar sesión
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="admin-order-id" className="font-label uppercase tracking-wide text-xs block mb-1">
            Número de pedido
          </label>
          <input
            id="admin-order-id"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            placeholder="RLV-2026-169637"
            required
            className="w-full border border-line rounded px-3 py-2"
          />
        </div>
        <div className="mb-6">
          <label htmlFor="admin-tracking-number" className="font-label uppercase tracking-wide text-xs block mb-1">
            Número de guía
          </label>
          <input
            id="admin-tracking-number"
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            required
            className="w-full border border-line rounded px-3 py-2"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !token || !orderId || !trackingNumber}
          className="w-full bg-brand-dark text-gallery-white rounded-full px-4 py-2 font-heading font-bold disabled:opacity-40"
        >
          {loading ? 'Enviando…' : 'Marcar como enviado'}
        </button>
      </form>

      {result && (
        <p className={`mt-4 text-sm ${result.ok ? 'text-green-700' : 'text-red-700'}`}>
          {result.message}
        </p>
      )}
    </main>
  );
}
