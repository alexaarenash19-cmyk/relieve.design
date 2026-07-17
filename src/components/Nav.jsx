// Issue #42 — minimal translucent nav, solidifies on scroll, wordmark + cart.
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';

export default function Nav() {
  const [solid, setSolid] = useState(false);
  const { items, toggleCart } = useCart();
  const count = items.reduce((sum, i) => sum + i.qty, 0);

  useEffect(() => {
    function onScroll() {
      setSolid(window.scrollY > 40);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav
      className={`sticky top-0 z-40 flex items-center justify-between px-6 py-4 transition-colors duration-200 ${
        solid ? 'bg-gallery-white/95 backdrop-blur border-b border-line' : 'bg-transparent'
      }`}
    >
      <Link to="/" className="font-display font-light text-lg">
        relieve
      </Link>
      <div className="flex items-center gap-6 font-label uppercase tracking-wide text-xs">
        <Link to="/buscar" data-cursor-label="Ver destino" className="hover:text-passport-ink transition-colors">
          Buscar
        </Link>
        <Link to="/sobre" data-cursor-label="Ver destino" className="hover:text-passport-ink transition-colors">
          Sobre
        </Link>
        <button onClick={toggleCart} className="font-label uppercase tracking-wide hover:text-passport-ink transition-colors">
          Carrito{count > 0 ? ` (${count})` : ''}
        </button>
      </div>
    </nav>
  );
}
