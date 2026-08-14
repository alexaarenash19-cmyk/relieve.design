// Toggle de modo claro/oscuro — porte de AnimatedThemeToggler (Aceternity/
// MagicUI), recortado a la única forma que se usa: círculo (las otras 6 —
// cuadrado/triángulo/diamante/hexágono/rectángulo/estrella — no se
// portan, YAGNI confirmado con el usuario). Sin lucide-react (no está
// instalado, mismo criterio que FluidMenu.jsx) — íconos inline
// stroke="currentColor", mismo estilo que los de ese archivo.
//
// Modo CONTROLADO: lee/escribe el tema vía useTheme() (ThemeContext.jsx),
// nunca localStorage propio — el componente de referencia escribe en
// localStorage.theme por default, la clave equivocada para la convención
// relieve_* de este repo.
//
// bg-graphite/text-gallery-white en vez de tokens dedicados: en modo claro
// es un círculo oscuro con ícono claro; como ambos tokens se invierten
// bajo .dark (src/index.css), en modo oscuro el mismo par de clases da un
// círculo claro con ícono oscuro — la inversión del botón es gratis, viene
// del propio sistema de tokens, no hace falta un color especial para él.
import { useCallback, useRef } from 'react';
import { flushSync } from 'react-dom';
import { useTheme } from '../context/ThemeContext.jsx';

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="18" height="18" aria-hidden="true">
      <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z" />
    </svg>
  );
}
function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="18" height="18" aria-hidden="true">
      <circle cx="12" cy="12" r="4.5" />
      <path d="M12 2.5v2M12 19.5v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2.5 12h2M19.5 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" />
    </svg>
  );
}

const DURATION_MS = 400;

function circleClipPaths(cx, cy, maxRadius, vw, vh) {
  const toX = (x) => `${(x / vw) * 100}%`;
  const toY = (y) => `${(y / vh) * 100}%`;
  const toRadius = (r) => `${(r / (Math.hypot(vw, vh) / Math.SQRT2)) * 100}%`;
  const point = `${toX(cx)} ${toY(cy)}`;
  return [`circle(0% at ${point})`, `circle(${toRadius(maxRadius)} at ${point})`];
}

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const buttonRef = useRef(null);
  const isTransitioningRef = useRef(false);
  const isDark = theme === 'dark';

  const onClick = useCallback(() => {
    const button = buttonRef.current;
    if (!button || isTransitioningRef.current) return;

    if (typeof document.startViewTransition !== 'function') {
      toggleTheme();
      return;
    }

    const { top, left, width, height } = button.getBoundingClientRect();
    const x = left + width / 2;
    const y = top + height / 2;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const maxRadius = Math.hypot(Math.max(x, vw - x), Math.max(y, vh - y));
    const clipPath = circleClipPaths(x, y, maxRadius, vw, vh);

    isTransitioningRef.current = true;
    const transition = document.startViewTransition(() => {
      flushSync(toggleTheme);
    });
    transition.finished.finally(() => {
      isTransitioningRef.current = false;
    }).catch(() => {});

    transition.ready
      .then(() => {
        document.documentElement.animate(
          { clipPath },
          { duration: DURATION_MS, easing: 'ease-in-out', pseudoElement: '::view-transition-new(root)' },
        );
      })
      .catch(() => {});
  }, [toggleTheme]);

  return (
    <button
      type="button"
      ref={buttonRef}
      onClick={onClick}
      aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      className="fixed bottom-6 left-6 z-40 w-11 h-11 rounded-full flex items-center justify-center bg-graphite text-gallery-white"
    >
      {isDark ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}
