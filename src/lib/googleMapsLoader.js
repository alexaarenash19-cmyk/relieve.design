// Google Maps JS API se carga una sola vez por sesión de navegador —
// LocationPicker.jsx (búsqueda + mapa) y TerrainPreview.jsx (Elevation vía
// google.maps.ElevationService) comparten la misma carga en vez de cada
// uno inyectar su propio <script>. libraries=places,elevation trae los dos
// paquetes que este feature necesita en una sola descarga.
import { getTrustedTypesPolicy } from './trustedTypesPolicy.js';

let loadPromise = null;

export function loadGoogleMaps() {
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    if (window.google?.maps) {
      resolve(window.google.maps);
      return;
    }
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      // Final whole-branch review finding #7 — without resetting
      // loadPromise here, loadGoogleMaps() would return this same
      // rejected promise forever for the rest of the session, making
      // /personaliza permanently unusable after one failure until a full
      // page reload.
      loadPromise = null;
      reject(new Error('VITE_GOOGLE_MAPS_API_KEY no está configurada.'));
      return;
    }
    const script = document.createElement('script');
    const url = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,elevation&v=weekly`;
    const ttPolicy = getTrustedTypesPolicy();
    script.src = ttPolicy ? ttPolicy.createScriptURL(url) : url;
    script.async = true;
    script.onload = () => resolve(window.google.maps);
    script.onerror = () => {
      // Same reasoning as the missing-API-key reject above — a transient
      // network failure shouldn't poison every future call this session.
      loadPromise = null;
      reject(new Error('No pudimos cargar Google Maps.'));
    };
    document.head.appendChild(script);
  });

  return loadPromise;
}
