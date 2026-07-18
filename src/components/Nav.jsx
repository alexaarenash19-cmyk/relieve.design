// Issue #42 — minimal translucent nav, solidifies on scroll, wordmark + cart.
// Checkpoint 5 — real logo file (was plain "relieve" text).
// Checkpoint 6 — thin floating bar instead of a persistent full-height one:
// reveals only when the mouse is near the top edge (same idea as the
// gallery's floating menu/filter buttons), same as `(pointer: fine)` hides
// the native cursor for a hover-driven pill elsewhere. Coarse pointers
// (touch) have no hover concept, so the bar just stays visible there.
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import logoHorizontal from '../assets/brand/logo-horizontal.png';

const REVEAL_ZONE_PX = 72;

export default function Nav() {
  const [solid, setSolid] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [visible, setVisible] = useState(
    () => typeof window !== 'undefined' && !window.matchMedia('(pointer: fine)').matches
  );
  const { items, toggleCart } = useCart();
  const count = items.reduce((sum, i) => sum + i.qty, 0);

  useEffect(() => {
    const hoverCapable = window.matchMedia('(pointer: fine)').matches;

    function onScroll() {
      setSolid(window.scrollY > 40);
    }
    function onMouseMove(e) {
      setVisible(e.clientY < REVEAL_ZONE_PX);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    if (hoverCapable) window.addEventListener('mousemove', onMouseMove, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (hoverCapable) window.removeEventListener('mousemove', onMouseMove);
    };
  }, []);

  return (
    <nav
      onFocusCapture={() => setVisible(true)}
      className={`fixed top-0 inset-x-0 z-40 flex items-center justify-between px-6 py-2 transition-[transform,opacity,background-color] duration-300 ${
        solid ? 'bg-gallery-white/95 backdrop-blur border-b border-line' : 'bg-transparent'
      } ${visible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'}`}
    >
      <Link to="/" className="flex items-center">
        <img src={logoHorizontal} alt="Relieve México" className="h-6 w-auto" />
      </Link>
      <div className="flex items-center gap-6 font-label uppercase tracking-wide text-xs">
        <Link to="/buscar" data-cursor-label="Ver destino" className="hover:text-passport-ink transition-colors">
          Buscar
        </Link>
        <Link
          to="/sobre"
          data-cursor-label="Ver destino"
          className="hidden sm:inline hover:text-passport-ink transition-colors"
        >
          Sobre
        </Link>
        <button onClick={toggleCart} className="font-label uppercase tracking-wide hover:text-passport-ink transition-colors">
          Carrito{count > 0 ? ` (${count})` : ''}
        </button>
        <button
          onClick={() => setMenuOpen((v) => !v)}
          aria-expanded={menuOpen}
          aria-label="Menú"
          className="sm:hidden font-label uppercase tracking-wide hover:text-passport-ink transition-colors"
        >
          Menú
        </button>
      </div>
      {menuOpen && (
        <div className="sm:hidden absolute top-full right-6 mt-1 bg-gallery-white/95 backdrop-blur border border-line rounded-[9px] px-4 py-3">
          <Link
            to="/sobre"
            data-cursor-label="Ver destino"
            onClick={() => setMenuOpen(false)}
            className="font-label uppercase tracking-wide text-xs hover:text-passport-ink transition-colors"
          >
            Sobre
          </Link>
        </div>
      )}
    </nav>
  );
}
