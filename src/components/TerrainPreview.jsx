// docs/superpowers/specs/2026-08-13-personaliza-checkout-design.md sección 2.
// Terreno real (no un efecto simulado): Google Elevation API sobre una
// grilla dentro de map_bounds -> heightmap -> displacementMap de Three.js
// sobre un plano. Material mate, coloreado según blanco/negro mate
// elegido — mismo lenguaje "acabado mate" del resto de la marca.
//
// Cache por mapBounds redondeados a 4 decimales (~11m de precisión, de
// sobra para esta grilla) — evita volver a llamar Elevation API si el
// cliente regresa a ajustar el encuadre sin cambiar de lugar.
import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import { loadGoogleMaps } from '../lib/googleMapsLoader.js';
import { buildElevationGrid, normalizeElevations, heightmapToTextureData } from '../lib/terrainMesh.js';

const GRID_SIZE = 32;
const elevationCache = new Map();

function cacheKey(mapBounds) {
  const r = (n) => n.toFixed(4);
  return `${r(mapBounds.north)},${r(mapBounds.south)},${r(mapBounds.east)},${r(mapBounds.west)}`;
}

async function fetchHeightmapTexture(mapBounds) {
  const key = cacheKey(mapBounds);
  if (elevationCache.has(key)) return elevationCache.get(key);

  const maps = await loadGoogleMaps();
  const elevationService = new maps.ElevationService();
  const grid = buildElevationGrid(mapBounds, GRID_SIZE);

  const response = await new Promise((resolve, reject) => {
    elevationService.getElevationForLocations({ locations: grid }, (results, status) => {
      if (status !== 'OK' || !results) {
        reject(new Error(`Elevation API failed: ${status}`));
        return;
      }
      resolve(results);
    });
  });

  const elevations = response.map((r) => r.elevation);
  const normalized = normalizeElevations(elevations);
  const textureData = heightmapToTextureData(normalized, GRID_SIZE);

  const texture = new THREE.DataTexture(textureData, GRID_SIZE, GRID_SIZE, THREE.RGBAFormat);
  texture.needsUpdate = true;

  elevationCache.set(key, texture);
  return texture;
}

function TerrainMesh({ mapBounds, aspectRatio, colorHex }) {
  const [texture, setTexture] = useState(null);
  const cancelledRef = useRef(false);

  useEffect(() => {
    cancelledRef.current = false;
    setTexture(null);
    fetchHeightmapTexture(mapBounds)
      .then((tex) => {
        if (!cancelledRef.current) setTexture(tex);
      })
      .catch(() => {
        // Fail quiet — TerrainPreview's parent shows the "sin preview
        // disponible" fallback below when texture stays null.
      });
    return () => {
      cancelledRef.current = true;
    };
  }, [mapBounds]);

  const [width, height] = aspectRatio === '3/2' ? [3, 2] : [1, 1];

  if (!texture) return null;

  return (
    <mesh rotation={[-Math.PI / 2.5, 0, 0]}>
      <planeGeometry args={[width, height, GRID_SIZE - 1, GRID_SIZE - 1]} />
      <meshStandardMaterial
        color={colorHex}
        displacementMap={texture}
        displacementScale={0.3}
        roughness={0.9}
        metalness={0}
      />
    </mesh>
  );
}

export default function TerrainPreview({ mapBounds, aspectRatio, colorHex }) {
  const memoBounds = useMemo(() => mapBounds, [
    mapBounds.north,
    mapBounds.south,
    mapBounds.east,
    mapBounds.west,
  ]);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="w-full max-w-md" style={{ aspectRatio }}>
        <Canvas camera={{ position: [0, 1.4, 1.8], fov: 45 }}>
          <ambientLight intensity={0.6} />
          <directionalLight position={[2, 3, 2]} intensity={1.2} />
          <TerrainMesh mapBounds={memoBounds} aspectRatio={aspectRatio} colorHex={colorHex} />
        </Canvas>
      </div>
      <p className="font-label uppercase tracking-wide text-xs text-graphite/50">
        Vista previa generada de tu terreno.
      </p>
    </div>
  );
}
