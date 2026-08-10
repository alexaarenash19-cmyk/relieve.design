// src/lib/animations.js
//
// Funciones puras de GSAP para la experiencia "Explorar" (Gallery.jsx +
// ProductPanel.jsx). Cada función recibe el/los elemento(s) sobre los que
// actúa (nunca un selector propio del mockup) para poder llamarse desde
// cualquier ref real de React.
//
// FUENTE DE LOS VALORES: rama real del repo relieve-web
// `explorar-brick-grid-split-panel` (la rama de PR #140, que ya porteó la
// artifact "Relieve — Explorar (preview)" línea por línea, con nota propia
// de "confirmado leyendo el JS real del artifact" en varios de estos
// efectos). Ningún número aquí abajo es inventado — donde no hay un valor
// confirmado contra el artifact original, el comentario lo dice
// explícitamente ("NO VERIFICADO").
//
import gsap from 'gsap';
import { CustomEase } from 'gsap/CustomEase';

gsap.registerPlugin(CustomEase);
// El --ease del artifact (cubic-bezier(0.2,0.6,0.2,1)) como ease reusable con
// nombre — GSAP no acepta un string "cubic-bezier(...)" suelto sin esto.
CustomEase.create('relieveEase', '0.2, 0.6, 0.2, 1');

function reduceMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// ─────────────────────────────────────────────────────────────────────────
// EFECTO 1 — Entrada de un tile en el lienzo (GalleryCard, variant="scattered")
// ┌────────────┬─────────────────┬────────┬────────────────┬───────────────┐
// │ target     │ props           │ dur    │ delay          │ ease          │
// ├────────────┼─────────────────┼────────┼────────────────┼───────────────┤
// │ el (tile)  │ scale, opacity  │ 0.5s   │ Math.random()  │ power1.inOut  │
// │            │ 0 → 1           │        │ * 0.4          │               │
// │ reduced-motion: dur 0.01s, delay 0                                     │
// └─────────────────────────────────────────────────────────────────────────
// Sin rotación ni perspectiva 3D — confirmado ausente en el artifact
// original, no es una omisión. Corre una vez por montaje del elemento.
// ─────────────────────────────────────────────────────────────────────────
export function tilePopIn(el) {
  if (!el) return;
  const reduced = reduceMotion();
  gsap.set(el, { scale: 0, opacity: 0 });
  gsap.to(el, {
    scale: 1,
    opacity: 1,
    duration: reduced ? 0.01 : 0.5,
    ease: 'power1.inOut',
    delay: reduced ? 0 : Math.random() * 0.4,
  });
}

// ─────────────────────────────────────────────────────────────────────────
// EFECTO 2 — Hover de un tile del lienzo (.canvas-tile:hover)
// Deliberadamente NO es GSAP en el código real — es un keyframe CSS
// (tile-hover-pop) + transition de vuelta. Se documenta aquí solo como
// referencia; ver el bloque <style> del propio archivo para los valores:
//   .canvas-tile:hover { animation: tile-hover-pop 0.55s
//     cubic-bezier(0.2,0.6,0.2,1) forwards; }
//   keyframes: 0% scale(1)/y(0)/rot(0) → 35% scale(1.1)/y(-12px)/rot(-1.5deg)
//     → 60% scale(1.04)/y(-2px)/rot(1deg) → 100% scale(1.065)/y(-6px)/rot(0)
// Razón real (comentario del repo): GSAP tuerce el estilo inline una sola
// vez al montar y luego no vuelve a tocar el elemento — así el hover puede
// ser una simple transition CSS sin pelearse con un `animation` inline
// persistente. No se "convierte" a GSAP aquí porque haría exactamente lo
// mismo con más código.
// ─────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────
// EFECTO 3 — Morph del ícono de menú (MenuButton: hamburguesa → X)
// Un solo gsap.timeline({paused:true}), reproducido/revertido con
// .play()/.reverse() al hacer click. Todos los .to() arrancan en la
// posición 0 (en paralelo):
// ┌──────────────┬────────────────────────┬───────┬─────────────────┐
// │ target       │ prop                   │ dur   │ ease            │
// ├──────────────┼────────────────────────┼───────┼─────────────────┤
// │ box          │ borderRadius → 3em     │ 0.8s  │ power2.out      │
// │ lineMid      │ scaleX → 0             │ 0.6s  │ back.out(1.7)   │
// │ lineTop      │ rotate 45, marginTop 0 │ 0.7s  │ back.out(1.7)   │
// │ lineBot      │ rotate -45, marginTop 0│ 0.7s  │ back.out(1.7)   │
// │ label        │ yPercent 200, opacity 0│ 0.6s  │ back.out(1.7)   │
// │ btn (solo si viewport < 640px): x: '2.5em', 0.7s, back.out(1.7) │
// └──────────────────────────────────────────────────────────────────┘
// reduced-motion: tl.duration(0.01) completo.
// ─────────────────────────────────────────────────────────────────────────
export function menuIconMorphTimeline({ btn, box, lineTop, lineMid, lineBot, label }, { mobile } = {}) {
  const tl = gsap.timeline({ paused: true })
    .to(box, { borderRadius: '3em', duration: 0.8, ease: 'power2.out' }, 0)
    .to(lineMid, { scaleX: 0, duration: 0.6, ease: 'back.out(1.7)' }, 0)
    .to(lineTop, { rotate: 45, marginTop: 0, duration: 0.7, ease: 'back.out(1.7)' }, 0)
    .to(lineBot, { rotate: -45, marginTop: 0, duration: 0.7, ease: 'back.out(1.7)' }, 0)
    .to(label, { yPercent: 200, opacity: 0, duration: 0.6, ease: 'back.out(1.7)' }, 0);
  if (mobile) tl.to(btn, { x: '2.5em', duration: 0.7, ease: 'back.out(1.7)' }, 0);
  if (reduceMotion()) tl.duration(0.01);
  return tl;
}

