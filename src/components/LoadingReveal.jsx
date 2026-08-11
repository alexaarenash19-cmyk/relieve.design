// 2026-08-09 landing rebrand hand-off §3 — loading screen. Plays once per
// browser session (sessionStorage — resets on a new tab, the conservative
// choice), on whatever route the visitor first lands on, not just '/'. No
// 0%→100% counter: purely visual, done in under ~1.5s so it reads as "the
// site opening", not a wait.
//
// Effect: the existing single wordmark.svg (RELIEVE stacked over DESIGN —
// exploration confirmed it's one fused compound path, not two separate
// files) is rendered twice, each copy clipped to its own half via
// clip-path. The two halves pull apart (GSAP), and a real catalog photo
// sits behind them, masked to the wordmark's own letterform silhouette
// (mask-mode: alpha — the SVG's opaque ink = visible photo, transparent
// background = hidden) so the photo only shows inside the parting gap,
// Monolith-style. Ale's own separately-exported split PNGs
// ("releive solo.svg" / "desifgn solo.svg") were the originally-planned
// asset for this, but those live only in her local Downloads folder and
// were never committed to the repo — this clip-path approach reproduces
// the same visual beat from assets already in the codebase, no new asset
// needed. Revisit with the real split art if/when she sends it committed.
//
// After the halves finish separating, the whole overlay fades out and
// unmounts — it does NOT replace or skip Home's own hero (Hero.jsx, see
// its history note re: apple-design audit 11 ago 2026); that flow
// proceeds completely unchanged underneath. The wordmark halves becoming
// permanent canvas
// top/bottom borders (rest of §3, all of §4) is handled separately by
// TrustBar.jsx (top, Home-only) and CanvasBottomStrip.jsx (bottom,
// Home-only) — kept as their own always-on chrome rather than this
// one-shot component, since the strips need to persist long after this
// reveal has unmounted.
import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import wordmark from '../assets/brand/wordmark.svg';
import { pieceMainThumb } from '../lib/photography.js';
import { alreadySeen, markSeen, pickRevealSlug } from '../lib/loadingReveal.js';

function getSessionStorage() {
  try {
    return typeof window !== 'undefined' ? window.sessionStorage : undefined;
  } catch {
    return undefined; // storage disabled (e.g. private mode) — treated as first visit
  }
}

export default function LoadingReveal() {
  const [visible, setVisible] = useState(() => !alreadySeen(getSessionStorage()));
  const rootRef = useRef(null);
  const topRef = useRef(null);
  const bottomRef = useRef(null);
  const photoRef = useRef(null);

  const photoSlug = useRef(pickRevealSlug()).current;
  const photoUrl = pieceMainThumb(photoSlug);

  useEffect(() => {
    if (!visible) return;
    markSeen(getSessionStorage());

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      // No parting/mask animation — just a quick fade of the whole overlay,
      // same "respect prefers-reduced-motion" precedent as Home.jsx/Nav.jsx.
      gsap.to(rootRef.current, {
        opacity: 0,
        duration: 0.4,
        delay: 0.3,
        onComplete: () => setVisible(false),
      });
      return;
    }

    const tl = gsap.timeline({
      onComplete: () => setVisible(false),
    });
    tl.set([topRef.current, bottomRef.current], { yPercent: 0 })
      .to(photoRef.current, { opacity: 1, duration: 0.3, ease: 'power1.out' }, 0.1)
      .to(
        topRef.current,
        { yPercent: -12, duration: 0.6, ease: 'power2.inOut' },
        0.15,
      )
      .to(
        bottomRef.current,
        { yPercent: 12, duration: 0.6, ease: 'power2.inOut' },
        0.15,
      )
      .to(rootRef.current, { opacity: 0, duration: 0.35, ease: 'power1.in' }, '+=0.25');
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      className="fixed inset-0 z-[300] bg-piedra pointer-events-none flex items-center justify-center overflow-hidden"
    >
      <div className="relative w-[min(70vw,480px)] aspect-[524/331]">
        {photoUrl && (
          <img
            ref={photoRef}
            src={photoUrl}
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-0"
            style={{
              maskImage: `url(${wordmark})`,
              maskMode: 'alpha',
              maskRepeat: 'no-repeat',
              maskSize: 'contain',
              maskPosition: 'center',
              WebkitMaskImage: `url(${wordmark})`,
              WebkitMaskRepeat: 'no-repeat',
              WebkitMaskSize: 'contain',
              WebkitMaskPosition: 'center',
            }}
          />
        )}
        <img
          ref={topRef}
          src={wordmark}
          alt=""
          className="absolute inset-0 w-full h-full object-contain"
          style={{ clipPath: 'inset(0 0 50% 0)' }}
        />
        <img
          ref={bottomRef}
          src={wordmark}
          alt=""
          className="absolute inset-0 w-full h-full object-contain"
          style={{ clipPath: 'inset(50% 0 0 0)' }}
        />
      </div>
    </div>
  );
}
