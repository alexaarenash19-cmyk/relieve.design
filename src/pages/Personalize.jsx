// docs/superpowers/specs/2026-08-13-personaliza-checkout-design.md — rewrite
// completo. Reemplaza el lead-capture form de PR #208 (formulario ->
// correo a Ale -> cotización manual) por checkout automático: el cliente
// diseña su pieza y compra en la misma visita, reutilizando el
// CartContext/Stripe Checkout que el catálogo ya usa. La infraestructura
// de lead-capture (POST /api/personaliza, tabla personalize_requests)
// queda en el backend sin uso — no se borra (bajo riesgo, cero costo de
// mantenerla), simplemente esta página ya no la llama.
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import StepProgress from '../components/StepProgress.jsx';
import LocationPicker from '../components/LocationPicker.jsx';
import TerrainPreview from '../components/TerrainPreview.jsx';
import { useCart } from '../context/CartContext.jsx';
import { useDocumentHead } from '../lib/useDocumentHead.js';
import { fetchJson } from '../lib/fetchJsonArray.js';
import { WALL_SIZES, COLORS, FRAMES, PRODUCTION_DAYS, SHIPPING_DAYS, formatDims } from '../lib/catalog.js';

// D8-D10 (Product.jsx, 14 ago 2026) — mismo criterio aquí: Parota Nacional
// es el único frame real, sin selector.
const FRAME = FRAMES[0];
const STORY_MAX_LENGTH = 140; // mismo límite que memory_note ya tiene server-side (api/checkout.js's FREE_TEXT_LIMITS)

const STEPS = ['escala', 'ubicacion', 'forma', 'preview', 'historia', 'resumen'];
const STEP_LABELS = ['Escala', 'Ubicación', 'Forma', 'Preview', 'Historia', 'Resumen'];

function aspectRatioForSize(sizeCode) {
  // Único tamaño rectangular (120×80) — el resto son cuadrados.
  return sizeCode === 'especial' ? '3/2' : '1/1';
}

