// 2026-08-09 landing rebrand hand-off §3 — loading screen. Plays once per
// browser session (sessionStorage — resets on a new tab, the conservative
// choice), on whatever route the visitor first lands on, not just '/'. No
// 0%→100% counter: purely visual.
//
// Efecto — iris/circle reveal (componente de referencia que Ale mandó:
// MaskContainer/RelieveIntroMask de Aceternity, adaptado): un círculo
// centrado crece desde un punto hasta cubrir toda la pantalla, revelando
// una foto real de catálogo debajo. El wordmark se ve chico al centro al
// inicio y se desvanece conforme el círculo crece sobre él. Reemplaza la
// versión anterior de este mismo archivo (wordmark partido en dos mitades
// que se separaban) — mismo trabajo (foto real de catálogo, gate de
// sesión), mecánica de reveal distinta.
//
// CORRECCIÓN vs. el componente de referencia: ahí el mask-image estaba
// aplicado a la capa negra+texto, no a la foto (revealText). Con
// mask-mode: alpha (el default para una imagen SVG referenciada sin
// fragmento #, que es como está aquí), eso hace que el círculo creciente
// revele MÁS texto/negro, no más foto — habría terminado en pantalla
// completa negra con "RELIEVE", al revés de lo que el propio comentario
// del original decía que pasaría ("revealText a pantalla completa").
// Aquí el mask va directo en la foto — mismo mask-mode: alpha que la
// versión anterior de este archivo ya usaba para enmascarar la foto a la
// silueta del wordmark — así el círculo creciente sí revela más foto.
//
// TRADUCCIÓN DEL RESTO:
// - framer-motion (`motion.div`, animate={{maskSize, maskPosition}}) →
//   @keyframes CSS puro (src/index.css, .loading-reveal-mask/
//   .loading-reveal-wordmark-fade) en vez de JS-ticked — mismo criterio
//   de confiabilidad que .tile-pop-in/.canvas-tile:hover ya documentan
//   ahí (una animación CSS nativa no depende de que el JS alcance a
//   programar cada frame). GSAP se queda solo para el fundido final del
//   overlay completo, igual que la versión anterior de este archivo.
// - El modo interactivo por hover (mousemove/isHovered) del original no
//   se portó — esta pantalla es puramente automática, nunca hay
//   interacción del usuario con ella.
// - Duración: 3s, el default de la referencia. Nota dejada explícita:
//   esto es MÁS LENTO que el ajuste que Ale pidió el 11 ago ("tardan
//   demasiado en cargar", recortado de ~1.6s a ~0.9s en su momento) —
//   decisión tomada a propósito en esta sesión, no silenciosa.
// - `size`/`revealSize` (10px/2000px) del original → mask-size fijo en
//   las keyframes, 0 → 3000px (cubre pantallas hasta ~4K con margen; el
//   propio original tampoco calculaba esto contra el viewport real, solo
//   usaba un número generoso fijo).
// - pieceMainThumb() (copia de 480px, pensada para tiles de catálogo de
//   175-360px) → pieceMainPhoto() (la fuente completa, ~2048px): esta
//   pantalla cubre el viewport entero con object-cover, y el thumb se
//   vería visiblemente borroso estirado a ese tamaño.
import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import wordmark from '../assets/brand/wordmark.svg';
import { pieceMainPhoto } from '../lib/photography.js';
import { alreadySeen, markSeen, pickRevealSlug } from '../lib/loadingReveal.js';

function getSessionStorage() {
  try {
    return typeof window !== 'undefined' ? window.sessionStorage : undefined;
  } catch {
    return undefined; // storage disabled (e.g. private mode) — treated as first visit
  }
}

// Círculo relleno sobre lienzo transparente — sin fragmento #, así que se
// carga como imagen plana y mask-mode resuelve a alpha por default (mismo
// criterio que mask.svg del componente de referencia). mask-size controla
// el diámetro renderizado; el propio viewBox no necesita cambiar.
const MASK_CIRCLE_SVG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='50' fill='black'/%3E%3C/svg%3E";

export default function LoadingReveal() {
  const [visible, setVisible] = useState(() => !alreadySeen(getSessionStorage()));
  const rootRef = useRef(null);
  const photoRef = useRef(null);

  const photoSlug = useRef(pickRevealSlug()).current;
  const photoUrl = pieceMainPhoto(photoSlug);

  useEffect(() => {
    if (!visible) return;
    markSeen(getSessionStorage());

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      // Sin reveal — mismo criterio que la versión anterior de este
      // archivo: fundido rápido del overlay completo, sin la mecánica de
      // círculo/wordmark.
      gsap.to(rootRef.current, {
        opacity: 0,
        duration: 0.3,
        delay: 0.15,
        onComplete: () => setVisible(false),
      });
      return;
    }

    // El crecimiento del círculo corre solo (CSS, .loading-reveal-mask).
    // Cuando termina, un fundido corto del overlay completo (GSAP) antes
    // de desmontar — igual que la versión anterior de este archivo.
    function onMaskDone() {
      gsap.to(rootRef.current, {
        opacity: 0,
        duration: 0.25,
        ease: 'power1.in',
        onComplete: () => setVisible(false),
      });
    }
    const photoEl = photoRef.current;
    photoEl?.addEventListener('animationend', onMaskDone, { once: true });
    return () => photoEl?.removeEventListener('animationend', onMaskDone);
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      className="fixed inset-0 z-[300] bg-piedra pointer-events-none overflow-hidden"
    >
      {photoUrl && (
        <img
          ref={photoRef}
          src={photoUrl}
          alt=""
          className="absolute inset-0 w-full h-full object-cover loading-reveal-mask"
          style={{
            maskImage: `url(${MASK_CIRCLE_SVG})`,
            maskMode: 'alpha',
            maskRepeat: 'no-repeat',
            maskPosition: 'center',
            WebkitMaskImage: `url(${MASK_CIRCLE_SVG})`,
            WebkitMaskRepeat: 'no-repeat',
            WebkitMaskPosition: 'center',
          }}
        />
      )}
      <img
        src={wordmark}
        alt=""
        className="absolute inset-0 m-auto w-[min(40vw,220px)] h-auto loading-reveal-wordmark-fade"
      />
    </div>
  );
}
