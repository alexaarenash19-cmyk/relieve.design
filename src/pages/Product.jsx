// Issue #51 — base product page layout. Issue #52 — personalization selectors
// with live pricing. Issue #53 — presale/soldout states.
// Bundle step (optional, #52 AC) skipped — no bundle catalog/spec exists yet.
// brand-brief.md sección 10 — reordenado a la arquitectura horizontal de
// esa sección (carrusel dominante + orden de contenido fijo: nombre →
// gancho → pregunta → historia → ficha técnica → personalización → link
// de método → precio/CTA → tiempos → cómo llega → trust). Ver §16
// decisión 10 (video de unboxing) y §20 (registro de esta ejecución).
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import {
  SIZES,
  sizesForType,
  FRAMES,
  COLORS,
  ADDONS,
  PRODUCTION_DAYS,
  SHIPPING_DAYS,
  HOW_IT_ARRIVES_STEPS,
  PUZZLE_HOW_IT_ARRIVES_STEPS,
  COUNTRY_NAMES,
} from '../lib/catalog.js';
import { useDocumentHead } from '../lib/useDocumentHead.js';
import RollingPrice from '../components/RollingPrice.jsx';
import WaitlistDialog from '../components/WaitlistDialog.jsx';
import Button from '../components/Button.jsx';
import Stamp from '../components/Stamp.jsx';
import BaggageTag from '../components/BaggageTag.jsx';
import Reviews from '../components/Reviews.jsx';
import HowItArrives from '../components/HowItArrives.jsx';
import Accordion from '../components/Accordion.jsx';
import PhotoCarousel from '../components/PhotoCarousel.jsx';
import FichaTecnica from '../components/FichaTecnica.jsx';
import { piecePhotos } from '../lib/photography.js';
import { fetchJson } from '../lib/fetchJsonArray.js';

// Full-bleed color backdrop behind the title/photo/spec area — exact
// per-piece mapping from the "Explorar (preview)" artifact's mock PIECES
// data (Ale approved these specific pairings, not an arbitrary scheme):
// shanghai->passport-ink, ciudad-de-mexico->walnut, paris->sello-navy,
// londres->explorer-blue, barcelona->sage, nevado-de-toluca->stone. These
// six slugs are exactly the current real catalog (see
// relieve-project-overview memory), so the table is complete, not a
// fallback. Every literal class has to appear here (not built via
// `bg-${accent}`) or Tailwind's build-time scan won't generate it.
const ACCENT_CLASSES = {
  walnut: { bg: 'bg-walnut', text: 'text-gallery-white', dark: true },
  sage: { bg: 'bg-sage', text: 'text-graphite', dark: false },
  'explorer-blue': { bg: 'bg-explorer-blue', text: 'text-graphite', dark: false },
  'passport-ink': { bg: 'bg-passport-ink', text: 'text-gallery-white', dark: true },
  'sello-navy': { bg: 'bg-sello-navy', text: 'text-gallery-white', dark: true },
  stone: { bg: 'bg-stone', text: 'text-graphite', dark: false },
};
const ACCENT_BY_SLUG = {
  shanghai: 'passport-ink',
  'ciudad-de-mexico': 'walnut',
  paris: 'sello-navy',
  londres: 'explorer-blue',
  barcelona: 'sage',
  'nevado-de-toluca': 'stone',
};
function accentFor(slug) {
  return ACCENT_CLASSES[ACCENT_BY_SLUG[slug] ?? 'stone'];
}

// Same $X,XXX MXN format as CartDrawer.jsx's money() / RollingPrice.jsx.
function addonPrice(cents) {
  return `+$${(cents / 100).toLocaleString('es-MX')} MXN`;
}

