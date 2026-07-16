// Issue #44 — R3F base scene: placeholder city+frame model, studio lighting,
// matte white / walnut materials, static fallback when WebGL is unavailable.
// Real GLB (Draco) is pending (decisions.md — GLB real is pendiente, no bloquea);
// useGLTF below already loads+decodes Draco GLBs the moment a place has model_url.
import { Suspense, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Stage, useGLTF } from '@react-three/drei';

function hasWebGL() {
  try {
    const canvas = document.createElement('canvas');
    return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
  } catch {
    return false;
  }
}

function CityModel({ modelUrl }) {
  const { scene } = useGLTF(modelUrl, true); // true = use drei's bundled Draco decoder
  return <primitive object={scene} />;
}

function PlaceholderBlock() {
  return (
    <group>
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[1.6, 0.5, 1.6]} />
        <meshStandardMaterial color="#f2f0ec" roughness={0.9} metalness={0} />
      </mesh>
      <mesh>
        <boxGeometry args={[2, 0.15, 2]} />
        <meshStandardMaterial color="#7a5a43" roughness={0.6} metalness={0.05} />
      </mesh>
    </group>
  );
}

export default function HeroScene({ modelUrl = null, className = '' }) {
  const [webglOk] = useState(hasWebGL);

  if (!webglOk) {
    return (
      <div
        className={`aspect-video bg-bg-dark text-text-dark flex items-center justify-center font-label uppercase tracking-wide text-xs ${className}`}
      >
        Vista previa 3D no disponible en este navegador
      </div>
    );
  }

  return (
    <div className={`aspect-video bg-bg-dark ${className}`}>
      <Canvas camera={{ position: [3, 2, 3], fov: 35 }}>
        <Suspense fallback={null}>
          <Stage environment="city" intensity={0.6} shadows="contact">
            {modelUrl ? <CityModel modelUrl={modelUrl} /> : <PlaceholderBlock />}
          </Stage>
        </Suspense>
      </Canvas>
    </div>
  );
}
