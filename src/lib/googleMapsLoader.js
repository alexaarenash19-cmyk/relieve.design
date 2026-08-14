// Google Maps JS API se carga una sola vez por sesión de navegador —
// LocationPicker.jsx (búsqueda + mapa) y TerrainPreview.jsx (Elevation vía
// google.maps.ElevationService) comparten la misma carga en vez de cada
// uno inyectar su propio <script>. libraries=places,elevation trae los dos
// paquetes que este feature necesita en una sola descarga.
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
      reject(new Error('VITE_GOOGLE_MAPS_API_KEY no está configurada.'));
      return;
    }
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,elevation&v=weekly`;
    script.async = true;
    script.onload = () => resolve(window.google.maps);
    script.onerror = () => reject(new Error('No pudimos cargar Google Maps.'));
    document.head.appendChild(script);
  });

  return loadPromise;
}
