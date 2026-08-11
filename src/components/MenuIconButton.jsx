// Museográfico pass (11 ago 2026) — extracted verbatim from Gallery.jsx's
// local `MenuButton` (the canvas's own bottom-bar menu toggle) so Nav.jsx's
// new "Índice" trigger can reuse the exact same square→circle/X icon-morph
// language instead of inventing a second, visually different menu icon.
// Gallery.jsx now imports this component too (see its own updated
// `MenuButton` call site) — this file is the single source of truth for
// the icon geometry/timeline, `label` is the only thing that varies
// between call sites ("menu" on the canvas, "índice" in Nav).
import { useEffect, useRef } from 'react';
import {
  menuIconMorphTimeline,
  menuIconHoverEnter,
  menuIconHoverLeave,
} from '../lib/animations.js';

const MOBILE_BREAKPOINT = 640;

export default function MenuIconButton({ open, onToggle, label = 'menu', className = '' }) {
  const btnRef = useRef(null);
  const boxRef = useRef(null);
  const lineTopRef = useRef(null);
  const lineMidRef = useRef(null);
  const lineBotRef = useRef(null);
  const labelRef = useRef(null);
  const tlRef = useRef(null);

  useEffect(() => {
    const tl = menuIconMorphTimeline(
      {
        btn: btnRef.current,
        box: boxRef.current,
        lineTop: lineTopRef.current,
        lineMid: lineMidRef.current,
        lineBot: lineBotRef.current,
        label: labelRef.current,
      },
      { mobile: window.innerWidth < MOBILE_BREAKPOINT },
    );
    tlRef.current = tl;
    return () => tl.kill();
  }, []);

  useEffect(() => {
    tlRef.current?.[open ? 'play' : 'reverse']();
  }, [open]);

  const lineRefs = {
    lineTop: lineTopRef.current,
    lineMid: lineMidRef.current,
    lineBot: lineBotRef.current,
  };
  function onEnter() {
    menuIconHoverEnter(lineRefs, open);
  }
  function onLeave() {
    menuIconHoverLeave(lineRefs, open);
  }

  return (
    <button
      ref={btnRef}
      onClick={onToggle}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      aria-label={open ? 'Cerrar' : 'Abrir menú'}
      aria-expanded={open}
      className={`pill-glass rounded-full text-brand-dark pl-[10px] pr-4 py-2 font-label uppercase tracking-wide text-xs inline-flex items-center gap-2 overflow-hidden ${className}`}
    >
      <span ref={boxRef} className="explorar-menu-icon-box">
        <span ref={lineTopRef} className="explorar-menu-line explorar-line-top" />
        <span ref={lineMidRef} className="explorar-menu-line" />
        <span ref={lineBotRef} className="explorar-menu-line explorar-line-bot" />
      </span>
      <span className="explorar-menu-label-clip">
        <span ref={labelRef} className="explorar-menu-label">{label}</span>
      </span>
    </button>
  );
}
