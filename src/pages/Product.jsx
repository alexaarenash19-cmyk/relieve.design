// Issue #51 — base product page layout. Issue #52 — personalization selectors
// with live pricing. Issue #53 — presale/soldout states.
// Bundle step (optional, #52 AC) skipped — no bundle catalog/spec exists yet.
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import { SIZES, FRAMES, COLORS, PRODUCTION_DAYS, SHIPPING_DAYS, HOW_IT_ARRIVES_STEPS } from '../lib/catalog.js';
import { useDocumentHead } from '../lib/useDocumentHead.js';
import RollingPrice from '../components/RollingPrice.jsx';
import WaitlistDialog from '../components/WaitlistDialog.jsx';
import Button from '../components/Button.jsx';
import Stamp from '../components/Stamp.jsx';
import BaggageTag from '../components/BaggageTag.jsx';
import Reviews from '../components/Reviews.jsx';
import HowItArrives from '../components/HowItArrives.jsx';
import Accordion from '../components/Accordion.jsx';
import { pieceMainPhoto, pieceDetailPhoto } from '../lib/photography.js';
import { fetchJson } from '../lib/fetchJsonArray.js';

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
  const [unitPriceCents, setUnitPriceCents] = useState(null);
  const [activePhoto, setActivePhoto] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetchJson(`/api/places/${slug}`)
      .then((data) => {
        if (!cancelled) {
          setPlace(data);
          // Swappable local file (src/assets/photography/pieces/<slug>/main.jpg)
          // wins over the catalog's thumb_url when present — same convention
          // as the gallery, so dropping in a real photo needs no code change.
          setActivePhoto(pieceMainPhoto(data.slug) ?? data.thumb_url);
        }
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

  const selectedColor = COLORS.find((c) => c.code === colorCode);
  const selectedFrame = FRAMES.find((f) => f.code === frameCode);
  const selectedSize = SIZES.find((s) => s.code === sizeCode);

  const specs = [
    // Issue #67 — text-explorer-blue on gallery-white measures ~1.5:1
    // contrast (WCAG AA needs 4.5:1 for this text size), exactly the risk
    // ui-ux.md's Accesibilidad section already flagged ("cuidar
    // terracota/azul sobre claro"). text-walnut passes (~5.6:1) so it's not
    // touched; dropping the per-type color instead of picking a new blue
    // shade — the palette is a fixed set of 10, not mine to extend.
    ['Tipo', place.type === 'montana' ? 'Montaña' : 'Ciudad', place.type === 'montana' ? 'text-walnut' : undefined],
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
  const fullSpecs = [
    ['Material', 'Impresión 3D de alta precisión, acabado mate'],
    ['Marco', selectedFrame.label],
    ['Color', selectedColor.label],
    ['Tamaño', `${selectedSize.label} · ${selectedSize.dims}`],
    ['Producción', `${PRODUCTION_DAYS} días hábiles`],
    ['Envío', `${SHIPPING_DAYS} días`],
    ['Origen', 'Hecho en México'],
  ];

  const detailsAccordion = [
    {
      title: 'Material y acabado',
      content:
        'El relieve se imprime en 3D de alta precisión y se enmarca a mano en parota, roble o negro. Acabado mate en toda la pieza.',
    },
    {
      title: 'Cambios y devoluciones',
      content:
        'Por ser piezas personalizadas de fabricación bajo pedido, no aplican cambios ni devoluciones salvo defecto de fabricación.',
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
    });
  }

  return (
    <main className="grid md:grid-cols-2 gap-8 p-8 max-w-5xl mx-auto">
      <div>
        {/* No per-variant photography exists (a made-to-order piece can't
            be pre-shot in every size/color/frame combination) — background
            color responds to the actual selection instead, as a rough
            preview. No frame-colored border: the real photo already shows
            the actual frame, so an extra colored border around it was just
            visual clutter. */}
        <div
          key={place.slug + activePhoto}
          className="warp-reveal warm-photo relative aspect-square rounded-[9px] overflow-hidden flex items-center justify-center"
          style={{
            backgroundColor: selectedColor?.hex ?? '#C8C3BC',
          }}
        >
          {activePhoto ? (
            <img
              src={activePhoto}
              alt={`Mapa en relieve de ${place.name}, enmarcado en ${selectedFrame?.label.toLowerCase()}`}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="font-label uppercase tracking-wide text-xs px-3 py-1 rounded">
              {place.name}
            </span>
          )}
        </div>
        {(place.thumb_url || place.detail_url) && (
          <div className="flex gap-2 mt-3">
            {[
              pieceMainPhoto(place.slug) ?? place.thumb_url,
              pieceDetailPhoto(place.slug) ?? place.detail_url,
            ].filter(Boolean).map((url) => (
              <button
                key={url}
                onClick={() => setActivePhoto(url)}
                className={`w-16 h-16 rounded-[6px] overflow-hidden border-2 ${
                  activePhoto === url ? 'border-sello-navy' : 'border-line'
                }`}
              >
                <img src={url} alt="" className="warm-photo w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div>
        <h1 className="font-display font-light text-3xl mb-4">{place.name}</h1>

        <div className="flex flex-wrap gap-3 mb-6">
          <BaggageTag label="Ubicación" value={place.name} />
          <BaggageTag label="Tamaño" value={selectedSize.label} />
          <BaggageTag label="Marco" value={selectedFrame.label} />
        </div>

        <dl className="border-t border-line mb-6">
          {specs.map(([label, value, valueClassName]) => (
            <div
              key={label}
              className="grid grid-cols-2 border-b border-line py-2 font-label uppercase tracking-wide text-xs"
            >
              <dt className="text-graphite/60">{label}</dt>
              <dd className={valueClassName}>{value}</dd>
            </div>
          ))}
        </dl>
        {place.story && <p className="mb-6 leading-relaxed">{place.story}</p>}

        {place.status === 'preorder' && (
          <span className="inline-block mb-4 px-4 py-1 rounded-full border border-sello-navy text-sello-navy font-label uppercase tracking-wide text-xs animate-pulse">
            Pre-order
          </span>
        )}

        <fieldset className="mb-4">
          <legend className="font-label uppercase tracking-wide text-xs mb-2">Tamaño</legend>
          <div className="flex flex-wrap gap-2">
            {SIZES.map((s) => (
              <button
                key={s.code}
                onClick={() => setSizeCode(s.code)}
                className={`px-3 py-1 rounded-full border text-sm ${
                  sizeCode === s.code ? 'bg-sello-navy text-dark-bg border-sello-navy' : 'border-line'
                }`}
              >
                {s.label}
                {s.featured && <span className="ml-1 text-xs opacity-70">· el más elegido</span>}
              </button>
            ))}
          </div>
        </fieldset>

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
                className={`w-7 h-7 rounded-full border-2 ${
                  colorCode === c.code ? 'border-sello-navy' : 'border-line'
                }`}
                style={{ backgroundColor: c.hex }}
              />
            ))}
          </div>
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

        <div className="mb-4 flex items-center gap-2">
          <input id="capelo" type="checkbox" checked={capelo} onChange={(e) => setCapelo(e.target.checked)} />
          <label htmlFor="capelo" className="text-sm">Agregar capelo de vidrio</label>
        </div>

        <div className="mb-6">
          <label className="font-label uppercase tracking-wide text-xs block mb-1">
            Placa grabada (opcional)
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
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="mt-10">
          <h2 className="font-label uppercase tracking-wide text-xs mb-3">
            Cómo llega
          </h2>
          <HowItArrives steps={HOW_IT_ARRIVES_STEPS} />
        </div>

        <div className="mt-10">
          <h2 className="font-label uppercase tracking-wide text-xs mb-2">
            Detalles
          </h2>
          <Accordion items={detailsAccordion} />
        </div>

        <Reviews slug={place.slug} />
      </div>
    </main>
  );
}
