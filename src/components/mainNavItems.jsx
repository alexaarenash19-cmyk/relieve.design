// Extraído de FluidMenu.jsx (15 ago 2026) — los 4 items reales del nav
// (confirmados con Ale, no los 7 de navItems.js) y sus íconos ahora viven
// aquí porque dos componentes los necesitan: FluidMenu.jsx (mobile, botón
// hamburguesa que expande) y DesktopNav.jsx (desktop, barra horizontal
// tipo Apple menu bar — ver ese archivo). Antes de este cambio la barra
// de desktop se encogía/centraba al hacer scroll (navPillMorph en
// Nav.jsx) y terminaba tapando contenido; DesktopNav.jsx reemplaza ese
// comportamiento solo en md+, FluidMenu.jsx sigue intacto en mobile.
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';

export function GridIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="18" height="18" {...props}>
      <rect x="4" y="4" width="7" height="7" rx="1" />
      <rect x="13" y="4" width="7" height="7" rx="1" />
      <rect x="4" y="13" width="7" height="7" rx="1" />
      <rect x="13" y="13" width="7" height="7" rx="1" />
    </svg>
  );
}
export function ContourIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="18" height="18" {...props}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5.5" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}
export function BagIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="18" height="18" {...props}>
      <path d="M6 8h12l-1 12H7L6 8z" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
    </svg>
  );
}
export function PencilIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="18" height="18" {...props}>
      <path d="M4 20l1-4 11-11 3 3-11 11-4 1z" />
      <path d="M14 6l3 3" />
    </svg>
  );
}

// eslint-disable-next-line react-refresh/only-export-components -- shared hook belongs next to the icons it composes into items
export function useMainNavItems() {
  const { items, toggleCart, isOpen } = useCart();
  const count = items.reduce((sum, i) => sum + i.qty, 0);

  return [
    { key: 'colecciones', label: 'Colecciones', icon: GridIcon, as: Link, to: '/colecciones' },
    { key: 'metodo', label: 'Método', icon: ContourIcon, as: Link, to: '/metodo-relieve' },
    {
      key: 'carrito',
      label: count > 0 ? `Carrito (${count})` : 'Carrito',
      icon: BagIcon,
      as: 'button',
      onClick: toggleCart,
      isActive: isOpen,
    },
    { key: 'personaliza', label: 'Personaliza', icon: PencilIcon, as: Link, to: '/personaliza' },
  ];
}
