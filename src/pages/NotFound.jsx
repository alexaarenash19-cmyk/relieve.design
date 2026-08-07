// Checkpoint 4 — 404 with the same brand treatment as Product's empty
// state (Stamp, Fraunces heading, CTA back), instead of a blank Vite/React
// crash screen or a generic error page.
import Stamp from '../components/Stamp.jsx';
import Button from '../components/Button.jsx';

export default function NotFound() {
  return (
    <main className="max-w-md mx-auto p-8 text-center">
      <Stamp label="Sin ruta" className="mb-6" />
      <h1 className="font-heading font-bold text-brand-dark text-2xl mb-2">Esta página no existe.</h1>
      <p className="text-graphite/60 mb-6">
        Puede que el enlace esté roto o que el lugar ya no esté disponible.
      </p>
      <Button as="a" href="/">
        Volver al inicio
      </Button>
    </main>
  );
}
