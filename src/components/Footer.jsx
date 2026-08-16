// Museográfico pass (11 ago 2026) — extracted out of App.jsx (was a local
// function there, coupled to the app's top-level route file for no real
// reason) and expanded from a thin 2-link + social bar into real columns.
// brand-brief.md §16 decisión 11 — reversión explícita de la petición
// anterior de nunca mostrar footer en home: la estructura de Home (Hero →
// Canvas → Curva de Nivel → Footer) requiere que aparezca en '/', debajo de
// Curva de Nivel. Sigue montado en App.jsx, fuera de <Routes>, así que cae
// naturalmente después de lo que cada página pinte, sin tocar cada página
// una por una.
//
// Content in every column is real, nothing invented: Navegación reuses
// NAV_ITEMS (src/lib/navItems.js — same list the "Índice" overlay uses, so
// the two can't drift out of sync). Contacto links the real address
// already used site-wide (contacto@relieve.design, see Terms.jsx's own
// "Escríbenos a contacto@relieve.design" — "Escríbenos" as the column
// heading is Ale's own word, given directly for this). No tagline/mission
// paragraph — none was provided, so none is added.
import { Link } from 'react-router-dom';
import SocialLinks from './SocialLinks.jsx';
import { NAV_ITEMS } from '../lib/navItems.js';

function FooterColumn({ heading, children }) {
  return (
    <div>
      <p className="text-[color:var(--color-graphite-muted)] mb-3">{heading}</p>
      {children}
    </div>
  );
}

export default function Footer() {
  return (
    <footer className="font-label uppercase tracking-wide text-xs text-[color:var(--color-graphite-muted)] border-t border-line px-8 py-10">
      <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
        <FooterColumn heading="Navegación">
          <ul className="space-y-2">
            {NAV_ITEMS.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className="hover:text-passport-ink transition-colors"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </FooterColumn>

        <FooterColumn heading="Escríbenos">
          <a
            href="mailto:contacto@relieve.design"
            className="normal-case hover:text-passport-ink transition-colors"
          >
            contacto@relieve.design
          </a>
        </FooterColumn>

        <FooterColumn heading="Legal">
          <ul className="space-y-2">
            <li>
              <Link
                to="/aviso-privacidad"
                className="hover:text-passport-ink hover:underline"
              >
                Aviso de privacidad
              </Link>
            </li>
            <li>
              <Link
                to="/terminos"
                className="hover:text-passport-ink hover:underline"
              >
                Términos
              </Link>
            </li>
          </ul>
        </FooterColumn>

        <FooterColumn heading="Síguenos">
          <SocialLinks />
        </FooterColumn>
      </div>
    </footer>
  );
}
