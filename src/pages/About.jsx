// Sobre-passport rebuild — full redesign of "Sobre Relieve" as an editorial
// passport, approved by Ale (copy is final, not draft). Visual language
// follows reference images she supplied (docs/design-refs/passport/, not
// committed — see her local files): Balenciaga cover (crest-as-seal), blank
// passenger-data watermark page, Clovis Retif ink stamps + country visa
// page, Expedia luggage tags, Annie Atkins scattered-stamp density. Colors/
// type stay inside Relieve's existing system (Fraunces/Courier Prime, the
// 8-color palette) — no literal gold/black per docs/ui-ux.md.
//
// Third pass — non-negotiable physical-object rules from Ale:
//  1. Fixed passport proportions (~3:4.2, portrait, booklet) on every page;
//     content adapts to the frame, the frame never grows to content.
//  2. Real page-flip (curl + shadow), not a fade/slide — uses react-pageflip
//     (StPageFlip) instead of hand-rolling a flip animation.
//  3. Looks like a physical object resting on a neutral surface: ambient
//     shadow under the whole book, leather grain on the cover, paper grain
//     on interior pages (not flat vector).
//  4. Stickers/stamps each read as physically stuck on: their own drop
//     shadow, individual rotation, varied shapes/ink texture.
import { useRef, useState, forwardRef } from 'react';
import HTMLFlipBook from 'react-pageflip';
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

const TONE_HEX = {
  navy: '#22405c',
  ink: '#355a75',
  walnut: '#7a5a43',
  sage: '#aeb99e',
};
const TAG_TONES = ['navy', 'walnut', 'ink', 'walnut', 'navy'];
const BOOK_WIDTH = 480;
const BOOK_HEIGHT = 672; // 3:4.2 ratio, matches Ale's spec exactly — sized up so page content fits without scrolling

function PageKicker({ n, title }) {
  return (
    <p className="font-label uppercase tracking-wide text-[9px] text-graphite/40 mb-3 border-t border-line pt-3">
      {n} — {title}
    </p>
  );
}

function Barcode({ className = '' }) {
  const bars = [2, 1, 3, 1, 1, 2, 4, 1, 2, 1, 3, 2, 1, 1, 4, 2, 1, 3];
  return (
    <div
      className={`flex items-end gap-[1.5px] h-6 ${className}`}
      aria-hidden="true"
    >
      {bars.map((w, i) => (
        <span
          key={i}
          style={{ width: `${w}px` }}
          className="bg-graphite h-full"
        />
      ))}
    </div>
  );
}

