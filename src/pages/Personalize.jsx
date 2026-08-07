// Issue #54 — UI only. api.md has no submission endpoint for this form yet
// (flagged separately); wiring to a real lead-capture endpoint comes once
// that's decided. For now the form just confirms client-side on submit.
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

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  function onSubmit(e) {
    e.preventDefault();
    setSent(true);
  }

  if (sent) {
    return (
      <main className="max-w-md mx-auto p-8">
        <h1 className="font-display font-light text-3xl mb-4">¡Gracias!</h1>
        <p>Recibimos tu solicitud para {form.location || 'tu lugar'}. Te contactamos por correo.</p>
      </main>
    );
  }

  return (
    <main className="max-w-md mx-auto p-8">
      <h1 className="font-display font-light text-3xl mb-2">Elige el lugar de tu encargo</h1>
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
        <Button as="button" type="submit" className="mt-2">
          Enviar solicitud
        </Button>
      </form>
    </main>
  );
}
