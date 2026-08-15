// src/lib/geo.test.mjs
// Run: node src/lib/geo.test.mjs
import assert from 'node:assert';
import {
  boundsWidthMeters,
  boundsHeightMeters,
  boundsAreaKm2,
  metersPerElevationSample,
  detailQuality,
} from './geo.js';

// Encuadre real de referencia: ~1km × ~1km alrededor del centro de CDMX
// (north/south separados por ~0.009° de latitud ≈ 1km; east/west
// ajustado a la misma distancia real en esa latitud vía cos(lat)).
const oneKmBounds = { north: 19.4371, south: 19.4281, east: -99.1284, west: -99.1380 };

{
  const w = boundsWidthMeters(oneKmBounds);
  const h = boundsHeightMeters(oneKmBounds);
  // Tolerancia amplia (±15%) — haversine sobre un rectángulo pequeño,
  // no necesita precisión geodésica exacta para esta UI.
  assert.ok(Math.abs(w - 1000) < 150, `ancho esperado ~1000m, dio ${w}`);
  assert.ok(Math.abs(h - 1000) < 150, `alto esperado ~1000m, dio ${h}`);
}

{
  const area = boundsAreaKm2(oneKmBounds);
  assert.ok(Math.abs(area - 1) < 0.3, `área esperada ~1km², dio ${area}`);
}

{
  // 1000m de lado / 21 intervalos (gridSize 22) ≈ 47.6 m/muestra
  const mps = metersPerElevationSample(oneKmBounds, 22);
  assert.ok(Math.abs(mps - 47.6) < 10, `metros/muestra esperado ~47.6, dio ${mps}`);
  assert.strictEqual(detailQuality(oneKmBounds, 22), 'excelente');
}

{
  // Encuadre grande: ~5km de lado -> ~238 m/muestra -> muy-amplia
  const bigBounds = { north: 19.460, south: 19.415, east: -99.110, west: -99.155 };
  const mps = metersPerElevationSample(bigBounds, 22);
  assert.ok(mps > 150, `metros/muestra esperado >150, dio ${mps}`);
  assert.strictEqual(detailQuality(bigBounds, 22), 'muy-amplia');
}

{
  // Encuadre medio: ~2km de lado -> ~95 m/muestra -> amplia
  const midBounds = { north: 19.4416, south: 19.4236, east: -99.1188, west: -99.1476 };
  const quality = detailQuality(midBounds, 22);
  assert.strictEqual(quality, 'amplia');
}

console.log('geo.test.mjs: all assertions passed');
