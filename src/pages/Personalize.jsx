// Issue #54 — UI. Fix (F1/C6, reporte consolidado de bugs, 13 ago 2026):
// onSubmit era client-side only (setSent(true), sin fetch) — su propio
// comentario decía "api.md has no submission endpoint for this form yet".
// Ahora sí hay uno (POST /api/personaliza, api/catalog.js's
// postPersonalizeRequest) y este formulario lo usa. Mismo shape de
// fetch-try/catch-error que CurvaDeNivel.jsx: sin loading spinner
// dedicado (la request es rápida y el rate limit ya protege de doble-
// envío accidental), error mostrado inline sin perder lo que el usuario
// ya escribió.
import { useState } from 'react';
import Button from '../components/Button.jsx';
import { useDocumentHead } from '../lib/useDocumentHead.js';

export default function Personalize() {
  useDocumentHead({
    title: 'Encarga tu lugar — Relieve',
    description:
      '¿No encontraste tu lugar en el catálogo? Cuéntanos cuál quieres y te avisamos si es posible fabricarlo en relieve.',
    canonicalPath: '/personaliza',
  });

  const [form, setForm] = useState({ name: '', email: '', location: '', notes: '' });
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError(false);
    setSubmitting(true);
    try {
      const res = await fetch('/api/personaliza', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('request failed');
      setSent(true);
    } catch {
      setError(true);
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      // Hallazgo #8 (auditoría 10 ago 2026): pt-32 (no p-8) — mismo fix que Collections.jsx.
    <main className="max-w-md mx-auto pt-32 px-8 pb-8">
        <h1 className="font-heading font-bold text-brand-dark text-3xl mb-4">¡Gracias!</h1>
        <p>Recibimos tu solicitud para {form.location || 'tu lugar'}. Te contactamos por correo.</p>
      </main>
    );
  }

  return (
    // Hallazgo #8 (auditoría 10 ago 2026): pt-32 (no p-8) — mismo fix que Collections.jsx.
    <main className="max-w-md mx-auto pt-32 px-8 pb-8">
      <h1 className="font-heading font-bold text-brand-dark text-3xl mb-2">Elige el lugar de tu encargo</h1>
      <p className="text-graphite/70 mb-6">
        ¿No encontraste tu lugar en el catálogo? Cuéntanos cuál quieres y te avisamos si es posible fabricarlo.
      </p>

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1">
          <span className="font-label uppercase tracking-wide text-xs">Nombre</span>
          <input
            required
            value={form.name}
            onChange={update('name')}
            className="border border-line rounded px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="font-label uppercase tracking-wide text-xs">Correo</span>
          <input
            type="email"
            required
            value={form.email}
            onChange={update('email')}
            className="border border-line rounded px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="font-label uppercase tracking-wide text-xs">Ubicación deseada</span>
          <input
            required
            value={form.location}
            onChange={update('location')}
            placeholder="Ciudad, montaña o coordenadas"
            className="border border-line rounded px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="font-label uppercase tracking-wide text-xs">Notas (opcional)</span>
          <textarea
            value={form.notes}
            onChange={update('notes')}
            className="border border-line rounded px-3 py-2"
          />
        </label>
        <Button as="button" type="submit" disabled={submitting} className="mt-2">
          {submitting ? 'Enviando…' : 'Enviar solicitud'}
        </Button>
        {error && (
          <p className="text-xs text-graphite/60">
            No pudimos enviar tu solicitud, intenta de nuevo en un momento.
          </p>
        )}
      </form>
    </main>
  );
}
