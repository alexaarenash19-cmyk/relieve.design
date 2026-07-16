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

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/places/${slug}`)
      .then((res) => {
        if (!res.ok) throw new Error('not_found');
        return res.json();
      })
      .then((data) => {
        if (!cancelled) setPlace(data);
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

  if (error) return <p className="p-8">{error}</p>;
  if (!place) return <p className="p-8">Cargando…</p>;

  const selectedColor = COLORS.find((c) => c.code === colorCode);
  const selectedFrame = FRAMES.find((f) => f.code === frameCode);
  const selectedSize = SIZES.find((s) => s.code === sizeCode);

  const specs = [
    ['Tipo', place.type === 'montana' ? 'Montaña' : 'Ciudad'],
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
      <div
        key={place.slug}
        className="warp-reveal aspect-square rounded-[9px] flex items-center justify-center"
        style={{ backgroundColor: selectedColor?.hex ?? '#C8C3BC' }}
      >
        {place.thumb_url ? (
          <img
            src={place.thumb_url}
            alt={`Mapa en relieve de ${place.name}, enmarcado en ${selectedFrame?.label.toLowerCase()}`}
            className="w-full h-full object-cover rounded-[9px]"
          />
        ) : (
          <span
            className="font-label uppercase tracking-wide text-xs px-3 py-1 rounded"
            style={{ border: `4px solid ${selectedFrame ? '#7A5A43' : 'transparent'}` }}
          >
            {place.name}
          </span>
        )}
      </div>

      <div>
        <h1 className="font-display font-light text-3xl mb-6">{place.name}</h1>
        <dl className="border-t border-line mb-6">
          {specs.map(([label, value]) => (
            <div
              key={label}
              className="grid grid-cols-2 border-b border-line py-2 font-label uppercase tracking-wide text-xs"
            >
              <dt className="text-text/60">{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
        {place.story && <p className="mb-6 leading-relaxed">{place.story}</p>}

        {place.status === 'preorder' && (
          <span className="inline-block mb-4 px-4 py-1 rounded-full border border-navy text-navy font-label uppercase tracking-wide text-xs animate-pulse">
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
                  sizeCode === s.code ? 'bg-navy text-bg-dark border-navy' : 'border-line'
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
                className={`px-3 py-1 rounded-full border text-sm ${
                  frameCode === f.code ? 'bg-navy text-bg-dark border-navy' : 'border-line'
                }`}
              >
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
                  colorCode === c.code ? 'border-navy' : 'border-line'
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
                  orientation === o ? 'bg-navy text-bg-dark border-navy' : 'border-line'
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
