// Issue #42 — minimal translucent nav, solidifies on scroll, wordmark + cart.
// Checkpoint 5 — real logo file (was plain "relieve" text).
// Checkpoint 6 — thin floating bar instead of a persistent full-height one:
// reveals only when the mouse is near the top edge (same idea as the
// gallery's floating menu/filter buttons), same as `(pointer: fine)` hides
// the native cursor for a hover-driven pill elsewhere. Coarse pointers
// (touch) have no hover concept, so the bar just stays visible there.
// New logo (2026-07-25): the old lockup (mountain icon + "RELIEVE MÉXICO")
// was a single flattened PNG. Replaced with the new topographic mark (SVG,
// cropped to its own bounding box so it isn't mostly empty canvas) composed
// with real DOM text instead — an <img> of baked-in text would render in a
// generic fallback serif (images don't inherit the page's @font-face), so
// "RELIEVE"/"DESIGN" are actual text, which also makes future wordmark copy
// changes a text edit instead of a re-export. Icon recolored to `#B9CCD8`
// (blue, ui-ux.md's palette — Ale's call, the one reserved for
// details/accents, not primary text) — at nav size (~28px) that reads
// intentionally subtle against the cream bg, not a mistake; the wordmark
// stays in passport-ink so it's actually legible.
// Wordmark typeface (2026-07-25, same day): Ale didn't like Fraunces/Courier
// Prime here, wants this one spot to match a reference ("Palmer") — bold
// geometric sans. Uses `font-wordmark` (Poppins, index.css's @theme), a
// token scoped to exactly this lockup — not `font-display`, so this doesn't
// touch Fraunces anywhere else on the site.
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import markIcon from '../assets/brand/mark.svg';

// Was 72px — too easy to miss on a normal-sized viewport, effectively
// hiding the only way back to the catalog/cart from every product page.
// Widened per audit feedback; still small enough that it doesn't compete
// with the page content just below it.
const REVEAL_ZONE_PX = 200;

// brand-brief.md §16 decisión 7 — nav queda exactamente "Colecciones ·
// Método · Reseñas". Buscar/Regalar se quitan de aquí (las rutas siguen
// funcionando, solo dejan de estar enlazadas desde el nav superior).
// "Reseñas" apunta al ancla ya usada por el menú interno de Gallery.jsx.

export default function Nav() {
  const [solid, setSolid] = useState(false);
  const [visible, setVisible] = useState(
    () =>
      typeof window !== 'undefined' &&
      !window.matchMedia('(pointer: fine)').matches,
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
    if (hoverCapable)
      window.addEventListener('mousemove', onMouseMove, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (hoverCapable) window.removeEventListener('mousemove', onMouseMove);
    };
  }, []);

  return (
    <nav
      onFocusCapture={() => setVisible(true)}
      className={`fixed top-7 inset-x-0 z-40 flex items-center justify-between px-6 py-2 transition-[transform,opacity,background-color] duration-300 ${
        solid
          ? 'bg-gallery-white/95 backdrop-blur border-b border-line'
          : 'bg-transparent'
      } ${visible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'}`}
    >
      <Link to="/" className="flex items-center gap-2">
        <img src={markIcon} alt="" className="h-7 w-auto" />
        <span className="flex flex-col leading-none">
          <span className="font-wordmark font-bold text-lg tracking-tight text-passport-ink">
            RELIEVE
          </span>
          <span className="font-wordmark font-semibold text-[9px] tracking-[0.15em] text-passport-ink/70 mt-0.5">
            DESIGN
          </span>
        </span>
      </Link>
      <div className="flex items-center gap-6 font-label uppercase tracking-wide text-xs">
        <Link
          to="/colecciones"
          className="hover:text-passport-ink transition-colors"
        >
          Colecciones
        </Link>
        <Link
          to="/metodo-relieve"
          className="hover:text-passport-ink transition-colors"
        >
          Método
        </Link>
        <Link
          to="/colecciones#resenas"
          className="hover:text-passport-ink transition-colors"
        >
          Reseñas
        </Link>
        <button
          onClick={toggleCart}
          className="font-label uppercase tracking-wide hover:text-passport-ink transition-colors"
        >
          Carrito{count > 0 ? ` (${count})` : ''}
        </button>
      </div>
    </nav>
  );
}
