// docs/superpowers/specs/2026-08-13-personaliza-checkout-design.md sección 1.
// Búsqueda (Places) + mapa interactivo, con un marco de encuadre FIJO
// (no se mueve/redimensiona) cuya proporción viene del tamaño ya elegido
// en el paso anterior del wizard — el usuario mueve el MAPA por debajo del
// marco, como encuadrar una foto de perfil, nunca al revés.
//
// map_bounds no se calcula desde map.getBounds() (esos son los bounds de
// TODO el div del mapa, no solo del área dentro del marco) — se calcula
// proyectando las 2 esquinas del marco (en píxeles, relativas al div del
// mapa) a lat/lng reales vía la Projection del mapa. Un OverlayView vacío
// es la única forma que expone esa Projection en la API de Google Maps.
import { useEffect, useMemo, useRef, useState } from 'react';
import { loadGoogleMaps } from '../lib/googleMapsLoader.js';
import { boundsAreaKm2, boundsWidthMeters, boundsHeightMeters, detailQuality } from '../lib/geo.js';

const DEFAULT_CENTER = { lat: 19.4326, lng: -99.1332 }; // Ciudad de México
const DEFAULT_ZOOM = 5;

const QUALITY_COPY = {
  excelente: { emoji: '🟢', label: 'Excelente', detail: 'Esta zona tiene suficiente detalle para un relieve definido.' },
  amplia: { emoji: '🟡', label: 'Amplia', detail: 'Acerca el mapa para obtener mayor detalle.' },
  'muy-amplia': { emoji: '🔴', label: 'Demasiado amplia', detail: 'Esta zona no tendrá suficiente detalle. Acerca el mapa.' },
};

