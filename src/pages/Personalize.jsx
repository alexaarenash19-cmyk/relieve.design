// docs/superpowers/specs/2026-08-13-personaliza-checkout-design.md — rewrite
// completo. Reemplaza el lead-capture form de PR #208 (formulario ->
// correo a Ale -> cotización manual) por checkout automático: el cliente
// diseña su pieza y compra en la misma visita, reutilizando el
// CartContext/Stripe Checkout que el catálogo ya usa. La infraestructura
// de lead-capture (POST /api/personaliza, tabla personalize_requests)
// queda en el backend sin uso — no se borra (bajo riesgo, cero costo de
// mantenerla), simplemente esta página ya no la llama.
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import StepProgress from '../components/StepProgress.jsx';
import LocationPicker from '../components/LocationPicker.jsx';
import TerrainPreview from '../components/TerrainPreview.jsx';
import { useCart } from '../context/CartContext.jsx';
import { useDocumentHead } from '../lib/useDocumentHead.js';
import { fetchJson } from '../lib/fetchJsonArray.js';
import { addedToCartPulse } from '../lib/animations.js';
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
  const [justAdded, setJustAdded] = useState(false);
  const buyBtnRef = useRef(null);

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
    addedToCartPulse(buyBtnRef.current);
    setJustAdded(true);
    // Nota: ya NO se navega a '/' inmediatamente — el mini-cart de abajo
    // decide cuándo navegar (checkout) o si el usuario prefiere seguir en
    // esta página ("Seguir diseñando"). CartContext.addItem() ya sigue
    // abriendo el CartDrawer completo por su cuenta (setIsOpen(true),
    // sin cambios) — este panel es un mensaje inmediato ADEMÁS de eso,
    // no en su lugar.
  }

  const activeStep = STEPS[currentStep - 1];
  const isLastStep = currentStep === STEPS.length;
  // Bug real (16 ago 2026, reportado: "el botón de comprar mi relieve no
  // sirve") — el paso 'ubicacion' tenía DOS formas de avanzar: el botón
  // "Ver mi Relieve →" propio de LocationPicker (el único que de verdad
  // llama a onConfirm y guarda `location`) y, justo debajo, el "Continuar"
  // genérico de StepProgress (que solo hace goNext(), sin tocar
  // `location`). Si el usuario tocaba el genérico, `location` quedaba
  // `null` para siempre — el wizard avanzaba igual pero 'preview' se veía
  // vacío (su bloque depende de `location?.map_bounds`) y 'resumen'
  // llegaba con "Comprar mi Relieve" deshabilitado sin explicación (isComplete
  // nunca es true sin location.place_id/formatted_address/map_bounds).
  // Fix: no renderizar el "Continuar" genérico en este paso — LocationPicker
  // es la única forma de avanzar desde 'ubicacion'. "Atrás" se conserva.
  const hideGenericContinue = activeStep === 'ubicacion';

  return (
    // Hallazgo #8 (auditoría 10 ago 2026): pt-32 (no p-8) — mismo fix que Collections.jsx/Product.jsx.
    <main className="pt-32 pb-16">
      <div className="max-w-5xl mx-auto px-4 md:px-8 text-center py-12 md:py-20">
        <h1 className="font-heading font-bold text-brand-dark text-[clamp(2rem,4vw+1rem,3.5rem)] leading-tight tracking-[-0.02em] mb-3">
          Un lugar que es solo tuyo.
        </h1>
        <p className="text-graphite/70 text-lg">
          Elige un lugar. Nosotros lo convertimos en relieve.
        </p>
      </div>

      {activeStep === 'ubicacion' ? (
        <div className="w-full">
          <div className="mb-6">
            <p className="font-label uppercase tracking-wide text-xs text-graphite/50 mb-1 text-center">02 — Elige tu lugar</p>
            <LocationPicker
              aspectRatio={aspectRatio}
              sizeLabel={`${selectedSize?.label} — ${formatDims(selectedSize?.dims)}`}
              onConfirm={(loc) => { setLocation(loc); goNext(); }}
            />
          </div>
        </div>
      ) : (
        <div className="max-w-lg mx-auto px-8">
          {activeStep === 'escala' && (
            <fieldset className="mb-6">
              <legend className="w-full">
                <p className="font-label uppercase tracking-wide text-xs text-graphite/50 mb-1">01 — Elige tu escala</p>
                <h2 className="font-heading font-bold text-2xl mb-6">¿Qué tamaño tendrá tu Relieve?</h2>
              </legend>
              <div className="flex flex-col gap-2">
                {WALL_SIZES.map((s) => (
                  <button
                    key={s.code}
                    type="button"
                    onClick={() => setSizeCode(s.code)}
                    className={`text-left px-4 py-3 rounded-[9px] font-heading font-bold ${
                      sizeCode === s.code ? 'pill-glass-active text-on-accent' : 'pill-glass text-graphite'
                    }`}
                  >
                    {s.label} — {formatDims(s.dims)}
                  </button>
                ))}
              </div>
            </fieldset>
          )}

          {activeStep === 'forma' && (
            <fieldset className="mb-6">
              <legend className="w-full">
                <p className="font-label uppercase tracking-wide text-xs text-graphite/50 mb-1">03 — Dale forma</p>
                <h2 className="font-heading font-bold text-2xl mb-6">Color</h2>
              </legend>
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

              {/* Marco: siempre Parota Nacional, sin selector (D8-D10, Product.jsx 14 ago 2026).
                  Swatch de color plano con el hex real de FRAME — no hay asset de foto de
                  Parota en el repo hoy; si Ale manda una foto real, reemplazar este div por
                  <img src="..." /> aquí. */}
              <div className="mt-6 flex items-center gap-3 p-3 rounded-[9px] bg-gallery-white">
                <div
                  className="w-12 h-12 rounded-[6px] shrink-0"
                  style={{ backgroundColor: FRAME.hex }}
                  aria-hidden="true"
                />
                <div>
                  <p className="font-label uppercase tracking-wide text-[10px] text-graphite/50">Marco</p>
                  <p className="font-heading font-bold text-sm">{FRAME.label}</p>
                </div>
              </div>
            </fieldset>
          )}

          {activeStep === 'preview' && location?.map_bounds && (
            <div className="mb-6 text-center">
              <p className="font-label uppercase tracking-wide text-xs text-graphite/50 mb-1">04 — Mira tu Relieve</p>
              <h2 className="font-heading font-bold text-2xl mb-6">Así se verá</h2>
              <TerrainPreview mapBounds={location.map_bounds} aspectRatio={aspectRatio} colorHex={selectedColor?.hex} />
            </div>
          )}

          {activeStep === 'historia' && (
            <div className="mb-6">
              <p className="font-label uppercase tracking-wide text-xs text-graphite/50 mb-1">05 — Hazlo tuyo</p>
              <label className="flex flex-col gap-1">
                <span className="font-heading font-bold text-2xl mb-1">¿Por qué este lugar?</span>
                <span className="text-sm text-graphite/60 mb-3">
                  Cuéntanos qué significa para ti. <span className="italic">Opcional</span>
                </span>
                <textarea
                  value={story}
                  maxLength={STORY_MAX_LENGTH}
                  onChange={(e) => setStory(e.target.value)}
                  placeholder="Ej. Aquí fue nuestro primer viaje juntos."
                  className="border border-line rounded px-3 py-2"
                />
              </label>
            </div>
          )}

          {activeStep === 'resumen' && (
            <div className="mb-6 bg-gallery-white rounded-[9px] p-6">
              <p className="font-label uppercase tracking-wide text-xs text-graphite/50 mb-1">06 — Tu Relieve</p>
              <h2 className="font-heading font-bold text-brand-dark text-2xl mb-4">Tu Relieve</h2>
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
              <p className="font-heading font-bold text-brand-dark text-2xl mb-1">
                {unitPriceCents != null ? `$${(unitPriceCents / 100).toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN` : '—'}
              </p>
              <p className="text-xs text-graphite/50 mb-4">Incluye personalización de ubicación.</p>
              <p className="text-sm text-graphite/70">Producción · {PRODUCTION_DAYS} días</p>
              <p className="text-sm text-graphite/70 mb-4">Envío gratis · {SHIPPING_DAYS} días después del envío</p>
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
        </div>
      )}

      <div className={`max-w-lg mx-auto px-8 ${isLastStep ? 'md:static sticky bottom-0 bg-gallery-white pt-4 pb-6 -mx-8 px-8 border-t border-line md:border-t-0 md:bg-transparent md:pb-0' : ''}`}>
        <StepProgress
          total={STEPS.length}
          current={currentStep}
          labels={STEP_LABELS}
          onBack={goBack}
          onContinue={goNext}
          isLast={isLastStep || hideGenericContinue}
          finalAction={
            !isLastStep ? null : (
            <button
              ref={buyBtnRef}
              type="button"
              onClick={handleBuy}
              disabled={!isComplete}
              className="pill-glass-active text-on-accent px-6 py-3 rounded-[9px] font-heading font-bold w-full disabled:opacity-40"
            >
              Comprar mi Relieve
            </button>
            )
          }
        />
      </div>

      {justAdded && (
        <div className="fixed inset-0 z-[200] bg-graphite/40 flex items-center justify-center p-4" onClick={() => setJustAdded(false)}>
          <div
            className="glass-card rounded-[9px] p-6 max-w-sm w-full text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-2xl mb-2">✓</p>
            <h3 className="font-heading font-bold text-xl mb-4">Relieve añadido al carrito</h3>
            <dl className="text-sm text-left space-y-1 mb-6">
              <div className="flex justify-between">
                <dt className="text-graphite/60">Ubicación</dt>
                <dd>{location?.formatted_address}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-graphite/60">Tamaño</dt>
                <dd>{formatDims(selectedSize?.dims)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-graphite/60">Color</dt>
                <dd>{selectedColor?.label}</dd>
              </div>
            </dl>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="pill-glass-active text-on-accent px-6 py-3 rounded-[9px] font-heading font-bold"
              >
                Ir al checkout
              </button>
              <button
                type="button"
                onClick={() => setJustAdded(false)}
                className="text-sm text-graphite/60 underline"
              >
                Seguir diseñando
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
