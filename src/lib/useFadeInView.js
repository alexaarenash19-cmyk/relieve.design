// Issue #47 — simple fade-in-on-scroll-into-view, no pin/scrub/choreography.
//
// Hallazgo (verificado en vivo con el preview combinado, 13 ago 2026): en
// carga fresca, si el elemento YA está en el viewport al montar (el caso
// de Hero.jsx — siempre es lo primero que se ve), el primer callback
// asíncrono de IntersectionObserver puede tardar varios segundos en
// dispararse. Mientras tanto `visible` se queda en `false`, así que el
// contenido queda invisible (opacity:0) ese rato — en modo claro se
// confunde con "sigue cargando" (se pierde contra el fondo crema), en modo
// oscuro se ve como pantalla negra sólida. No es un bug de dark mode ni de
// ninguna de las ramas recientes — ya estaba así. `isInViewport` resuelve
// esto de forma síncrona al montar, con el mismo umbral de 30% que ya usa
// el observer, así que no hay que esperar ese primer callback cuando el
// elemento ya es visible. El resto del comportamiento (fade in/out real al
// hacer scroll) no cambia — el observer se sigue montando igual.
import { useEffect, useRef, useState } from 'react';

function isInViewport(el) {
  if (!el) return false;
  const rect = el.getBoundingClientRect();
  const vh = window.innerHeight || document.documentElement.clientHeight;
  const visibleHeight = Math.min(rect.bottom, vh) - Math.max(rect.top, 0);
  return visibleHeight > 0 && visibleHeight / rect.height >= 0.3;
}

export function useFadeInView() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (isInViewport(el)) setVisible(true);
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), {
      threshold: 0.3,
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return [ref, visible];
}
