// Nav de desktop (17 ago 2026) — barra unificada: logo + links a la
// izquierda, Carrito solo a la derecha (ver Nav.jsx). Reemplaza el pill
// propio (rounded-full px-2 h-14) y el indicador "limelight" de página
// activa por texto sin íconos con la animación de doble línea deslizante
// que mandó Ale (referencia tipo Aceternity resizable-navbar) —
// confirmado con ella: sin indicador de página activa, solo hover. El
// pill-glass ahora lo pone Nav.jsx en el contenedor exterior, no aquí
// (evitaba un glass anidado dentro de otro).
// `leading-5` explícito en ambas líneas (18 ago 2026) — sin esto, el
// line-height por default de font-label/Courier Prime no calzaba con el
// h-5 del contenedor, y se veía un filo de la segunda línea asomando bajo
// el texto en reposo. Con leading-5 cada línea mide exactamente 20px, el
// stack de las dos suma 40px, h-5 (20px) recorta a una sola línea limpia,
// y el -translate-y-1/2 del hover se mueve exactamente esos 20px.
// Los 4 items siguen viniendo de mainNavItems.jsx, compartidos con
// FluidMenu.jsx (mobile, que conserva íconos — no se tocó).
import { useMainNavItems } from './mainNavItems.jsx';

function AnimatedNavItem({ as: Tag = 'a', children, ...props }) {
  return (
    <Tag
      {...props}
      className="group relative inline-block overflow-hidden h-5 flex items-center"
    >
      <span className="flex flex-col transition-transform duration-400 ease-out group-hover:-translate-y-1/2">
        <span className="font-label uppercase tracking-wide text-xs leading-5 text-brand-dark opacity-50">
          {children}
        </span>
        <span className="font-label uppercase tracking-wide text-xs leading-5 text-brand-dark opacity-100">
          {children}
        </span>
      </span>
    </Tag>
  );
}

// Colecciones, Método, Personaliza — Carrito vive aparte en DesktopCartLink
// para que Nav.jsx lo pueda anclar a la derecha con justify-between.
export default function DesktopNavLinks() {
  const items = useMainNavItems().filter((item) => item.key !== 'carrito');

  return (
    <nav className="flex items-center gap-6">
      {items.map((item) => (
        <AnimatedNavItem key={item.key} as={item.as} to={item.to}>
          {item.label}
        </AnimatedNavItem>
      ))}
    </nav>
  );
}

export function DesktopCartLink() {
  const cart = useMainNavItems().find((item) => item.key === 'carrito');
  if (!cart) return null;

  return (
    <AnimatedNavItem as="button" type="button" onClick={cart.onClick}>
      {cart.label}
    </AnimatedNavItem>
  );
}
