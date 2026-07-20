// Reusable fullscreen page-wipe transition (PRD "Relieve: Fix de carga +
// paridad de efectos con Palmer", sección 2.3) — a cream/bone sweep that
// covers the screen, lets the caller swap what's mounted behind it, then
// continues off the other edge. Phase sequencing lives in lib/pageWipe.js
// so it's testable without mocking timers; this file only owns the DOM
// node and the setTimeout choreography.
import { createContext, useContext, useState, useCallback } from 'react';
import { TRANSLATE_Y } from '../lib/pageWipe.js';

const PageWipeContext = createContext(null);

const COVER_MS = 350;
const HOLD_MS = 80;
const UNCOVER_MS = 350;

export function PageWipeProvider({ children }) {
  const [phase, setPhase] = useState('idle');

  // wipe(onCovered): covers the screen, calls onCovered once fully covered
  // (this is where the caller swaps what's mounted — e.g. hero -> canvas),
  // then uncovers. onCovered is NOT called until the cover animation has
  // visually finished, so the swap never flashes mid-transition.
  const wipe = useCallback((onCovered) => {
    setPhase('covering');
    setTimeout(() => {
      onCovered();
      setPhase('covered');
      setTimeout(() => {
        setPhase('uncovering');
        setTimeout(() => setPhase('idle'), UNCOVER_MS);
      }, HOLD_MS);
    }, COVER_MS);
  }, []);

  return (
    <PageWipeContext.Provider value={{ wipe }}>
      {children}
      <div
        aria-hidden="true"
        className="fixed inset-0 z-[200] bg-gallery-white pointer-events-none transition-transform duration-300 ease-in-out"
        style={{ transform: `translateY(${TRANSLATE_Y[phase]})` }}
      />
    </PageWipeContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components -- hook belongs next to its provider
export function usePageWipe() {
  const ctx = useContext(PageWipeContext);
  if (!ctx) throw new Error('usePageWipe must be used within PageWipeProvider');
  return ctx;
}
