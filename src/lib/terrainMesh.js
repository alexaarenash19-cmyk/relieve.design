// Helpers puros para TerrainPreview.jsx — separados del componente para que
// la parte matemática (armar la grilla de consulta a Google Elevation API,
// normalizar las elevaciones crudas a un heightmap 0..1) sea testeable sin
// un contexto WebGL ni una llamada real a la API. docs/superpowers/specs/
// 2026-08-13-personaliza-checkout-design.md sección 2.

// Google Elevation API's `locations` param espera una lista plana de
// {lat, lng}. Grilla row-major, north -> south, west -> east — mismo orden
// que heightmapToTextureData espera recibir de vuelta.
export function buildElevationGrid(mapBounds, gridSize = 32) {
  const { north, south, east, west } = mapBounds;
  const points = [];
  for (let row = 0; row < gridSize; row++) {
    const lat = north - (row / (gridSize - 1)) * (north - south);
    for (let col = 0; col < gridSize; col++) {
      const lng = west + (col / (gridSize - 1)) * (east - west);
      points.push({ lat, lng });
    }
  }
  return points;
}

// Normaliza metros de elevación cruda (Google Elevation API's
// results[].elevation, en el mismo orden row-major que buildElevationGrid
// generó) a 0..1 para usarse como displacement/heightmap. Terreno
// perfectamente plano (min === max) normaliza a 0.5 parejo en vez de
// dividir entre cero.
export function normalizeElevations(elevations) {
  const min = Math.min(...elevations);
  const max = Math.max(...elevations);
  if (max === min) return elevations.map(() => 0.5);
  return elevations.map((e) => (e - min) / (max - min));
}

// Empaca un heightmap normalizado 0..1 (row-major, gridSize×gridSize) en un
// Uint8Array RGBA para THREE.DataTexture — mismo valor en los 3 canales de
// color para que funcione como displacementMap sin importar qué canal
// muestree Three.js.
export function heightmapToTextureData(normalized, gridSize) {
  const data = new Uint8Array(gridSize * gridSize * 4);
  for (let i = 0; i < normalized.length; i++) {
    const v = Math.round(normalized[i] * 255);
    data[i * 4] = v;
    data[i * 4 + 1] = v;
    data[i * 4 + 2] = v;
    data[i * 4 + 3] = 255;
  }
  return data;
}