export default function LocationPicker({ aspectRatio, sizeLabel, onConfirm }) {
  const mapDivRef = useRef(null);
  const searchDivRef = useRef(null);
  const frameRef = useRef(null);
  const mapRef = useRef(null);
  const overlayRef = useRef(null);
  const selectedPlaceRef = useRef(null);

  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [hasFramed, setHasFramed] = useState(false);
  const [hasPlace, setHasPlace] = useState(false);
  const [liveBounds, setLiveBounds] = useState(null);

  useEffect(() => {
    let cancelled = false;

    loadGoogleMaps()
      .then((maps) => {
        if (cancelled) return;

        const map = new maps.Map(mapDivRef.current, {
          center: DEFAULT_CENTER,
          zoom: DEFAULT_ZOOM,
          disableDefaultUI: true,
          gestureHandling: 'greedy',
        });
        mapRef.current = map;

        // OverlayView vacío — su único propósito es exponer getProjection()
        // una vez que el mapa termina su primer render (evento 'idle').
        class ProjectionOverlay extends maps.OverlayView {
          onAdd() {}
          draw() {}
          onRemove() {}
        }
        const overlay = new ProjectionOverlay();
        overlay.setMap(map);
        overlayRef.current = overlay;

        const autocomplete = new maps.places.PlaceAutocompleteElement();
        searchDivRef.current.appendChild(autocomplete);
        autocomplete.addEventListener('gmp-select', async ({ placePrediction }) => {
          const place = placePrediction.toPlace();
          await place.fetchFields({ fields: ['id', 'formattedAddress', 'location', 'viewport'] });
          selectedPlaceRef.current = {
            place_id: place.id,
            formatted_address: place.formattedAddress,
          };
          setHasPlace(true);
          map.setCenter(place.location);
          if (place.viewport) map.fitBounds(place.viewport);
        });

        maps.event.addListener(map, 'idle', () => {
          if (cancelled) return;
          setReady(true);
          setHasFramed(true); // el centro/zoom inicial ya es un encuadre válido
          const bounds = frameCornersToLatLng(maps, map, overlay);
          setLiveBounds(bounds);
        });
      })
      .catch((err) => setLoadError(err.message));

    return () => {
      cancelled = true;
    };
  }, []);

  function frameCornersToLatLng(maps, map, overlay) {
    const mapDiv = mapDivRef.current;
    const frameEl = frameRef.current;
    const mapRect = mapDiv.getBoundingClientRect();
    const frameRect = frameEl.getBoundingClientRect();

    const projection = overlay.getProjection();
    const nwPixel = new maps.Point(frameRect.left - mapRect.left, frameRect.top - mapRect.top);
    const sePixel = new maps.Point(frameRect.right - mapRect.left, frameRect.bottom - mapRect.top);

    const nw = projection.fromContainerPixelToLatLng(nwPixel);
    const se = projection.fromContainerPixelToLatLng(sePixel);

    return {
      north: nw.lat(),
      west: nw.lng(),
      south: se.lat(),
      east: se.lng(),
    };
  }

  async function handleConfirm() {
    if (!selectedPlaceRef.current) return; // sin lugar seleccionado no hay nada que confirmar

    const maps = window.google.maps;
    const map = mapRef.current;
    const overlay = overlayRef.current;
    const center = map.getCenter();
    const bounds = frameCornersToLatLng(maps, map, overlay);

    onConfirm({
      place_id: selectedPlaceRef.current?.place_id ?? null,
      formatted_address: selectedPlaceRef.current?.formatted_address ?? null,
      latitude: center.lat(),
      longitude: center.lng(),
      zoom: map.getZoom(),
      map_bounds: bounds,
    });
  }

  const areaInfo = useMemo(() => {
    if (!liveBounds) return null;
    const areaKm2 = boundsAreaKm2(liveBounds);
    const widthKm = boundsWidthMeters(liveBounds) / 1000;
    const heightKm = boundsHeightMeters(liveBounds) / 1000;
    return { areaKm2, widthKm, heightKm, quality: detailQuality(liveBounds) };
  }, [liveBounds]);

  return (
    <div className="relative w-full">
      {loadError ? (
        <p className="text-sm text-graphite/70 p-8 text-center">{loadError}</p>
      ) : (
        <>
          {/* Buscador flotante SOBRE el mapa, no antes — apilado con z-index,
              mismo criterio visual que .pill-glass (fondo translúcido) para
              que se lea como parte del mapa, no como un input de formulario
              aparte. */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 w-[min(90%,32rem)]">
            <div
              ref={searchDivRef}
              className="glass-card rounded-full px-2 py-1 [&_gmp-place-autocomplete]:w-full"
            />
          </div>

          {/* Mapa full-bleed — 80vh en vez de max-w-lg + aspect-ratio 4/3.
              El marco (frameRef) sigue siendo un elemento aparte encima,
              centrado, con la proporción del tamaño elegido — sin cambios
              en frameCornersToLatLng ni en cómo se calcula. */}
          <div className="relative w-full h-[70vh] md:h-[80vh] min-h-[360px] md:min-h-[420px] max-h-[900px]">
            <div ref={mapDivRef} className="absolute inset-0 rounded-[9px] overflow-hidden" />
            <div
              ref={frameRef}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border-2 border-gallery-white shadow-[0_0_0_9999px_rgba(0,0,0,0.35)] pointer-events-none flex items-center justify-center"
              style={{ aspectRatio, width: aspectRatio === '3/2' ? '70%' : '46%' }}
            >
              <span className="font-label uppercase tracking-wide text-[11px] text-gallery-white/80">
                Área a relieve
              </span>
            </div>

            {areaInfo && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 glass-card rounded-[9px] px-4 py-2 text-center">
                <p className="font-label uppercase tracking-wide text-[11px] text-graphite/70">
                  Área seleccionada · {areaInfo.widthKm.toFixed(2)} × {areaInfo.heightKm.toFixed(2)} km
                </p>
                <p className="text-xs mt-0.5">
                  {QUALITY_COPY[areaInfo.quality].emoji} {QUALITY_COPY[areaInfo.quality].label}
                  {' — '}
                  <span className="text-graphite/60">{QUALITY_COPY[areaInfo.quality].detail}</span>
                </p>
              </div>
            )}
          </div>

          <div className="flex flex-col items-center gap-2 mt-4">
            {sizeLabel && (
              <p className="font-label uppercase tracking-wide text-xs text-graphite/50">
                Tamaño: {sizeLabel}
              </p>
            )}
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!ready || !hasFramed || !hasPlace || areaInfo?.quality === 'muy-amplia'}
              className="pill-glass-active text-on-accent px-8 py-3 rounded-[9px] font-heading font-bold disabled:opacity-40"
            >
              Ver mi Relieve →
            </button>
            {ready && !hasPlace && (
              <p className="text-sm text-graphite/70">Busca tu ubicación primero.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