// Micro-hover del botón de menú (aparte de la timeline de apertura, arriba):
// mientras CERRADO, la línea del medio se acorta; mientras ABIERTO, las dos
// líneas diagonales (ya convertidas en la X) cierran un poco su ángulo.
// Todo 0.3s power2.out.
export function menuIconHoverEnter({ lineTop, lineMid, lineBot }, open) {
  if (open) {
    gsap.to(lineTop, { rotate: 35, duration: 0.3, ease: 'power2.out' });
    gsap.to(lineBot, { rotate: -35, duration: 0.3, ease: 'power2.out' });
  } else {
    gsap.to(lineMid, { scaleX: 0.4, duration: 0.3, ease: 'power2.out' });
  }
}
export function menuIconHoverLeave({ lineTop, lineMid, lineBot }, open) {
  if (open) {
    gsap.to(lineTop, { rotate: 45, duration: 0.3, ease: 'power2.out' });
    gsap.to(lineBot, { rotate: -45, duration: 0.3, ease: 'power2.out' });
  } else {
    gsap.to(lineMid, { scaleX: 1, duration: 0.3, ease: 'power2.out' });
  }
}

// ─────────────────────────────────────────────────────────────────────────
// EFECTO 4 — Panel inline (menu-links / filter-chips) abrir/cerrar
// El panel vive dentro de la barra inferior y crece su propio ancho (no es
// un dropdown flotante). Dos partes animadas por separado:
// ┌─────────┬───────────────────┬────────┬───────────────────────────────┐
// │ ABRIR   │ prop              │ dur    │ ease / stagger / delay        │
// ├─────────┼───────────────────┼────────┼───────────────────────────────┤
// │ el      │ width 0 → auto    │ 0.6s   │ power2.out                    │
// │ kids    │ yPercent 800→0,   │ 0.6s   │ back.out(1.7), stagger 0.08,  │
// │         │ opacity 0→1       │        │ delay 0.05                    │
// ├─────────┼───────────────────┼────────┼───────────────────────────────┤
// │ CERRAR  │ kids opacity/y    │ 0.4s   │ back.in(1.7), stagger 0.05     │
// │         │ el width → 0      │ 0.5s   │ power2.out, delay 0.05        │
// └─────────┴───────────────────┴────────┴───────────────────────────────┘
// reduced-motion: todas las duraciones de esta tabla → 0.01s.
// ─────────────────────────────────────────────────────────────────────────
export function inlinePanelOpen(el, kids) {
  const reduced = reduceMotion();
  el.style.display = 'flex';
  el.style.width = 'auto';
  const targetW = el.offsetWidth;
  gsap.fromTo(
    el,
    { width: 0 },
    {
      width: targetW,
      duration: reduced ? 0.01 : 0.6,
      ease: 'power2.out',
      onComplete: () => { el.style.width = 'auto'; },
    },
  );
  gsap.fromTo(
    kids,
    { yPercent: 800, opacity: 0 },
    { yPercent: 0, opacity: 1, duration: reduced ? 0.01 : 0.6, ease: 'back.out(1.7)', stagger: 0.08, delay: 0.05 },
  );
}
export function inlinePanelClose(el, kids) {
  const reduced = reduceMotion();
  gsap.to(kids, { yPercent: 800, opacity: 0, duration: reduced ? 0.01 : 0.4, ease: 'back.in(1.7)', stagger: 0.05 });
  gsap.to(el, {
    width: 0,
    duration: reduced ? 0.01 : 0.5,
    ease: 'power2.out',
    delay: 0.05,
    onComplete: () => { el.style.display = 'none'; },
  });
}

