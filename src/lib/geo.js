// Utilidad pura de geometría para /personaliza — convierte el encuadre
// (map_bounds, el mismo shape que LocationPicker.jsx ya produce y que
// assertValidCustomLocation ya valida server-side) a métricas que un
// cliente entiende: km² reales, y una calidad de detalle basada en la
// resolución REAL y fija de la grilla de Elevation API (GRID_SIZE=22 en
// TerrainPreview.jsx — mantener sincronizado si ese valor cambia). No es
// un número de marketing inventado: más área encuadrada con el mismo
// número de muestras (22×22, fijo) significa cada muestra cubre más
// metros reales, y el relieve final pierde definición — esto solo
// traduce esa relación a una etiqueta legible.
// docs/superpowers/plans/2026-08-14-personaliza-rediseno.md Task 1.

const EARTH_RADIUS_M = 6371000;

function toRad(deg) {
  return (deg * Math.PI) / 180;
}

// Distancia haversine entre 2 puntos lat/lng, en metros. Suficiente para
// un encuadre de unos pocos km — no necesita precisión geodésica de
// nivel topográfico para esta UI (solo informa al cliente, nunca se usa
// para pricing ni se manda al servidor).
function haversineMeters(lat1, lng1, lat2, lng2) {
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_M * c;
}

// Ancho medido en la latitud central del encuadre (el ancho real en
// metros de un grado de longitud varía con la latitud — medir en el
// centro es la aproximación estándar para un rectángulo pequeño).
export function boundsWidthMeters(bounds) {
  const midLat = (bounds.north + bounds.south) / 2;
  return haversineMeters(midLat, bounds.west, midLat, bounds.east);
}

export function boundsHeightMeters(bounds) {
  return haversineMeters(bounds.north, bounds.west, bounds.south, bounds.west);
}

export function boundsAreaKm2(bounds) {
  const widthM = boundsWidthMeters(bounds);
  const heightM = boundsHeightMeters(bounds);
  return (widthM * heightM) / 1_000_000;
}

// El eje MÁS ANCHO de los dos, porque la calidad visual del relieve la
// limita el eje menos denso (si el encuadre es rectangular, no cuadrado).
export function metersPerElevationSample(bounds, gridSize = 22) {
  const widthM = boundsWidthMeters(bounds);
  const heightM = boundsHeightMeters(bounds);
  return Math.max(widthM, heightM) / (gridSize - 1);
}

// PROPUESTO — no confirmado por Ale, ajustar en preview si hace falta
// (mismo criterio que otros valores "a ojo" ya en el código, ej. el
// aclarado de sello-navy en dark mode, src/index.css). Basado en: por
// debajo de ~50m/muestra el relieve resuelve manzanas/edificios
// individuales con claridad; 50-150m sigue leyéndose bien pero pierde
// detalle fino; por arriba de 150m el relieve se ve borroso/genérico.
const QUALITY_THRESHOLDS_M = { excelente: 50, amplia: 150 };

export function detailQuality(bounds, gridSize = 22) {
  const mps = metersPerElevationSample(bounds, gridSize);
  if (mps < QUALITY_THRESHOLDS_M.excelente) return 'excelente';
  if (mps < QUALITY_THRESHOLDS_M.amplia) return 'amplia';
  return 'muy-amplia';
}