export default function Product() {
  const { slug } = useParams();
  const { addItem } = useCart();
  const [place, setPlace] = useState(null);
  const [error, setError] = useState(null);

  const [sizeCode, setSizeCode] = useState(SIZES[1].code);
  const [frameCode, setFrameCode] = useState(FRAMES[0].code);
  const [colorCode, setColorCode] = useState(COLORS[0].code);
  const [orientation, setOrientation] = useState('horizontal');
  const [plateText, setPlateText] = useState('');
  const [capelo, setCapelo] = useState(false);
  const [memoryNote, setMemoryNote] = useState('');
  const [unitPriceCents, setUnitPriceCents] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetchJson(`/api/places/${slug}`)
      .then((data) => {
        if (cancelled) return;
        setPlace(data);
        // A puzzle only has one real size (see PUZZLE_SIZES) — a wall
        // piece defaults to the featured tier, same as before.
        const applicable = sizesForType(data.type);
        setSizeCode((applicable.find((s) => s.featured) ?? applicable[0]).code);
      })
      // fetchJson throws on a non-ok response AND on timeout (10s, see
      // lib/fetchJsonArray.js) — either way this is a visible error state,
      // never an indefinite "Cargando…".
      .catch(() => {
        if (!cancelled) setError('No pudimos cargar esta pieza.');
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  useEffect(() => {
    let cancelled = false;
    const addons = [capelo && 'capelo', plateText && 'placa'].filter(Boolean);
    fetchJson('/api/pricing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ size_code: sizeCode, frame_code: frameCode, addons }),
    })
      .then((data) => {
        if (!cancelled && data.unit_price != null) setUnitPriceCents(data.unit_price);
      })
      // Non-blocking: falls back to place.base_price (RollingPrice below),
      // so a timeout/error here just skips the live-priced update.
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [sizeCode, frameCode, capelo, plateText]);

  const productDescription = place
    ? (place.story?.slice(0, 155) ?? `Mapa en relieve de ${place.name}, enmarcado en parota.`)
    : undefined;

  // Same shape as scripts/prerender.mjs's buildPlaceHtml() — that version
  // covers the first request (crawlers, direct loads), this one keeps it
  // live once React Router navigates here client-side, and reflects the
  // real-time price/status instead of whatever was true at last build.
  const JSONLD_AVAILABILITY = {
    soldout: 'https://schema.org/OutOfStock',
    preorder: 'https://schema.org/PreOrder',
  };
  const productJsonLd = place
    ? {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: `Relieve · ${place.name}`,
        description: productDescription,
        image: place.thumb_url ?? undefined,
        offers: {
          '@type': 'Offer',
          priceCurrency: 'MXN',
          price: ((unitPriceCents ?? place.base_price) / 100).toFixed(2),
          availability: JSONLD_AVAILABILITY[place.status] ?? 'https://schema.org/InStock',
        },
      }
    : undefined;

  useDocumentHead({
    title: place ? `${place.name} — Mapa en relieve | Relieve` : undefined,
    description: productDescription,
    image: place?.thumb_url,
    canonicalPath: `/pieza/${slug}`,
    jsonLd: productJsonLd,
  });

  if (error) {
    return (
      <main className="max-w-md mx-auto p-8 text-center">
        <Stamp label="Sin ruta" className="mb-6" />
        <h1 className="font-heading font-bold text-brand-dark text-2xl mb-2">{error}</h1>
        <p className="text-graphite/60 mb-6">
          Puede que esta pieza no exista o que el catálogo aún no esté conectado.
        </p>
        <Button as="a" href="/buscar">
          Buscar otro lugar
        </Button>
      </main>
    );
  }
  if (!place) {
    return (
      <p className="p-8 text-center font-label uppercase tracking-wide text-xs text-graphite/60">
        Cargando…
      </p>
    );
  }

  // El puzzle (colección Juego) no se enmarca, no tiene color ni
  // orientación, y no cumple el estándar de "se cuelga sin herraje" de las
  // piezas de pared — vive en su propio camino dentro de esta misma página
  // en vez de duplicar Product.jsx entero para un solo producto.
  const isPuzzle = place.type === 'juego';
  const availableSizes = sizesForType(place.type);
  const accent = accentFor(place.slug);

  const selectedColor = COLORS.find((c) => c.code === colorCode);
  const selectedFrame = FRAMES.find((f) => f.code === frameCode);
  const selectedSize = SIZES.find((s) => s.code === sizeCode) ?? availableSizes[0];

  const photos = (() => {
    const local = piecePhotos(place.slug);
    if (local.length) return local;
    return place.thumb_url ? [{ url: place.thumb_url, type: 'image' }] : [];
  })();

  const countryLabel = COUNTRY_NAMES[place.country] ?? place.country;

  // brand-brief.md sección 7/10 punto 3 — el "gancho emocional" es la
  // primera frase de la historia ya redactada (cada historia real se
  // escribió como gancho + cuerpo + cierre en un solo bloque, ver sección
  // 7); se separa por la primera oración en vez de inventar un campo de
  // gancho aparte que /api/places no tiene. Si el texto no trae punto
  // (no pasa hoy en ninguna de las 6 historias reales), split() devuelve
  // el string completo como único elemento y storyBody queda vacío — se
  // degrada mostrando solo el gancho, no rompe.
  const [hookText, ...restSentences] = place.story ? place.story.split(/(?<=\.)\s+/) : [];
  const storyBody = restSentences.join(' ');

  const detailsAccordion = [
    {
      title: 'Material y acabado',
      content: isPuzzle
        ? 'El puzzle se imprime en 3D de alta precisión, acabado mate, listo para armar sobre cualquier superficie plana.'
        : 'El relieve se imprime en 3D de alta precisión y se enmarca a mano en parota, roble o negro. Acabado mate en toda la pieza.',
    },
    {
      title: 'Cambios y devoluciones',
      content:
        'Por ser piezas hechas por encargo, de fabricación bajo pedido, no aplican cambios ni devoluciones salvo defecto de fabricación.',
    },
    {
      title: 'Factura',
      content: 'Puedes solicitarla dentro del mismo mes de tu compra con tus datos fiscales.',
    },
  ];

  function handleAddToCart() {
    addItem({
      place_slug: place.slug,
      name: `Relieve · ${place.name} · ${sizeCode} · ${frameCode}`,
      unit_price_cents: unitPriceCents ?? place.base_price,
      qty: 1,
      size_code: sizeCode,
      frame_code: frameCode,
      color_code: colorCode,
      orientation,
      plate_text: plateText || null,
      capelo,
      memory_note: memoryNote || null,
    });
  }

  return (
    <main className={`${accent.bg} ${accent.text} transition-colors`}>
      {/* grid-cols-[3fr_2fr]: el carrusel domina visualmente sobre el
          texto (sección 10 — "las imágenes dominan, el texto no compite
          en tamaño"), en vez del 50/50 anterior. */}
      <div className="grid md:grid-cols-[3fr_2fr] gap-8 p-8 max-w-6xl mx-auto items-start">
        {/* 1. Carrusel */}
        <div key={place.slug} className="warp-reveal md:sticky md:top-8">
          <PhotoCarousel
            photos={photos}
            alt={`Mapa en relieve de ${place.name}${!isPuzzle ? `, enmarcado en ${selectedFrame?.label.toLowerCase()}` : ''}`}
            placeholderLabel={place.name}
          />
        </div>

        {/* min-w-0: without it, a CSS Grid item defaults to a min-width of
            its content's min-content size, so a long unbreakable value here
            could force this whole column past the viewport instead of
            wrapping — the "right column overflows and cuts off the CTA"
            symptom reported in QA. break-words on dl values is the other
            half of the same fix. */}
        <div className="min-w-0">
          {/* 2. Nombre */}
          <h1 className="font-heading font-bold text-brand-dark text-[clamp(2.25rem,3vw+1.5rem,3.5rem)] leading-tight mb-1">
            {place.name}
          </h1>
          <p className="font-label uppercase tracking-wide text-xs mb-6 opacity-70">
            {countryLabel}
            {place.elevation_m ? ` · ${place.elevation_m} msnm` : ''}
          </p>

          {/* 3. Gancho emocional */}
          {hookText && (
            <p className="font-heading font-bold text-2xl leading-snug mb-6 max-w-[38ch]">
              {hookText}
            </p>
          )}

          {place.status === 'preorder' && (
            <span className="inline-block mb-4 px-4 py-1 rounded-full border border-current font-label uppercase tracking-wide text-xs animate-pulse">
              Pre-order
            </span>
          )}

          {/* 4. "¿Para quién es esta pieza?" — la pregunta fija ya vive en
              el legend del selector de tamaño (ver §19); se sube aquí,
              cerca del gancho, en vez de quedar enterrada más abajo. */}
          <fieldset className="mb-8">
            <legend className="font-label uppercase tracking-wide text-xs mb-2">
              ¿Para quién es esta pieza — para ti, o para presumirla?
            </legend>
            <div className="flex flex-wrap gap-2">
              {availableSizes.map((s) => (
                <button
                  key={s.code}
                  onClick={() => setSizeCode(s.code)}
                  className={`px-3 py-1 rounded-full border text-sm font-heading font-bold ${
                    sizeCode === s.code
                      ? 'bg-brand-dark text-dark-bg border-brand-dark'
                      : s.featured
                        ? 'border-brand-dark border-2'
                        : 'border-current'
                  }`}
                >
                  {s.label} <span className="opacity-70">· {s.dims}</span>
                  {s.featured && <span className="ml-1 text-xs opacity-70">· el más elegido para regalar</span>}
                </button>
              ))}
            </div>
            {selectedSize?.tagline && (
              <p className="mt-2 text-xs opacity-70">{selectedSize.tagline}</p>
            )}
          </fieldset>

          {/* 5. Historia del lugar */}
          {storyBody && <p className="mb-10 leading-relaxed max-w-[46ch]">{storyBody}</p>}

          {/* Todo lo demás vive en su propia card neutral, para que el
              estilo navy de selección existente (bg-sello-navy en el chip
              activo, border-line el resto) siga siendo legible sin
              importar el accent de fondo de arriba. */}
          <div className="bg-gallery-white text-graphite rounded-[9px] p-6">
            <div className="flex flex-wrap gap-3 mb-6">
              <BaggageTag label="Ubicación" value={place.name} />
              <BaggageTag label="Tamaño" value={selectedSize.label} />
              {!isPuzzle && <BaggageTag label="Marco" value={selectedFrame.label} />}
            </div>

            {!isPuzzle && (
              <>
                <fieldset className="mb-4">
                  <legend className="font-label uppercase tracking-wide text-xs mb-2">Marco</legend>
                  <div className="flex flex-wrap gap-2">
                    {FRAMES.map((f) => (
                      <button
                        key={f.code}
                        onClick={() => setFrameCode(f.code)}
                        className={`flex items-center gap-2 px-3 py-1 rounded-full border text-sm font-heading font-bold ${
                          frameCode === f.code ? 'bg-brand-dark text-dark-bg border-brand-dark' : 'border-line'
                        }`}
                      >
                        <span
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: f.hex }}
                        />
                        {f.label}
                      </button>
                    ))}
                  </div>
                </fieldset>

                <fieldset className="mb-4">
                  <legend className="font-label uppercase tracking-wide text-xs mb-2">Color</legend>
                  <div className="flex gap-2">
                    {COLORS.map((c) => (
                      <button
                        key={c.code}
                        onClick={() => setColorCode(c.code)}
                        aria-label={c.label}
                        title={c.label}
                        className={`w-7 h-7 rounded-full border-2 ${
                          colorCode === c.code ? 'border-brand-dark' : 'border-line'
                        }`}
                        style={{ backgroundColor: c.hex }}
                      />
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-graphite/70">
                    {selectedColor?.label}
                  </p>
                </fieldset>

                <fieldset className="mb-6">
                  <legend className="font-label uppercase tracking-wide text-xs mb-2">Orientación</legend>
                  <div className="flex gap-2">
                    {['horizontal', 'vertical'].map((o) => (
                      <button
                        key={o}
                        onClick={() => setOrientation(o)}
                        className={`px-3 py-1 rounded-full border text-sm capitalize font-heading font-bold ${
                          orientation === o ? 'bg-brand-dark text-dark-bg border-brand-dark' : 'border-line'
                        }`}
                      >
                        {o}
                      </button>
                    ))}
                  </div>
                </fieldset>
              </>
            )}

            {/* 6. Ficha técnica — refleja la selección real de arriba */}
            <div className="mb-10">
              <h2 className="font-heading font-bold text-brand-dark uppercase tracking-wide text-xs mb-2">
                Ficha técnica
              </h2>
              <FichaTecnica
                pieceNumber={null}
                editionNumber={null}
                collectionName={isPuzzle ? 'Juego' : 'Ciudades del Mundo'}
                series={place.series}
                placeName={place.name}
                country={countryLabel}
                sizeCode={sizeCode}
                frameCode={isPuzzle ? undefined : frameCode}
                colorCode={isPuzzle ? undefined : colorCode}
              />
            </div>

            {/* 7. "En una frase, ¿por qué este lugar?" */}
            <div className="mb-4">
              <label htmlFor="memoryNote" className="font-label uppercase tracking-wide text-xs block mb-1">
                En una frase, ¿por qué este lugar?
              </label>
              <input
                id="memoryNote"
                value={memoryNote}
                onChange={(e) => setMemoryNote(e.target.value)}
                maxLength={140}
                placeholder="Aquí aprendí a vivir sola."
                className="w-full border border-line rounded px-3 py-2"
              />
              <p className="text-xs text-graphite/60 mt-1">
                Opcional — si la compartes, la imprimimos en una tarjeta dentro de tu pieza.
              </p>
            </div>

            {/* 8. Personalización (mensaje trasero del marco + capelo) */}
            {!isPuzzle && (
              <div className="mb-4 flex items-center gap-2">
                <input
                  id="capelo"
                  type="checkbox"
                  checked={capelo}
                  onChange={(e) => setCapelo(e.target.checked)}
                  className="appearance-none w-5 h-5 rounded border border-line bg-gallery-white relative cursor-pointer checked:bg-sello-navy checked:border-sello-navy after:content-[''] after:absolute after:inset-0 after:flex after:items-center after:justify-center checked:after:content-['✓'] after:text-dark-bg after:text-xs"
                />
                <label htmlFor="capelo" className="text-sm">
                  Agregar capelo de vidrio{' '}
                  <span className="text-graphite/60">{addonPrice(ADDONS.capelo)}</span>
                </label>
              </div>
            )}

            <div className="mb-6">
              <label className="font-label uppercase tracking-wide text-xs block mb-1">
                Placa grabada (opcional) <span className="normal-case text-graphite/60">{addonPrice(ADDONS.placa)}</span>
              </label>
              <input
                value={plateText}
                onChange={(e) => setPlateText(e.target.value)}
                maxLength={40}
                placeholder="Texto a grabar"
                className="w-full border border-line rounded px-3 py-2"
              />
            </div>

            {/* 9. Link "Cómo se hizo esta pieza" — único punto de entrada
                a /metodo-relieve desde la ficha de producto (sección 5/10
                punto 9): un link, no contenido inline/colapsable. */}
            <Link
              to="/metodo-relieve"
              className="inline-block mb-10 text-sm underline text-brand-dark hover:opacity-70 transition-opacity"
            >
              Cómo se hizo esta pieza
            </Link>

            {/* 10. Precio + CTA · 11. Tiempos · 14. micro-línea de trust */}
            <div className="rounded-[9px] border border-line p-4 mb-10">
              <RollingPrice
                cents={unitPriceCents ?? place.base_price}
                className="font-label text-2xl font-bold block mb-1"
              />
              <p className="font-label uppercase tracking-wide text-[11px] text-graphite/60 mb-3">
                Se fabrica en {PRODUCTION_DAYS} días hábiles · llega {SHIPPING_DAYS} días después
              </p>
              {place.status === 'soldout' ? (
                <WaitlistDialog placeSlug={place.slug} />
              ) : (
                <Button onClick={handleAddToCart}>Encargar mi pieza</Button>
              )}
              <p className="text-[11px] text-graphite/60 mt-2">
                Pieza hecha por encargo — no aplican cambios ni devoluciones salvo defecto.{' '}
                <a href="#detalles" className="underline">Ver detalles</a>
              </p>
            </div>

            {/* 13. Cómo llega */}
            <div className="mt-10">
              <h2 className="font-heading font-bold text-brand-dark uppercase tracking-wide text-xs mb-3">
                Cómo llega
              </h2>
              <HowItArrives steps={isPuzzle ? PUZZLE_HOW_IT_ARRIVES_STEPS : HOW_IT_ARRIVES_STEPS} />
            </div>

            <div id="detalles" className="mt-10">
              <h2 className="font-heading font-bold text-brand-dark uppercase tracking-wide text-xs mb-2">
                Detalles
              </h2>
              <Accordion items={detailsAccordion} />
            </div>

            <Reviews slug={place.slug} />
          </div>
        </div>
      </div>
    </main>
  );
}
