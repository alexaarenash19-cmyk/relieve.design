// Museográfico pass (11 ago 2026) — FluidMenu.jsx needs to close on an
// outside click; no click-outside pattern existed anywhere in the repo yet
// (confirmed via search). Same one-hook-one-job shape as useEscapeKey.js.
import { useEffect } from 'react';

export function useClickOutside(ref, onOutside) {
  useEffect(() => {
    function onPointerDown(e) {
      if (ref.current && !ref.current.contains(e.target)) onOutside();
    }
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [ref, onOutside]);
}
