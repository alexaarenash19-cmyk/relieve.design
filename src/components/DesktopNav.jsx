// Nav de desktop (15 ago 2026) — reemplaza FluidMenu en md+. El pill
// hamburguesa de FluidMenu.jsx, combinado con navPillMorph's encoger-y-
// centrar al hacer scroll (Nav.jsx), terminaba juntando wordmark+botón en
// una pill chica que tapaba contenido en pantallas grandes — Ale lo
// confirmó, mobile en cambio funciona bien así (FluidMenu.jsx sigue
// intacto ahí). Referencia que mandó: LimelightNav (barra horizontal,
// tamaño fijo, indicador delgado que se desliza a la opción activa) —
// adaptado a los tokens de Relieve: pill-glass en vez de bg-card/border,
// texto uppercase font-label como el resto del sitio en vez de labels
// planos, brand-dark como color del indicador (no hay un accent-color
// vivo desde que cempasúchil se retiró — ver FluidMenu.jsx).
// Los 4 items vienen de mainNavItems.jsx, compartidos con FluidMenu.jsx.
import { useLayoutEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useMainNavItems } from './mainNavItems.jsx';

export default function DesktopNav() {
  const items = useMainNavItems();
  const location = useLocation();
  const itemRefs = useRef([]);
  const limelightRef = useRef(null);
  const [ready, setReady] = useState(false);

  const activeIndex = items.findIndex((item) =>
    item.to ? location.pathname === item.to : item.isActive,
  );

  useLayoutEffect(() => {
    const limelight = limelightRef.current;
    const activeEl = itemRefs.current[activeIndex];
    if (!limelight) return;

    // Ningún item activo (ej. estás en "/") — el indicador se esconde en
    // vez de quedarse pegado en el último activo, no hay "Inicio" en esta
    // barra (el wordmark ya cumple ese rol, mismo criterio que FluidMenu).
    if (!activeEl) {
      limelight.style.opacity = '0';
      return;
    }
    limelight.style.opacity = '1';
    const newLeft = activeEl.offsetLeft + activeEl.offsetWidth / 2 - limelight.offsetWidth / 2;
    limelight.style.left = `${newLeft}px`;
    if (!ready) setReady(true);
  }, [activeIndex, ready]);

  return (
    <nav className="relative flex items-center gap-1 pill-glass rounded-full px-2 h-14">
      {items.map((item, i) => {
        const Tag = item.as;
        const itemProps =
          Tag === 'button' ? { type: 'button', onClick: item.onClick } : { to: item.to };
        const isActive = i === activeIndex;
        return (
          <Tag
            key={item.key}
            ref={(el) => (itemRefs.current[i] = el)}
            {...itemProps}
            className="relative z-10 flex items-center gap-2 h-full px-4 rounded-full text-brand-dark transition-colors"
          >
            <item.icon className={`transition-opacity duration-150 ${isActive ? 'opacity-100' : 'opacity-50'}`} />
            <span
              className={`font-label uppercase tracking-wide text-xs whitespace-nowrap transition-opacity duration-150 ${
                isActive ? 'opacity-100' : 'opacity-50'
              }`}
            >
              {item.label}
            </span>
          </Tag>
        );
      })}

      <div
        ref={limelightRef}
        aria-hidden="true"
        className={`absolute bottom-1.5 z-0 w-8 h-[3px] rounded-full bg-brand-dark opacity-0 ${
          ready ? 'transition-[left,opacity] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]' : ''
        }`}
        style={{ left: '-999px' }}
      />
    </nav>
  );
}
