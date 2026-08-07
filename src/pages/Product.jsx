// Issue #51 — base product page layout. Issue #52 — personalization selectors
// with live pricing. Issue #53 — presale/soldout states.
// Bundle step (optional, #52 AC) skipped — no bundle catalog/spec exists yet.
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
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

  useDocumentHead({
    title: place ? `${place.name} — Mapa en relieve | Relieve` : undefined,
    description: place
      ? (place.story?.slice(0, 155) ?? `Mapa en relieve de ${place.name}, enmarcado en parota.`)
      : undefined,
    image: place?.thumb_url,
    canonicalPath: `/pieza/${slug}`,
  });

  if (error) {
    return (
      <main className="max-w-md mx-auto p-8 text-center">
        <Stamp label="Sin ruta" className="mb-6" />
        <h1 className="font-display font-light text-2xl mb-2">{error}</h1>
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
    return place.thumb_url ? [place.thumb_url] : [];
  })();

  const specs = [
    ['Tipo', isPuzzle ? 'Juego' : 'Ciudad'],
    ['Medidas', selectedSize.dims],
    place.elevation_m ? ['Altitud', `${place.elevation_m} msnm`] : null,
    place.lat && place.lng ? ['Coordenadas', `${place.lat}, ${place.lng}`] : null,
    ['SKU', `RLV-${place.slug.toUpperCase()}-${sizeCode.slice(0, 3).toUpperCase()}`],
  ].filter(Boolean);

  // Issue #83 — separate, fuller spec sheet (Shupatto style) further down
  // the page, distinct from the compact `specs` strip above (which is
  // about the PLACE — msnm/coordenadas/SKU). This one is about the OBJECT
  // itself and reflects the current personalization, so it updates live as
  // size/frame/color change. No peso/dimensiones de paquete row — that data
  // doesn't exist in the schema yet (issue #99), not something to guess.
  // Marco/Color skipped for the puzzle — it isn't framed or painted.
  const fullSpecs = [
    ['Material', 'Impresión 3D de alta precisión, acabado mate'],
    !isPuzzle ? ['Marco', selectedFrame.label] : null,
    !isPuzzle ? ['Color', selectedColor.label] : null,
    ['Tamaño', `${selectedSize.label} · ${selectedSize.dims}`],
    ['Producción', `${PRODUCTION_DAYS} días hábiles`],
    ['Envío', `${SHIPPING_DAYS} días`],
    ['Origen', 'Hecho en México'],
  ].filter(Boolean);

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
      <div className="grid md:grid-cols-2 gap-8 p-8 max-w-5xl mx-auto items-start">
        <div key={place.slug} className="warp-reveal">
          <PhotoCarousel
            photos={photos}
            alt={`Mapa en relieve de ${place.name}${!isPuzzle ? `, enmarcado en ${selectedFrame?.label.toLowerCase()}` : ''}`}
            placeholderLabel={place.name}
          />
        </div>

        {/* min-w-0: without it, a CSS Grid item defaults to a min-width of
            its content's min-content size, so a long unbreakable value here
            (coordenadas, SKU) could force this whole column past the
            viewport instead of wrapping — the "right column overflows and
            cuts off the CTA" symptom reported in QA. break-words on the
            dl values below is the other half of the same fix. */}
        <div className="min-w-0">
          <h1 className="font-display font-light text-[clamp(2.25rem,3vw+1.5rem,3.5rem)] leading-tight mb-4">
            {place.name}
          </h1>

          <dl className={`border-t mb-6 ${accent.dark ? 'border-gallery-white/25' : 'border-graphite/20'}`}>
            {specs.map(([label, value, valueClassName]) => (
              <div
                key={label}
                className={`grid grid-cols-2 border-b py-2 font-label uppercase tracking-wide text-xs ${
                  accent.dark ? 'border-gallery-white/25' : 'border-graphite/20'
                }`}
              >
                <dt className={accent.dark ? 'text-gallery-white/65' : 'text-graphite/60'}>{label}</dt>
                <dd className={`break-words ${valueClassName ?? ''}`}>{value}</dd>
              </div>
            ))}
          </dl>
          {place.story && <p className="mb-8 leading-relaxed max-w-[46ch]">{place.story}</p>}

          {/* Everything below is the real purchase flow (selectors, live
              price, cart, specs/accordion/reviews) — kept on its own
              neutral card so the site's existing navy-accent selection
              styling (bg-sello-navy on the active size/frame/color chip,
              border-line elsewhere) stays exactly as legible as before,
              regardless of which accent the page landed on above. */}
          <div className="bg-gallery-white text-graphite rounded-[9px] p-6">
            <div className="flex flex-wrap gap-3 mb-6">
              <BaggageTag label="Ubicación" value={place.name} />
              <BaggageTag label="Tamaño" value={selectedSize.label} />
              {!isPuzzle && <BaggageTag label="Marco" value={selectedFrame.label} />}
            </div>

            {place.status === 'preorder' && (
              <span className="inline-block mb-4 px-4 py-1 rounded-full border border-sello-navy text-sello-navy font-label uppercase tracking-wide text-xs animate-pulse">
                Pre-order
              </span>
            )}

            <fieldset className="mb-4">
              <legend className="font-label uppercase tracking-wide text-xs mb-2">
                ¿Para quién es esta pieza — para ti, o para presumirla?
              </legend>
              <div className="flex flex-wrap gap-2">
                {availableSizes.map((s) => (
                  <button
                    key={s.code}
                    onClick={() => setSizeCode(s.code)}
                    className={`px-3 py-1 rounded-full border text-sm ${
                      sizeCode === s.code
                        ? 'bg-sello-navy text-dark-bg border-sello-navy'
                        : s.featured
                          ? 'border-sello-navy border-2'
                          : 'border-line'
                    }`}
                  >
                    {s.label} <span className="opacity-70">· {s.dims}</span>
                    {s.featured && <span className="ml-1 text-xs opacity-70">· el más elegido para regalar</span>}
                  </button>
                ))}
              </div>
              {selectedSize?.tagline && (
                <p className="mt-2 text-xs text-graphite/70">{selectedSize.tagline}</p>
              )}
            </fieldset>

            {!isPuzzle && (
              <>
                <fieldset className="mb-4">
                  <legend className="font-label uppercase tracking-wide text-xs mb-2">Marco</legend>
                  <div className="flex flex-wrap gap-2">
                    {FRAMES.map((f) => (
                      <button
                        key={f.code}
                        onClick={() => setFrameCode(f.code)}
                        className={`flex items-center gap-2 px-3 py-1 rounded-full border text-sm ${
                          frameCode === f.code ? 'bg-sello-navy text-dark-bg border-sello-navy' : 'border-line'
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
                          colorCode === c.code ? 'border-sello-navy' : 'border-line'
                        }`}
                        style={{ backgroundColor: c.hex }}
                      />
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-graphite/70">
                    {COLORS.find((c) => c.code === colorCode)?.label}
                  </p>
                </fieldset>

                <fieldset className="mb-4">
                  <legend className="font-label uppercase tracking-wide text-xs mb-2">Orientación</legend>
                  <div className="flex gap-2">
                    {['horizontal', 'vertical'].map((o) => (
                      <button
                        key={o}
                        onClick={() => setOrientation(o)}
                        className={`px-3 py-1 rounded-full border text-sm capitalize ${
                          orientation === o ? 'bg-sello-navy text-dark-bg border-sello-navy' : 'border-line'
                        }`}
                      >
                        {o}
                      </button>
                    ))}
                  </div>
                </fieldset>
              </>
            )}

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

            <RollingPrice
              cents={unitPriceCents ?? place.base_price}
              className="font-label text-2xl font-bold block mb-2"
            />

            {/* Made-to-order, no inventory — every piece needs this. */}
            <p className="font-label uppercase tracking-wide text-[11px] text-graphite/60 mb-6">
              Se fabrica en {PRODUCTION_DAYS} días hábiles · llega {SHIPPING_DAYS} días después
            </p>

            {place.status === 'soldout' ? (
              <WaitlistDialog placeSlug={place.slug} />
            ) : (
              <Button onClick={handleAddToCart}>Agregar al carrito</Button>
            )}

            <div className="mt-10">
              <h2 className="font-label uppercase tracking-wide text-xs mb-2">
                Especificaciones
              </h2>
              <dl className="border-t border-line">
                {fullSpecs.map(([label, value]) => (
                  <div
                    key={label}
                    className="grid grid-cols-2 border-b border-line py-2 font-label uppercase tracking-wide text-xs"
                  >
                    <dt className="text-graphite/60">{label}</dt>
                    <dd className="break-words">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="mt-10">
              <h2 className="font-label uppercase tracking-wide text-xs mb-3">
                Cómo llega
              </h2>
              <HowItArrives steps={isPuzzle ? PUZZLE_HOW_IT_ARRIVES_STEPS : HOW_IT_ARRIVES_STEPS} />
            </div>

            <div className="mt-10">
              <h2 className="font-label uppercase tracking-wide text-xs mb-2">
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
