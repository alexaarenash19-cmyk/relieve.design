// Issue #51 — base product page layout. Issue #52 — personalization selectors
// with live pricing. Issue #53 — presale/soldout states.
// Bundle step (optional, #52 AC) skipped — no bundle catalog/spec exists yet.
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import { SIZES, FRAMES, COLORS } from '../lib/catalog.js';
import RollingPrice from '../components/RollingPrice.jsx';
import WaitlistDialog from '../components/WaitlistDialog.jsx';
import Button from '../components/Button.jsx';
import Stamp from '../components/Stamp.jsx';
import BaggageTag from '../components/BaggageTag.jsx';
import TopoLines from '../components/TopoLines.jsx';

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
    fetch(`/api/places/${slug}`)
      .then((res) => {
        if (!res.ok) throw new Error('not_found');
        return res.json();
      })
      .then((data) => {
        if (!cancelled) {
          setPlace(data);
          setActivePhoto(data.thumb_url);
        }
      })
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
    fetch('/api/pricing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ size_code: sizeCode, frame_code: frameCode, addons }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && data.unit_price != null) setUnitPriceCents(data.unit_price);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [sizeCode, frameCode, capelo, plateText]);

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
    [
      'Tipo',
      place.type === 'montana' ? 'Montaña' : 'Ciudad',
      place.type === 'montana' ? 'text-walnut' : 'text-explorer-blue',
    ],
    ['Medidas', selectedSize.dims],
    place.elevation_m ? ['Altitud', `${place.elevation_m} msnm`] : null,
    place.lat && place.lng ? ['Coordenadas', `${place.lat}, ${place.lng}`] : null,
    ['SKU', `RLV-${place.slug.toUpperCase()}-${sizeCode.slice(0, 3).toUpperCase()}`],
  ].filter(Boolean);

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
        <div
          key={place.slug + activePhoto}
          className="warp-reveal warm-photo relative aspect-square rounded-[9px] overflow-hidden flex items-center justify-center"
          style={{ backgroundColor: selectedColor?.hex ?? '#C8C3BC' }}
        >
          {activePhoto ? (
            <img
              src={activePhoto}
              alt={`Mapa en relieve de ${place.name}, enmarcado en ${selectedFrame?.label.toLowerCase()}`}
              className="w-full h-full object-cover"
            />
          ) : (
            <span
              className="font-label uppercase tracking-wide text-xs px-3 py-1 rounded"
              style={{ border: `4px solid ${selectedFrame?.hex ?? 'transparent'}` }}
            >
              {place.name}
            </span>
          )}
          {activePhoto && (
            <TopoLines className="absolute inset-0 w-full h-full text-dark-fg mix-blend-screen opacity-70 pointer-events-none" />
          )}
        </div>
        {(place.thumb_url || place.detail_url) && (
          <div className="flex gap-2 mt-3">
            {[place.thumb_url, place.detail_url].filter(Boolean).map((url) => (
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
                  className={`w-3 h-3 rounded-full ${f.code === 'nogal' ? 'bg-walnut' : ''}`}
                  style={f.code === 'nogal' ? undefined : { backgroundColor: f.hex }}
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
          className="font-label text-2xl font-bold block mb-6"
        />

        {place.status === 'soldout' ? (
          <WaitlistDialog placeSlug={place.slug} />
        ) : (
          <Button onClick={handleAddToCart}>Agregar al carrito</Button>
        )}
      </div>
    </main>
  );
}
