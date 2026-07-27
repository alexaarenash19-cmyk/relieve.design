// Reusable fullscreen page-wipe transition (PRD "Relieve: Fix de carga +
// paridad de efectos con Palmer", sección 2.3) — a cream/bone sweep that
// covers the screen, lets the caller swap what's mounted behind it, then
// continues off the other edge. Phase sequencing lives in lib/pageWipe.js
// so it's testable without mocking timers; this file only owns the DOM
// node and the setTimeout choreography.
//
// Explorar spec §9 adds a second variant — a vertical-columns wipe used
// specifically for product-focus -> /pieza/:slug and between collection
// views on /colecciones. Same phase shape (lib/pageWipeColumns.js re-
// exports PHASES/nextPhase from pageWipe.js), same choreography below;
// only which overlay DOM renders differs. `wipe(onCovered)` with no
// options keeps behaving exactly as before everywhere else in the app.
import { createContext, useContext, useState, useCallback } from 'react';
import { TRANSLATE_Y } from '../lib/pageWipe.js';
import { columnsForWidth, columnDelayMs } from '../lib/pageWipeColumns.js';

const PageWipeContext = createContext(null);

// These must match the overlay div's CSS transition duration below (300ms)
// exactly — a mismatch here means onCovered/idle fire before or after the
// animation has actually finished, which is what caused the zoom-in bug
// (see the transition-class fix below for the other half of that bug).
const COVER_MS = 300;
const HOLD_MS = 80;
const UNCOVER_MS = 300;

export function PageWipeProvider({ children }) {
  const [phase, setPhase] = useState('idle');
  const [variant, setVariant] = useState('sweep');
  const [columns, setColumns] = useState(() =>
    typeof window !== 'undefined' ? columnsForWidth(window.innerWidth) : 6,
  );

  // wipe(onCovered, { variant }): covers the screen, calls onCovered once
  // fully covered (this is where the caller swaps what's mounted — e.g.
  // hero -> canvas, or product-focus -> /pieza/:slug), then uncovers.
  // onCovered is NOT called until the cover animation has visually
  // finished, so the swap never flashes mid-transition.
  const wipe = useCallback((onCovered, { variant: v = 'sweep' } = {}) => {
    // Explorar spec §10 — reduced motion drops the columns effect entirely
    // (no stagger to simplify) rather than trying to tone it down; the
    // plain single-sweep overlay already has no lerp/stagger of its own.
    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const effectiveVariant = reduced ? 'sweep' : v;
    setVariant(effectiveVariant);
    if (effectiveVariant === 'columns' && typeof window !== 'undefined') {
      setColumns(columnsForWidth(window.innerWidth));
    }
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

  const totalMs = COVER_MS + HOLD_MS + UNCOVER_MS;

  return (
    <PageWipeContext.Provider value={{ wipe }}>
      {children}
      {variant === 'sweep' ? (
        <div
          aria-hidden="true"
          // idle sits at the opposite off-screen edge from uncovering
          // (100% vs -100%) — animating that reset would sweep the overlay
          // back across the whole screen as an unintended second cover,
          // right on top of whatever just got revealed (this is what was
          // masking the canvas zoom-in). idle must snap, not transition.
          className={`fixed inset-0 z-[200] bg-gallery-white pointer-events-none ${
            phase === 'idle'
              ? ''
              : 'transition-transform duration-300 ease-in-out'
          }`}
          style={{ transform: `translateY(${TRANSLATE_Y[phase]})` }}
        />
      ) : (
        <div
          aria-hidden="true"
          className="fixed inset-0 z-[200] pointer-events-none flex flex-row"
        >
          {Array.from({ length: columns }).map((_, i) => (
            <div
              key={i}
              className={`page-wipe-column bg-gallery-white flex-1 ${
                phase === 'idle'
                  ? ''
                  : 'transition-transform ease-in-out'
              }`}
              style={{
                transform: `translate3d(0, ${TRANSLATE_Y[phase]}, 0)`,
                transitionDuration:
                  phase === 'uncovering' ? `${UNCOVER_MS}ms` : `${COVER_MS}ms`,
                transitionDelay:
                  phase === 'covering'
                    ? `${columnDelayMs(i, columns, COVER_MS)}ms`
                    : phase === 'uncovering'
                      ? `${columnDelayMs(columns - 1 - i, columns, UNCOVER_MS)}ms`
                      : '0ms',
              }}
            />
          ))}
        </div>
      )}
    </PageWipeContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components -- hook belongs next to its provider
export function usePageWipe() {
  const ctx = useContext(PageWipeContext);
  if (!ctx) throw new Error('usePageWipe must be used within PageWipeProvider');
  return ctx;
}
