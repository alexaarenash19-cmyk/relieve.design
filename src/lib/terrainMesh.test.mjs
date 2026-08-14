// src/lib/terrainMesh.test.mjs
// Run: node src/lib/terrainMesh.test.mjs
import assert from 'node:assert';
import { buildElevationGrid, normalizeElevations, heightmapToTextureData } from './terrainMesh.js';

// buildElevationGrid: 2x2 grid at the 4 corners of a known bounds box.
{
  const bounds = { north: 10, south: 0, east: 20, west: 0 };
  const grid = buildElevationGrid(bounds, 2);
  assert.strictEqual(grid.length, 4);
  assert.deepStrictEqual(grid[0], { lat: 10, lng: 0 });   // NW
  assert.deepStrictEqual(grid[1], { lat: 10, lng: 20 });  // NE
  assert.deepStrictEqual(grid[2], { lat: 0, lng: 0 });    // SW
  assert.deepStrictEqual(grid[3], { lat: 0, lng: 20 });   // SE
}

// normalizeElevations: min->0, max->1, linear in between.
{
  const normalized = normalizeElevations([100, 150, 200]);
  assert.strictEqual(normalized[0], 0);
  assert.strictEqual(normalized[1], 0.5);
  assert.strictEqual(normalized[2], 1);
}

// normalizeElevations: flat terrain (min === max) doesn't divide by zero.
{
  const normalized = normalizeElevations([500, 500, 500]);
  assert.deepStrictEqual(normalized, [0.5, 0.5, 0.5]);
}

// heightmapToTextureData: 2x2 grid -> 16 bytes (4 pixels * RGBA), grayscale
// (R=G=B), alpha always opaque.
{
  const data = heightmapToTextureData([0, 0.5, 1, 1], 2);
  assert.strictEqual(data.length, 16);
  assert.deepStrictEqual([...data.slice(0, 4)], [0, 0, 0, 255]);
  assert.deepStrictEqual([...data.slice(4, 8)], [128, 128, 128, 255]);
  assert.deepStrictEqual([...data.slice(8, 12)], [255, 255, 255, 255]);
}

console.log('terrainMesh.test.mjs: all assertions passed');
