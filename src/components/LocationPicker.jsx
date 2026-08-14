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
import { useEffect, useRef, useState } from 'react';
import { loadGoogleMaps } from '../lib/googleMapsLoader.js';

const DEFAULT_CENTER = { lat: 19.4326, lng: -99.1332 }; // Ciudad de México
const DEFAULT_ZOOM = 5;

export default function LocationPicker({ aspectRatio, onConfirm }) {
  const mapDivRef = useRef(null);
  const searchDivRef = useRef(null);
  const frameRef = useRef(null);
  const mapRef = useRef(null);
  const overlayRef = useRef(null);
  const selectedPlaceRef = useRef(null);

  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [hasFramed, setHasFramed] = useState(false);

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
          map.setCenter(place.location);
          if (place.viewport) map.fitBounds(place.viewport);
        });

        maps.event.addListenerOnce(map, 'idle', () => {
          if (!cancelled) {
            setReady(true);
            setHasFramed(true); // el centro/zoom inicial ya es un encuadre válido
          }
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

  if (loadError) {
    return <p className="text-sm text-graphite/70">{loadError}</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div ref={searchDivRef} className="[&_gmp-place-autocomplete]:w-full" />
      <div className="relative w-full max-w-lg mx-auto" style={{ aspectRatio: '4/3' }}>
        <div ref={mapDivRef} className="absolute inset-0 rounded-[9px] overflow-hidden" />
        {/* Marco de encuadre fijo — no se mueve, el mapa se mueve debajo. */}
        <div
          ref={frameRef}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border-2 border-gallery-white shadow-[0_0_0_9999px_rgba(0,0,0,0.35)] pointer-events-none"
          style={{ aspectRatio, width: aspectRatio === '3/2' ? '80%' : '60%' }}
        />
      </div>
      <button
        type="button"
        onClick={handleConfirm}
        disabled={!ready || !hasFramed}
        className="pill-glass-active text-gallery-white px-6 py-3 rounded-[9px] font-heading font-bold disabled:opacity-40"
      >
        Confirmar ubicación
      </button>
    </div>
  );
}
