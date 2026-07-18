// Sobre-passport rebuild — full redesign of "Sobre Relieve" as an editorial
// passport, approved by Ale (copy is final, not draft). Visual language
// follows 5 reference images she supplied (docs/design-refs/passport/,
// not committed — see her local files): Balenciaga cover (crest-as-seal),
// blank passenger-data watermark page, Clovis Retif ink stamps + country
// visa page, Expedia luggage tags, Annie Atkins scattered-stamp density.
// Colors/type stay inside Relieve's existing system (Fraunces/Courier
// Prime, the 8-color palette) — this is that system's fullest application,
// not a new one. No literal gold/black per docs/ui-ux.md; navy/cream/
// walnut stand in for the references' black-leather-and-gold-foil look.
//
// Second pass — Ale wanted this paged like a real passport / digital
// magazine (one spread at a time, swipe/arrow to turn) instead of one
// long scroll, and everything in Spanish (her brief's English field
// labels were literal spec, not a language choice).
import { useEffect, useRef, useState } from 'react';
import TopoLines from '../components/TopoLines.jsx';
import Stamp from '../components/Stamp.jsx';
import { ABOUT_PROCESO, ABOUT_IMPRESION } from '../lib/photography.js';
import { useDocumentHead } from '../lib/useDocumentHead.js';
import {
  PASSENGER_INFO,
  ABOUT_COPY,
  JOURNEY_STEPS,
  TRAVEL_ESSENTIALS,
  LUGGAGE_STICKERS,
  AUTHORIZED_DESTINATIONS,
  STAMP_PLACES,
} from '../lib/passportContent.js';

const TAG_TONES = ['border-sello-navy', 'border-walnut', 'border-sage', 'border-passport-ink', 'border-stone'];
const SWIPE_THRESHOLD_PX = 50;

function PageKicker({ n, title }) {
  return (
    <p className="font-label uppercase tracking-wide text-[10px] text-graphite/40 mb-6 border-t border-line pt-4">
      {n} — {title}
    </p>
  );
}

function Barcode({ className = '' }) {
  const bars = [2, 1, 3, 1, 1, 2, 4, 1, 2, 1, 3, 2, 1, 1, 4, 2, 1, 3];
  return (
    <div className={`flex items-end gap-[2px] h-9 ${className}`} aria-hidden="true">
      {bars.map((w, i) => (
        <span key={i} style={{ width: `${w}px` }} className="bg-graphite h-full" />
      ))}
    </div>
  );
}

function Crest() {
  return (
    <svg viewBox="0 0 200 200" className="w-28 h-28 text-dark-fg" aria-hidden="true">
      <circle cx="100" cy="100" r="92" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="100" cy="100" r="84" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.6" />
      <path d="M100 55 L120 100 L80 100 Z" fill="none" stroke="currentColor" strokeWidth="1.5" />
      {[112, 128, 144].map((r) => (
        <ellipse key={r} cx="100" cy="108" rx={r * 0.42} ry={r * 0.24} fill="none" stroke="currentColor" strokeWidth="1" opacity={0.5 - r * 0.001} />
      ))}
      {[-1, 1].map((side) => (
        <path
          key={side}
          d={`M100 130 C ${100 + side * 30} 140, ${100 + side * 40} 120, ${100 + side * 55} 95`}
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
        />
      ))}
    </svg>
  );
}

function LuggageTag({ title, body, tone, rotate }) {
  return (
    <div className={`boarding-pass-edge bg-gallery-white border border-line rounded-[4px] py-4 pr-4 ${rotate}`}>
      <div className={`border-l-4 pl-5 ${tone}`}>
        <Barcode className="mb-3 opacity-70" />
        <p className="font-label uppercase tracking-wide text-sm font-bold mb-1">{title}</p>
        <p className="text-xs leading-relaxed text-graphite/80">{body}</p>
      </div>
    </div>
  );
}