export default function Personalize() {
  useDocumentHead({
    title: 'Diseña tu Relieve — Relieve',
    description: 'Elige un lugar, dale forma y compra tu Relieve personalizado — sin intermediarios, con precio claro desde el primer paso.',
    canonicalPath: '/personaliza',
  });

  const navigate = useNavigate();
  const { addItem } = useCart();

  const [currentStep, setCurrentStep] = useState(1);
  const [sizeCode, setSizeCode] = useState(WALL_SIZES[1].code);
  const [location, setLocation] = useState(null); // shape de LocationPicker's onConfirm
  const [colorCode, setColorCode] = useState(COLORS[0].code);
  const [story, setStory] = useState('');
  const [unitPriceCents, setUnitPriceCents] = useState(null);
  const [priceError, setPriceError] = useState(false);
  // Final whole-branch review finding #4 — a failed price fetch used to be
  // an unrecoverable dead end (unitPriceCents stays null forever, the only
  // way out was going back and re-selecting the size). Bumping this state
  // re-triggers the pricing effect below without touching sizeCode.
  const [retryKey, setRetryKey] = useState(0);

  // docs/superpowers/specs sección 3 — "el precio debe actualizarse
  // inmediatamente cuando el usuario cambie el tamaño". Mismo patrón que
  // Product.jsx ya usa para /api/pricing.
  useEffect(() => {
    let cancelled = false;
    setPriceError(false);
    setUnitPriceCents(null);
    fetchJson('/api/personalized-pricing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ size_code: sizeCode }),
    })
      .then((data) => {
        if (!cancelled && data.unit_price != null) setUnitPriceCents(data.unit_price);
      })
      .catch(() => {
        if (!cancelled) setPriceError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [sizeCode, retryKey]);

  const selectedSize = WALL_SIZES.find((s) => s.code === sizeCode);
  const selectedColor = COLORS.find((c) => c.code === colorCode);
  const aspectRatio = aspectRatioForSize(sizeCode);

  // docs/superpowers/specs sección 5 — validación antes de pagar,
  // duplicada del lado del cliente (gate del botón) — el servidor la
  // repite de forma independiente en api/checkout.js, nunca confía en
  // esta.
  // Final whole-branch review finding #10 — formatted_address wasn't part
  // of this gate. If Google ever returns a place with a place_id but no
  // formattedAddress, the buy button would enable client-side but the
  // server would reject it (400 invalid_custom_location / invalid_item),
  // leaving the customer stuck at checkout with no clear error.
  const isComplete = Boolean(
    location?.place_id &&
    location?.formatted_address &&
    location?.map_bounds &&
    sizeCode &&
    colorCode &&
    unitPriceCents != null,
  );

  function goNext() {
    setCurrentStep((s) => Math.min(s + 1, STEPS.length));
  }
  function goBack() {
    setCurrentStep((s) => Math.max(s - 1, 1));
  }

  function handleBuy() {
    if (!isComplete) return;
    addItem({
      // Final whole-branch review finding #2 — custom_place caps at 120
      // chars server-side (api/checkout.js's FREE_TEXT_LIMITS) while
      // custom_location.formatted_address allows 200 (assertValidCustomLocation)
      // — a 121-200 char Google address would pass location validation then
      // fail at custom_place length with no way for the customer to fix it.
      // Truncate only this copy; the full address still goes into custom_location.
      custom_place: location.formatted_address.slice(0, 120),
      custom_location: {
        place_id: location.place_id,
        formatted_address: location.formatted_address,
        latitude: location.latitude,
        longitude: location.longitude,
        map_bounds: location.map_bounds,
        zoom: location.zoom,
      },
      name: `Relieve · ${location.formatted_address} · ${sizeCode}`,
      unit_price_cents: unitPriceCents,
      qty: 1,
      size_code: sizeCode,
      frame_code: FRAME.code,
      color_code: colorCode,
      orientation: 'horizontal',
      memory_note: story || null,
    });
    navigate('/'); // el carrito abre solo (CartContext.addItem ya hace openCart)
  }

  const activeStep = STEPS[currentStep - 1];
  const isLastStep = currentStep === STEPS.length;

  return (
    // Hallazgo #8 (auditoría 10 ago 2026): pt-32 (no p-8) — mismo fix que Collections.jsx/Product.jsx.
    <main className="max-w-lg mx-auto pt-32 px-8 pb-16">
      <h1 className="font-heading font-bold text-brand-dark text-3xl mb-2">Diseña tu Relieve</h1>
      <p className="text-graphite/70 mb-8">
        Un lugar que es solo tuyo. Elige un lugar, nosotros lo convertimos en relieve.
      </p>

      {activeStep === 'escala' && (
        <fieldset className="mb-6">
          <legend className="font-label uppercase tracking-wide text-xs mb-2">Elige tu escala</legend>
          <div className="flex flex-col gap-2">
            {WALL_SIZES.map((s) => (
              <button
                key={s.code}
                type="button"
                onClick={() => setSizeCode(s.code)}
                className={`text-left px-4 py-3 rounded-[9px] font-heading font-bold ${
                  sizeCode === s.code ? 'pill-glass-active text-gallery-white' : 'pill-glass text-graphite'
                }`}
              >
                {s.label} — {formatDims(s.dims)}
              </button>
            ))}
          </div>
        </fieldset>
      )}

      {activeStep === 'ubicacion' && (
        <div className="mb-6">
          <p className="font-label uppercase tracking-wide text-xs mb-2">Elige tu lugar</p>
          <LocationPicker aspectRatio={aspectRatio} onConfirm={(loc) => { setLocation(loc); goNext(); }} />
        </div>
      )}

      {activeStep === 'forma' && (
        <fieldset className="mb-6">
          <legend className="font-label uppercase tracking-wide text-xs mb-2">Dale forma</legend>
          <div className="flex gap-2">
            {COLORS.map((c) => (
              <button
                key={c.code}
                type="button"
                onClick={() => setColorCode(c.code)}
                aria-label={c.label}
                title={c.label}
                className={`w-10 h-10 rounded-full border-2 ${colorCode === c.code ? 'border-brand-dark' : 'border-line'}`}
                style={{ backgroundColor: c.hex }}
              />
            ))}
          </div>
          <p className="mt-2 text-xs text-graphite/70">{selectedColor?.label}</p>
        </fieldset>
      )}

      {activeStep === 'preview' && location?.map_bounds && (
        <div className="mb-6">
          <TerrainPreview mapBounds={location.map_bounds} aspectRatio={aspectRatio} colorHex={selectedColor?.hex} />
        </div>
      )}

      {activeStep === 'historia' && (
        <label className="flex flex-col gap-1 mb-6">
          <span className="font-label uppercase tracking-wide text-xs">¿Por qué este lugar? (opcional)</span>
          <textarea
            value={story}
            maxLength={STORY_MAX_LENGTH}
            onChange={(e) => setStory(e.target.value)}
            className="border border-line rounded px-3 py-2"
          />
        </label>
      )}

      {activeStep === 'resumen' && (
        <div className="mb-6 bg-gallery-white rounded-[9px] p-6">
          <h2 className="font-heading font-bold text-brand-dark text-xl mb-4">Tu Relieve</h2>
          <dl className="space-y-2 text-sm mb-6">
            <div>
              <dt className="font-label uppercase tracking-wide text-xs text-graphite/60">Ubicación</dt>
              <dd>{location?.formatted_address}</dd>
            </div>
            <div>
              <dt className="font-label uppercase tracking-wide text-xs text-graphite/60">Tamaño</dt>
              <dd>{selectedSize?.label} — {formatDims(selectedSize?.dims)}</dd>
            </div>
            <div>
              <dt className="font-label uppercase tracking-wide text-xs text-graphite/60">Color</dt>
              <dd>{selectedColor?.label}</dd>
            </div>
            <div>
              <dt className="font-label uppercase tracking-wide text-xs text-graphite/60">Marco</dt>
              <dd>{FRAME.label}</dd>
            </div>
          </dl>
          <p className="font-label uppercase tracking-wide text-xs text-graphite/60 mb-1">Relieve personalizado</p>
          <p className="font-heading font-bold text-brand-dark text-2xl mb-4">
            {unitPriceCents != null ? `$${(unitPriceCents / 100).toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN` : '—'}
          </p>
          <p className="text-sm text-graphite/70">Producción: {PRODUCTION_DAYS} días</p>
          <p className="text-sm text-graphite/70">Envío: Gratis</p>
          <p className="text-sm text-graphite/70 mb-4">Entrega: {SHIPPING_DAYS} días después del envío</p>
          {!isComplete && (
            <p className="text-sm text-brand-dark font-bold">Completa tu Relieve para continuar.</p>
          )}
          {priceError && (
            <p className="text-sm text-graphite/60">
              No pudimos calcular el precio, intenta de nuevo.{' '}
              <button
                type="button"
                onClick={() => setRetryKey((k) => k + 1)}
                className="text-xs text-graphite/60 underline"
              >
                Reintentar
              </button>
            </p>
          )}
        </div>
      )}

      <StepProgress
        total={STEPS.length}
        current={currentStep}
        labels={STEP_LABELS}
        onBack={goBack}
        onContinue={goNext}
        isLast={isLastStep}
        finalAction={
          <button
            type="button"
            onClick={handleBuy}
            disabled={!isComplete}
            className="pill-glass-active text-gallery-white px-6 py-3 rounded-[9px] font-heading font-bold w-full disabled:opacity-40"
          >
            Comprar mi Relieve
          </button>
        }
      />
    </main>
  );
}