function Crest() {
  return (
    <svg
      viewBox="0 0 200 200"
      className="w-24 h-24 text-dark-fg"
      aria-hidden="true"
    >
      <circle
        cx="100"
        cy="100"
        r="92"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <circle
        cx="100"
        cy="100"
        r="84"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.6"
      />
      <path
        d="M100 55 L120 100 L80 100 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      {[112, 128, 144].map((r) => (
        <ellipse
          key={r}
          cx="100"
          cy="108"
          rx={r * 0.42}
          ry={r * 0.24}
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          opacity={0.5 - r * 0.001}
        />
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

// Real luggage-tag shape (rounded rect + string hole), not the airline-stub
// shape from the Expedia reference — Ale asked for the classic tag shape
// specifically. Own drop-shadow + rotation so it reads as physically
// attached to the page, not printed flat.
function PassportTag({ title, body, tone, rotate }) {
  const hex = TONE_HEX[tone] ?? TONE_HEX.navy;
  return (
    <div
      className={`paper-texture relative w-full aspect-[220/96] ${rotate}`}
      style={{ filter: 'drop-shadow(2px 4px 4px rgba(35,35,35,0.2))' }}
    >
      <svg
        viewBox="0 0 220 96"
        className="absolute inset-0 w-full h-full"
        aria-hidden="true"
      >
        <rect
          x="3"
          y="3"
          width="214"
          height="90"
          rx="12"
          fill="#F6F3ED"
          stroke="#E4DED3"
          strokeWidth="1.5"
        />
        <path
          d="M28,22 Q20,10 36,10 Q52,10 44,22"
          fill="none"
          stroke={hex}
          strokeWidth="2"
          opacity="0.5"
        />
        <circle
          cx="36"
          cy="24"
          r="7"
          fill="none"
          stroke={hex}
          strokeWidth="2.5"
        />
      </svg>
      <div className="relative h-full pl-14 pr-4 py-3 flex flex-col justify-center">
        <Barcode className="mb-1.5 opacity-70" />
        <p
          className="font-label uppercase tracking-wide text-[9px] font-bold"
          style={{ color: hex }}
        >
          TO · {title}
        </p>
        <p className="text-[9px] leading-snug text-graphite/80 mt-0.5">
          {body}
        </p>
      </div>
    </div>
  );
}

function BoardingPass() {
  return (
    <div
      className="paper-texture relative flex bg-gallery-white border border-line rounded-[4px] rotate-1 text-[8px] font-label uppercase tracking-wide"
      style={{ filter: 'drop-shadow(2px 4px 4px rgba(35,35,35,0.18))' }}
    >
      <div className="flex-1 p-2.5 space-y-1.5">
        <p className="text-graphite/40">Pasajero</p>
        <p className="text-[10px]">Relieve</p>
        <div className="flex justify-between pt-1">
          <div>
            <p className="text-graphite/40">De</p>
            <p>CDMX</p>
          </div>
          <div>
            <p className="text-graphite/40">A</p>
            <p>Tu Casa</p>
          </div>
        </div>
      </div>
      <div className="boarding-pass-edge w-12 flex flex-col items-center justify-center gap-1 border-l border-dashed border-line p-2">
        <p className="text-graphite/40">Asiento</p>
        <p>3D</p>
      </div>
    </div>
  );
}

const CoverLeaf = forwardRef(function CoverLeaf(_, ref) {
  return (
    <div
      ref={ref}
      className="leather-texture relative w-full h-full bg-sello-navy text-dark-fg flex flex-col items-center justify-center gap-5 overflow-hidden"
    >
      <TopoLines className="absolute inset-0 w-full h-full opacity-10" />
      <Crest />
      <div className="relative text-center px-6">
        <h1 className="font-display font-light text-4xl tracking-wide">
          RELIEVE
        </h1>
        <p className="font-label uppercase tracking-wide text-[10px] opacity-70 mt-2">
          Viaja a través de lugares que importan.
        </p>
      </div>
    </div>
  );
});

const ContentLeaf = forwardRef(function ContentLeaf({ children }, ref) {
  return (
    <div
      ref={ref}
      className="paper-texture security-pattern relative w-full h-full overflow-hidden"
    >
      <TopoLines className="absolute inset-0 w-full h-full text-stone opacity-20 pointer-events-none" />
      <div className="relative w-full h-full overflow-y-auto px-4 py-4">
        {children}
      </div>
    </div>
  );
});

function PassengerInfoBody() {
  return (
    <>
      <div className="flex items-start justify-between mb-3">
        <PageKicker n="01" title="Información del Pasajero" />
        <Barcode />
      </div>
      <dl className="space-y-2.5">
        {PASSENGER_INFO.map(([label, value]) => (
          <div key={label} className="border-b border-line pb-1.5">
            <dt className="font-label uppercase tracking-wide text-[8px] text-graphite/50">
              {label}
            </dt>
            <dd className="font-label text-[10px] mt-0.5">{value}</dd>
          </div>
        ))}
      </dl>
    </>
  );
}

function AboutRelievePageBody() {
  return (
    <>
      <PageKicker n="02" title="Sobre Relieve" />
      <div className="space-y-2.5 text-[11px] leading-relaxed">
        {ABOUT_COPY.split('\n\n').map((para, i) => (
          <p
            key={i}
            className={
              i === 0 ? 'font-display text-sm font-light leading-snug' : ''
            }
          >
            {para}
          </p>
        ))}
      </div>
    </>
  );
}

function JourneyPageBody() {
  return (
    <>
      <PageKicker n="03" title="Itinerario" />
      <ol className="space-y-2 mb-4">
        {JOURNEY_STEPS.map((step) => (
          <li key={step.label} className="relative pl-4 border-l border-line">
            <span className="absolute -left-[3.5px] top-1 w-[7px] h-[7px] rounded-full bg-passport-ink" />
            <p className="font-label uppercase tracking-wide text-[8px] text-graphite/50">
              {step.label}
            </p>
            <p className="font-display text-sm">{step.detail}</p>
          </li>
        ))}
      </ol>
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="relative aspect-square rounded-[6px] overflow-hidden">
          <img
            src={ABOUT_IMPRESION}
            alt="Impresión 3D del relieve en proceso"
            className="warm-photo absolute inset-0 w-full h-full object-cover"
          />
        </div>
        <div className="relative aspect-square rounded-[6px] overflow-hidden">
          <img
            src={ABOUT_PROCESO}
            alt="Ensamblado a mano del marco de nogal"
            className="warm-photo absolute inset-0 w-full h-full object-cover"
          />
        </div>
      </div>
      <BoardingPass />
    </>
  );
}

function EssentialsPageBody() {
  return (
    <>
      <PageKicker n="04" title="Esenciales de Viaje" />
      <ul className="space-y-2 font-label uppercase tracking-wide text-[10px]">
        {TRAVEL_ESSENTIALS.map((item) => (
          <li key={item} className="border-b border-line pb-2">
            {item}
          </li>
        ))}
      </ul>
    </>
  );
}

function LuggagePageBody() {
  return (
    <>
      <PageKicker n="05" title="Etiquetas de Equipaje" />
      <div className="space-y-4">
        {LUGGAGE_STICKERS.map((tag, i) => (
          <PassportTag
            key={tag.title}
            title={tag.title}
            body={tag.body}
            tone={TAG_TONES[i % TAG_TONES.length]}
            rotate={i % 2 === 0 ? '-rotate-1' : 'rotate-1'}
          />
        ))}
      </div>
    </>
  );
}

function VisaPageBody() {
  return (
    <>
      <PageKicker n="06" title="Visa" />
      <h2 className="font-label uppercase tracking-wide text-[10px] mb-2">
        Destinos Autorizados
      </h2>
      <ul className="space-y-1 font-label text-[10px] mb-4">
        {AUTHORIZED_DESTINATIONS.map((d) => (
          <li key={d} className="flex items-center gap-2">
            <span className="text-passport-ink">✓</span> {d}
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap gap-4 justify-center pb-2">
        {STAMP_PLACES.map((stamp) => (
          <Stamp
            key={stamp.label}
            label={stamp.label}
            shape={stamp.shape}
            tone={stamp.tone}
            rotate={stamp.rotate}
            className="scale-[0.8]"
          />
        ))}
      </div>
    </>
  );
}

const PAGE_COUNT = 7;
const PAGE_LABELS = [
  'Portada',
  'Información del Pasajero',
  'Sobre Relieve',
  'Itinerario',
  'Esenciales de Viaje',
  'Etiquetas de Equipaje',
  'Visa',
];

export default function About() {
  useDocumentHead({
    title: 'Sobre Relieve — Mapas en relieve hechos a mano',
    description:
      'Relieve transforma lugares en objetos que cuentan historias: mapas topográficos y urbanos en relieve, de datos geoespaciales reales a marco de nogal hecho a mano.',
    canonicalPath: '/sobre',
  });

  const flipRef = useRef(null);
  const [index, setIndex] = useState(0);

  function goTo(i) {
    flipRef.current?.pageFlip()?.flip(i);
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 flex flex-col items-center">
      <div className="passport-shell">
        <HTMLFlipBook
          width={BOOK_WIDTH}
          height={BOOK_HEIGHT}
          size="stretch"
          minWidth={364}
          maxWidth={588}
          minHeight={510}
          maxHeight={824}
          showCover={false}
          drawShadow
          maxShadowOpacity={0.35}
          flippingTime={650}
          usePortrait
          className="passport-flipbook"
          ref={flipRef}
          onFlip={(e) => setIndex(e.data)}
        >
          <CoverLeaf />
          <ContentLeaf>
            <PassengerInfoBody />
          </ContentLeaf>
          <ContentLeaf>
            <AboutRelievePageBody />
          </ContentLeaf>
          <ContentLeaf>
            <JourneyPageBody />
          </ContentLeaf>
          <ContentLeaf>
            <EssentialsPageBody />
          </ContentLeaf>
          <ContentLeaf>
            <LuggagePageBody />
          </ContentLeaf>
          <ContentLeaf>
            <VisaPageBody />
          </ContentLeaf>
        </HTMLFlipBook>
      </div>

      <nav
        className="flex items-center justify-between w-full mt-8 font-label uppercase tracking-wide text-xs"
        style={{ maxWidth: BOOK_WIDTH }}
      >
        <button
          type="button"
          onClick={() => flipRef.current?.pageFlip()?.flipPrev()}
          disabled={index === 0}
          className="disabled:opacity-30 hover:text-passport-ink transition-colors"
        >
          ‹ Anterior
        </button>
        <div className="flex items-center gap-2">
          {Array.from({ length: PAGE_COUNT }).map((_, i) => (
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
          onClick={() => flipRef.current?.pageFlip()?.flipNext()}
          disabled={index === PAGE_COUNT - 1}
          className="disabled:opacity-30 hover:text-passport-ink transition-colors"
        >
          Siguiente ›
        </button>
      </nav>
    </main>
  );
}
