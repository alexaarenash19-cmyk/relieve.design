// Issue #42 — minimal translucent nav, solidifies on scroll, wordmark + cart.
// Checkpoint 5 — real logo file (was plain "relieve" text).
// Checkpoint 6 — thin floating bar instead of a persistent full-height one:
// reveals only when the mouse is near the top edge (same idea as the
// gallery's floating menu/filter buttons), same as `(pointer: fine)` hides
// the native cursor for a hover-driven pill elsewhere. Coarse pointers
// (touch) have no hover concept, so the bar just stays visible there.
// Full wordmark (2026-08-09): Ale's vectorized "relieve" logotype
// (src/assets/brand/wordmark.svg), site-wide, replacing the old icon+text
// lockup. Sized much larger per her follow-up ("hazlo mucho mas grande") —
// h-14 instead of the original h-7. Page containers need enough top
// padding to clear the taller bar now (see Collections.jsx) — the nav
// stays `fixed`/translucent-until-scroll on purpose (floats over the
// hero), so content has to leave room for it, not the other way around.
//
// Museográfico pass (11 ago 2026) — menu trigger (MenuIconButton, shared
// with Gallery.jsx's own canvas menu button) that opens a full-screen
// "Índice" overlay (MenuOverlay.jsx).
//
// Addendum (11 ago 2026) — the scroll-progress `NN%` counter added in the
// same pass was removed per Ale's follow-up addendum (supersedes Fase A1
// of plan-relieve-museografico.md and the "Header fijo" section of
// actualizacion-landing-relieve.md): not implemented in any form, plain or
// "ALT."-prefixed. Header stays two zones (wordmark / links+menu), not
// three. If a reading-progress indicator is wanted later it's a small,
// isolated addition — no layout space reserved for it here.
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import wordmark from '../assets/brand/wordmark.svg';
import MenuIconButton from './MenuIconButton.jsx';
import MenuOverlay from './MenuOverlay.jsx';

// Was 72px — too easy to miss on a normal-sized viewport, effectively
// hiding the only way back to the catalog/cart from every product page.
// Widened per audit feedback; still small enough that it doesn't compete
// with the page content just below it.
const REVEAL_ZONE_PX = 200;

// 2026-08-09 landing rebrand hand-off §6 — supersedes brand-brief.md §16
// decisión 7 ("Colecciones · Método · Reseñas"): "Reseñas" deja de ser un
// ítem de nav propio y su contenido vive dentro de "Método"
// (/metodo-relieve#resenas), igual que "Sobre" (#sobre) — ambos ya no
// tienen ruta ni entrada de menú independiente. Nav queda "Colecciones ·
// Método".

export default function Nav() {
  const [solid, setSolid] = useState(false);
  const [visible, setVisible] = useState(
    () =>
      typeof window !== 'undefined' &&
      !window.matchMedia('(pointer: fine)').matches,
  );
  const [menuOpen, setMenuOpen] = useState(false);
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
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    if (hoverCapable)
      window.addEventListener('mousemove', onMouseMove, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (hoverCapable) window.removeEventListener('mousemove', onMouseMove);
    };
  }, []);

  return (
    <>
      <nav
        onFocusCapture={() => setVisible(true)}
        className={`fixed top-7 inset-x-0 z-40 flex items-center justify-between px-6 py-2 transition-[transform,opacity,background-color] duration-300 ${
          solid
            ? 'bg-gallery-white/95 backdrop-blur border-b border-line'
            : 'bg-transparent'
        } ${visible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'}`}
      >
        <Link to="/" className="flex items-center">
          <img src={wordmark} alt="Relieve Design" className="h-14 w-auto" />
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
          <button
            onClick={toggleCart}
            className="font-label uppercase tracking-wide hover:text-passport-ink transition-colors"
          >
            Carrito{count > 0 ? ` (${count})` : ''}
          </button>
          <MenuIconButton
            open={menuOpen}
            onToggle={() => setMenuOpen((o) => !o)}
            label="índice"
          />
        </div>
      </nav>
      <MenuOverlay open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}