// ─────────────────────────────────────────────────────────────────────────
// EFECTO 5 — Hover de los links dentro del panel inline (colecciones/
// método, 2026-08-09 hand-off §6): se levantan 4px. 0.3s power2.out, ida
// y vuelta.
// ─────────────────────────────────────────────────────────────────────────
export function hoverLift(el) {
  gsap.to(el, { y: -4, duration: 0.3, ease: 'power2.out' });
}
export function hoverUnlift(el) {
  gsap.to(el, { y: 0, duration: 0.3, ease: 'power2.out' });
}

// ─────────────────────────────────────────────────────────────────────────
// EFECTO 6 — Apertura del panel de producto (split-view), PRD-animaciones-
// relieve.md efecto #3. Un solo gsap.timeline() con 4 .fromTo(), posiciones
// explícitas (no encadenadas por defecto):
// ┌─────────┬──────────────────┬───────┬────────┬──────────────────────┐
// │ target  │ prop             │ dur   │ pos.   │ ease                 │
// ├─────────┼──────────────────┼───────┼────────┼──────────────────────┤
// │ letras  │ opacity 0→1,     │ 0.5s  │ 0      │ power2.out,          │
// │ del     │ y 8px→0          │       │        │ stagger 0.03         │
// │ título  │                  │       │        │                      │
// │ foto    │ opacity 0→1      │ 0.5s  │ 0.15   │ relieveEase          │
// │ meta    │ opacity 0→1      │ 0.4s  │ 0.5    │ relieveEase          │
// │ CTA     │ opacity 0→1      │ 0.4s  │ 0.65   │ relieveEase          │
// └─────────┴──────────────────┴───────┴────────┴──────────────────────┘
// relieveEase = CustomEase de cubic-bezier(0.2,0.6,0.2,1) (el --ease del
// artifact). reduced-motion: todas las duraciones → 0.01s, stagger 0, y
// las posiciones (0.15/0.5/0.65) se anulan a 0 también.
// ─────────────────────────────────────────────────────────────────────────
export function panelOpenTimeline({ titleEl, photoEl, metaEl, ctaEl }) {
  const reduced = reduceMotion();
  const d = (s) => (reduced ? 0.01 : s);
  const pos = (p) => (reduced ? 0 : p);
  const letters = titleEl ? [...titleEl.children] : [];

  const tl = gsap.timeline();
  if (letters.length) {
    tl.fromTo(
      letters,
      { opacity: 0, y: 8 },
      { opacity: 1, y: 0, duration: d(0.5), ease: 'power2.out', stagger: reduced ? 0 : 0.03 },
      0,
    );
  }
  if (photoEl) {
    tl.fromTo(photoEl, { opacity: 0 }, { opacity: 1, duration: d(0.5), ease: 'relieveEase' }, pos(0.15));
  }
  if (metaEl) {
    tl.fromTo(metaEl, { opacity: 0 }, { opacity: 1, duration: d(0.4), ease: 'relieveEase' }, pos(0.5));
  }
  if (ctaEl) {
    tl.fromTo(ctaEl, { opacity: 0 }, { opacity: 1, duration: d(0.4), ease: 'relieveEase' }, pos(0.65));
  }
  return tl;
}

// ─────────────────────────────────────────────────────────────────────────
// A PARTIR DE AQUÍ: efectos NO verificados contra el artifact original
// (no se pudo abrir su código fuente — ver informe). Son extrapolaciones
// deliberadas de convenciones YA REALES del repo (mismos valores de easing/
// duración que ya usan otros componentes en src/index.css), no números
// inventados sueltos. Marcados uno por uno.
// ─────────────────────────────────────────────────────────────────────────

// NO VERIFICADO — entrada de las tarjetas en "vista cuadrícula"
// (GalleryCard variant="explorarGrid"). El artifact no pudo inspeccionarse
// para confirmar si esta vista tiene una animación de entrada propia.
// Reutiliza el mismo timing/easing que .flap-row-anim (real, confirmado en
// src/index.css, usado por DeparturesBoard): 350ms, cubic-bezier(0.2,0.6,
// 0.2,1), stagger manual de 60ms por índice — no un valor nuevo inventado.
export function gridCardStagger(el, index) {
  const reduced = reduceMotion();
  gsap.set(el, { opacity: 0, y: 14 });
  gsap.to(el, {
    opacity: 1,
    y: 0,
    duration: reduced ? 0.01 : 0.35,
    ease: 'relieveEase',
    delay: reduced ? 0 : index * 0.06,
  });
}

// NO VERIFICADO — feedback de click en los botones de zoom (+/−). El
// artifact no pudo inspeccionarse para confirmar si el botón da algún
// feedback más allá del `:active` nativo. Un pulso conservador, mismo
// relieveEase real del repo, no un valor nuevo.
export function zoomButtonPulse(el) {
  if (reduceMotion()) return;
  gsap.fromTo(el, { scale: 0.85 }, { scale: 1, duration: 0.3, ease: 'relieveEase' });
}
