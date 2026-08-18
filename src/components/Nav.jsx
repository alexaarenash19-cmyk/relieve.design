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
// Museográfico pass (11 ago 2026, updated) — the header is down to two
// zones now: wordmark (left) and a single circular menu button (right).
// "Colecciones"/"Método" text links and the standalone "Carrito (n)"
// button moved inside FluidMenu.jsx (which also replaced the earlier
// full-screen "Índice" overlay — see FluidMenu.jsx's own header for that
// history). Wordmark still links home, same as always.
//
// Pill-shrink on scroll (componente de referencia de Aceternity,
// resizable-navbar.tsx, adaptado): en vez del swap plano de fondo que
// tenía antes (bg-transparent -> bg-gallery-white/95), la barra completa
// se encoge a una pill centrada y flota un poco hacia abajo al pasar
// solid=true. La franja `<nav>` externa sigue siendo full-width — solo
// controla el reveal-on-hover (visible) sin cambios; el nuevo <div
// ref={pillRef}> interno es lo que de verdad se encoge, así que
// wordmark+FluidMenu quedan juntos en el centro al hacer scroll en vez de
// en los extremos. wordmark/FluidMenu NO cambian de tamaño — el "encoger"
// es la barra angostándose alrededor de contenido de tamaño fijo, no el
// contenido mismo (Ale pidió el wordmark grande a propósito, no se toca).
// Material: reusa .pill-glass (mismo Liquid Glass del resto del sitio) en
// vez del bg-gallery-white/95 plano anterior — consistente con el resto
// de pills/botones ya migrados en la auditoría del 11 ago.
//
// Desktop deja de encogerse (15 ago 2026) — Ale reportó que en pantallas
// grandes el pill-shrink de abajo (navPillMorph) terminaba juntando
// wordmark+menú en una pill chica centrada que tapaba contenido al bajar.
// En mobile funciona bien, así que navPillMorph solo corre ahí ahora; en
// md+ la barra se queda a ancho completo siempre (nunca se anima
// width/borderRadius/y), solo cambia de fondo transparente a pill-glass.
// FluidMenu (hamburguesa) sigue siendo el menú en mobile; DesktopNav.jsx
// (barra horizontal siempre visible, con label) lo reemplaza en md+ — ver
// mainNavItems.jsx para los 4 items que ambos comparten.
//
// Barra unificada en desktop (17 ago 2026) — Ale reportó la pill de
// DesktopNav (extremo derecho) chocando visualmente con el toggle "vista
// cuadrícula" de Gallery.jsx en /colecciones, y mandó una referencia
// (Aceternity resizable-navbar) con logo+links+acciones en una sola
// barra. En vez de dos pills separadas (logo a la izquierda, DesktopNav
// aparte a la derecha), ahora el grupo {logo + DesktopNavLinks} queda
// junto a la izquierda y {DesktopCartLink} solo a la derecha, dentro del
// mismo <div ref={pillRef}> — sigue siendo un solo justify-between de dos
// grupos, no tres, para que el carrito quede pegado al borde derecho.
// DesktopNav.jsx perdió su pill propia (rounded-full px-2 h-14) y su
// indicador de página activa — ver ese archivo.
//
// Toggle "vista cuadrícula"/"vista lienzo" (18 ago 2026) — el mismo
// choque visual pasaba con la pill sticky de Gallery.jsx (Home). Ahora
// DesktopViewToggle vive en el grupo de la derecha, junto a
// DesktopCartLink, y se auto-oculta (return null) en cualquier página que
// no sea Home — ver GalleryViewContext.jsx.
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import wordmark from '../assets/brand/wordmark.svg';
import FluidMenu from './FluidMenu.jsx';
import DesktopNavLinks, { DesktopCartLink, DesktopViewToggle } from './DesktopNav.jsx';
import { navPillMorph } from '../lib/animations.js';

// Was 72px — too easy to miss on a normal-sized viewport, effectively
// hiding the only way back to the catalog/cart from every product page.
// Widened per audit feedback; still small enough that it doesn't compete
// with the page content just below it.
const REVEAL_ZONE_PX = 200;

export default function Nav() {
  const [solid, setSolid] = useState(false);
  const [visible, setVisible] = useState(
    () =>
      typeof window !== 'undefined' &&
      !window.matchMedia('(pointer: fine)').matches,
  );
  const pillRef = useRef(null);

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

  useEffect(() => {
    // Solo mobile — ver nota arriba. Chequeo una vez, mismo criterio que
    // el chequeo de `(pointer: fine)` de arriba (no escucha resize).
    const isDesktop = window.matchMedia('(min-width: 768px)').matches;
    if (!isDesktop) navPillMorph(pillRef.current, solid);
  }, [solid]);

  return (
    <nav
      onFocusCapture={() => setVisible(true)}
      className={`fixed top-7 inset-x-0 z-40 flex justify-center transition-[transform,opacity] duration-300 ${
        visible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'
      }`}
    >
      <div
        ref={pillRef}
        className={`flex items-center justify-between gap-6 px-6 py-2 w-full ${solid ? 'pill-glass' : ''}`}
      >
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center shrink-0">
            <img
              src={wordmark}
              alt="Relieve Design"
              className="h-14 w-auto"
              style={{ aspectRatio: '524 / 331' }}
            />
          </Link>
          <div className="hidden md:flex">
            <DesktopNavLinks />
          </div>
        </div>
        <div className="md:hidden">
          <FluidMenu />
        </div>
        <div className="hidden md:flex items-center gap-6">
          <DesktopViewToggle />
          <DesktopCartLink />
        </div>
      </div>
    </nav>
  );
}
