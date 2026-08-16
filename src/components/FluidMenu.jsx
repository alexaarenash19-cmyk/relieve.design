// Museográfico pass (11 ago 2026) — reemplaza el overlay de pantalla
// completa "Índice" (MenuOverlay.jsx/IndexRow.jsx, retirados) por un botón
// circular que se expande localmente en el header, adaptando el patrón
// Menu/MenuItem/MenuContainer que Ale mandó como referencia (círculo
// 64px, stack vertical escalonado, translateY+opacity+clipPath,
// 300ms cubic-bezier(0.4,0,0.2,1)) a los tokens reales de Relieve — sin
// lucide-react (no está en package.json; íconos inline en el mismo estilo
// stroke="currentColor" que ya usa SocialLinks.jsx).
// Nota (14 ago 2026): cempasúchil, el acento que este archivo usaba para
// el hover de los íconos, se retiró del sitio (ver index.css) — el hover
// ahora se apoya en el propio brillo de fondo que .pill-glass ya define
// en su :hover, sin necesitar un color de ícono aparte. El comentario
// original sobre "sin tema dual" también quedó viejo — dark mode ya
// existe (ThemeContext.jsx).
//
// Contenido — confirmado con Ale: 4 items, no los 7 de navItems.js.
// Inicio no es un item (el wordmark ya enlaza a "/"). Carrito abre el
// CartDrawer existente (toggleCart, mismo hook de siempre) en vez de
// navegar, y conserva el badge de cantidad.
//
// El propio círculo trae su transición hamburguesa↔X integrada — no
// reutiliza MenuIconButton.jsx (ese sigue intacto solo en Gallery.jsx,
// para su propio botón de menú del canvas; no es el mismo trigger, no
// aplica la regla de "una sola transición por lugar").
//
// Solo mobile (15 ago 2026) — este botón hamburguesa que expande sigue
// siendo el nav en pantallas chicas (Ale confirmó que ahí funciona bien).
// En md+ ahora vive DesktopNav.jsx en su lugar (ver Nav.jsx, que renderiza
// ambos y usa `md:hidden`/`hidden md:flex` para alternar) — los 4 items y
// sus íconos se movieron a mainNavItems.jsx para que ambos los compartan
// sin duplicar el SVG de cada ícono.
import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useEscapeKey } from '../lib/useEscapeKey.js';
import { useClickOutside } from '../lib/useClickOutside.js';
import { useMainNavItems } from './mainNavItems.jsx';

const STAGGER_MS = 40;

export default function FluidMenu() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const MENU_ITEMS = useMainNavItems();

  function close() {
    setOpen(false);
  }
  useEscapeKey(close);
  useClickOutside(containerRef, close);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
        aria-expanded={open}
        className="pill-glass rounded-full w-16 h-16 flex items-center justify-center text-brand-dark"
      >
        <span className="relative w-[18px] h-[13px]" aria-hidden="true">
          <span
            className="absolute left-0 w-full h-[1.5px] bg-current transition-all duration-300"
            style={{
              top: open ? '50%' : 0,
              transform: open ? 'translateY(-50%) rotate(45deg)' : 'none',
            }}
          />
          <span
            className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-[1.5px] bg-current transition-opacity duration-200"
            style={{ opacity: open ? 0 : 1 }}
          />
          <span
            className="absolute left-0 bottom-0 w-full h-[1.5px] bg-current transition-all duration-300"
            style={{
              top: open ? '50%' : 'auto',
              transform: open ? 'translateY(-50%) rotate(-45deg)' : 'none',
            }}
          />
        </span>
      </button>

      <div
        role="menu"
        inert={!open}
        className={`absolute top-full right-0 mt-3 flex flex-col items-end gap-3 transition-opacity duration-200 ${
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {MENU_ITEMS.map((item, i) => {
          const Tag = item.as;
          const itemProps =
            Tag === Link
              ? { to: item.to, onClick: close }
              : { type: 'button', onClick: () => { item.onClick(); close(); } };
          return (
            <div
              key={item.key}
              className="flex items-center gap-3 transition-[transform,opacity,clip-path] ease-[cubic-bezier(0.4,0,0.2,1)]"
              style={{
                transitionDuration: '300ms',
                transitionDelay: open ? `${i * STAGGER_MS}ms` : '0ms',
                transform: open ? 'translateY(0)' : 'translateY(-8px)',
                opacity: open ? 1 : 0,
                clipPath: open ? 'inset(0 0 0 0)' : 'inset(0 0 100% 0)',
              }}
            >
              <span className="font-label uppercase tracking-wide text-xs text-graphite/70 whitespace-nowrap">
                {item.label}
              </span>
              <Tag
                {...itemProps}
                role="menuitem"
                className="pill-glass rounded-full w-12 h-12 flex items-center justify-center text-brand-dark transition-colors"
              >
                <item.icon />
              </Tag>
            </div>
          );
        })}
      </div>
    </div>
  );
}