function CoverPage() {
  return (
    <section className="relative bg-sello-navy text-dark-fg aspect-[3/4] sm:aspect-[16/9] flex flex-col items-center justify-center gap-6">
      <TopoLines className="absolute inset-0 w-full h-full opacity-10" />
      <Crest />
      <div className="text-center">
        <h1 className="font-display font-light text-4xl sm:text-5xl tracking-wide">RELIEVE</h1>
        <p className="font-label uppercase tracking-wide text-xs opacity-70 mt-3">
          Viaja a través de lugares que importan.
        </p>
      </div>
    </section>
  );
}

function PassengerInfoPage() {
  return (
    <section>
      <div className="flex items-start justify-between mb-6">
        <PageKicker n="01" title="Información del Pasajero" />
        <Barcode />
      </div>
      <dl className="grid sm:grid-cols-2 gap-x-10 gap-y-4">
        {PASSENGER_INFO.map(([label, value]) => (
          <div key={label} className="border-b border-line pb-2 flex justify-between gap-4">
            <dt className="font-label uppercase tracking-wide text-[10px] text-graphite/50">{label}</dt>
            <dd className="font-label text-xs text-right">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function AboutRelievePage() {
  return (
    <section>
      <PageKicker n="02" title="Sobre Relieve" />
      <div className="max-w-[65ch] space-y-4 leading-relaxed">
        {ABOUT_COPY.split('\n\n').map((para, i) => (
          <p key={i} className={i === 0 ? 'font-display text-xl font-light' : ''}>
            {para}
          </p>
        ))}
      </div>
    </section>
  );
}

function JourneyPage() {
  return (
    <section>
      <PageKicker n="03" title="Itinerario" />
      <div className="grid sm:grid-cols-2 gap-12 items-start">
        <ol className="space-y-0">
          {JOURNEY_STEPS.map((step) => (
            <li key={step.label} className="relative pl-8 pb-8 last:pb-0 border-l border-line ml-1 last:border-transparent">
              <span className="absolute -left-[5px] top-1 w-[9px] h-[9px] rounded-full bg-passport-ink" />
              <p className="font-label uppercase tracking-wide text-[10px] text-graphite/50">{step.label}</p>
              <p className="font-display text-lg">{step.detail}</p>
            </li>
          ))}
        </ol>
        <div className="space-y-4">
          <div className="relative aspect-video rounded-[9px] overflow-hidden">
            <img src={ABOUT_IMPRESION} alt="Impresión 3D del relieve en proceso" className="warm-photo absolute inset-0 w-full h-full object-cover" />
          </div>
          <div className="relative aspect-video rounded-[9px] overflow-hidden">
            <img src={ABOUT_PROCESO} alt="Ensamblado a mano del marco de nogal" className="warm-photo absolute inset-0 w-full h-full object-cover" />
          </div>
        </div>
      </div>
    </section>
  );
}

function EssentialsPage() {
  return (
    <section>
      <PageKicker n="04" title="Esenciales de Viaje" />
      <ul className="flex flex-wrap gap-x-3 gap-y-2 font-label uppercase tracking-wide text-xs">
        {TRAVEL_ESSENTIALS.map((item, i) => (
          <li key={item} className="flex items-center gap-3">
            {item}
            {i < TRAVEL_ESSENTIALS.length - 1 && <span className="text-graphite/30">·</span>}
          </li>
        ))}
      </ul>
    </section>
  );
}

function LuggagePage() {
  return (
    <section>
      <PageKicker n="05" title="Etiquetas de Equipaje" />
      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-10">
        {LUGGAGE_STICKERS.map((tag, i) => (
          <LuggageTag
            key={tag.title}
            title={tag.title}
            body={tag.body}
            tone={TAG_TONES[i % TAG_TONES.length]}
            rotate={i % 2 === 0 ? '-rotate-2' : 'rotate-2'}
          />
        ))}
      </div>
    </section>
  );
}

function VisaPage() {
  return (
    <section>
      <PageKicker n="06" title="Visa" />
      <h2 className="font-label uppercase tracking-wide text-sm mb-4">Destinos Autorizados</h2>
      <ul className="grid sm:grid-cols-2 gap-x-10 gap-y-2 font-label text-xs mb-16">
        {AUTHORIZED_DESTINATIONS.map((d) => (
          <li key={d} className="flex items-center gap-2">
            <span className="text-passport-ink">✓</span> {d}
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap gap-6 justify-center">
        {STAMP_PLACES.map((stamp) => (
          <Stamp key={stamp.label} label={stamp.label} shape={stamp.shape} tone={stamp.tone} rotate={stamp.rotate} />
        ))}
      </div>
    </section>
  );
}

const PAGES = [CoverPage, PassengerInfoPage, AboutRelievePage, JourneyPage, EssentialsPage, LuggagePage, VisaPage];
const PAGE_LABELS = ['Portada', 'Información del Pasajero', 'Sobre Relieve', 'Itinerario', 'Esenciales de Viaje', 'Etiquetas de Equipaje', 'Visa'];

function usePageSwipe(onSwipeLeft, onSwipeRight) {
  const startRef = useRef(null);
  return {
    onPointerDown(e) {
      startRef.current = { x: e.clientX, y: e.clientY };
    },
    onPointerUp(e) {
      if (!startRef.current) return;
      const dx = e.clientX - startRef.current.x;
      const dy = e.clientY - startRef.current.y;
      startRef.current = null;
      if (Math.abs(dx) > SWIPE_THRESHOLD_PX && Math.abs(dx) > Math.abs(dy)) {
        if (dx < 0) onSwipeLeft();
        else onSwipeRight();
      }
    },
    style: { touchAction: 'pan-y' },
  };
}

export default function About() {
  useDocumentHead({
    title: 'Sobre Relieve — Mapas en relieve hechos a mano',
    description: 'Relieve transforma lugares en objetos que cuentan historias: mapas topográficos y urbanos en relieve, de datos geoespaciales reales a marco de nogal hecho a mano.',
    canonicalPath: '/sobre',
  });

  const [index, setIndex] = useState(0);
  const [dir, setDir] = useState(1);

  function go(delta) {
    setDir(delta);
    setIndex((i) => Math.min(PAGES.length - 1, Math.max(0, i + delta)));
  }

  function goTo(i) {
    setDir(i > index ? 1 : -1);
    setIndex(i);
  }

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const swipe = usePageSwipe(() => go(1), () => go(-1));
  const Page = PAGES[index];
  const isCover = index === 0;

  return (
    <main className="mx-auto max-w-5xl p-4 sm:p-8" {...swipe}>
      <div
        key={index}
        className={`passport-page-enter relative rounded-[9px] shadow-lg overflow-hidden ${
          isCover ? '' : 'security-pattern border border-line p-6 sm:p-10'
        }`}
        style={{ '--slide-from': dir > 0 ? '24px' : '-24px' }}
      >
        {!isCover && (
          <>
            <TopoLines className="absolute inset-0 w-full h-full text-stone opacity-20 pointer-events-none" />
            <span className="hidden sm:block absolute inset-y-6 left-1/2 w-px bg-line" aria-hidden="true" />
          </>
        )}
        <div className="relative">
          <Page />
        </div>
      </div>

      <nav className="flex items-center justify-between mt-10 font-label uppercase tracking-wide text-xs">
        <button
          type="button"
          onClick={() => go(-1)}
          disabled={index === 0}
          className="disabled:opacity-30 hover:text-passport-ink transition-colors"
        >
          ‹ Anterior
        </button>
        <div className="flex items-center gap-2">
          {PAGES.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Ir a ${PAGE_LABELS[i]}`}
              aria-current={i === index}
              className={`w-1.5 h-1.5 rounded-full transition-colors ${i === index ? 'bg-passport-ink' : 'bg-line'}`}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={() => go(1)}
          disabled={index === PAGES.length - 1}
          className="disabled:opacity-30 hover:text-passport-ink transition-colors"
        >
          Siguiente ›
        </button>
      </nav>
    </main>
  );
}
