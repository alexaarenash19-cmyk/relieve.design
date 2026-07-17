// Issue #44 — R3F base scene. Issues #46/#78-81 — the 8 storyboard stages,
// driven by scroll progress (0-1) from HeroScrollContext via allStageProgress.
// transform/opacity + a few material props only, per #46's perf requirement.
// Real GLB (Draco) is pending; useGLTF below already loads+decodes Draco GLBs
// the moment a place has model_url — placeholder primitives stand in until then.
// Checkpoint 4 — dropped its own wrapping container/background: the parent
// (HeroSection) now owns the aspect-video box and layers the aerial photo
// behind this, so no more solid dark-bg rectangle in the hero.
import { Suspense, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Stage, useGLTF } from '@react-three/drei';
import { allStageProgress, lerp } from '../lib/heroStages.js';

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

const AERIAL_COLOR = '#b9ccd8'; // --explorer-blue — reads as an aerial photo tint
const PRINTED_COLOR = '#f6f3ed'; // --gallery-white — the 3D-printed relief (no dedicated "printed white" token exists)

// Stage 5: frame bars slide in from outside to the four edges of the block.
const FRAME_BARS = [
  { key: 'top', size: [2, 0.15, 0.2], from: [0, 0, -3], to: [0, 0, -0.9] },
  { key: 'bottom', size: [2, 0.15, 0.2], from: [0, 0, 3], to: [0, 0, 0.9] },
  { key: 'left', size: [0.2, 0.15, 2], from: [-3, 0, 0], to: [-0.9, 0, 0] },
  { key: 'right', size: [0.2, 0.15, 2], from: [3, 0, 0], to: [0.9, 0, 0] },
];

function PlaceholderBlock({ stages }) {
  const [, , s3, s4, s5] = stages; // stage indices are 0-based (stage 3 = index 2, etc.)
  // Stages 3-4: aerial tint -> matte white. A hard swap at the midpoint (not a
  // color lerp) — good enough for a placeholder box, real material crossfade
  // is for when the real GLB + textures land.
  const revealT = Math.max(s3, s4);
  const color = revealT > 0.5 ? PRINTED_COLOR : AERIAL_COLOR;
  const frameT = s5;

  return (
    <group>
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[1.6, 0.5, 1.6]} />
        <meshStandardMaterial color={color} roughness={0.9} />
      </mesh>
      {FRAME_BARS.map((bar) => (
        <mesh
          key={bar.key}
          position={[
            lerp(bar.from[0], bar.to[0], frameT),
            lerp(bar.from[1], bar.to[1], frameT),
            lerp(bar.from[2], bar.to[2], frameT),
          ]}
        >
          <boxGeometry args={bar.size} />
          <meshStandardMaterial color="#7a5a43" roughness={0.6} metalness={0.05} /> {/* --walnut */}
        </mesh>
      ))}
    </group>
  );
}

function turnDegrees(stages) {
  const [, , , , , s6, s7] = stages;
  return 55 * (s6 - s7); // rises during stage 6, returns to 0 during stage 7 — never the back
}

function CameraRig({ stages }) {
  const cameraT = Math.max(stages[2], stages[3]); // stages 3-4: aerial -> studio framing
  const pullBack = stages[7]; // stage 8: descend/pull back to unpin
  const turnRad = (turnDegrees(stages) * Math.PI) / 180;

  const aerial = [0, 4, 0.05];
  const studio = [3, 2, 3];
  const x = lerp(aerial[0], studio[0], cameraT);
  const y = lerp(aerial[1], studio[1], cameraT);
  const z = lerp(aerial[2], studio[2], cameraT);

  const turnedX = x * Math.cos(turnRad) + z * Math.sin(turnRad);
  const turnedZ = -x * Math.sin(turnRad) + z * Math.cos(turnRad);
  const scale = 1 + pullBack * 0.8;

  return { position: [turnedX * scale, y * scale, turnedZ * scale] };
}

export default function HeroScene({ modelUrl = null, className = '', progress = 0 }) {
  const [webglOk] = useState(hasWebGL);

  if (!webglOk) {
    return (
      <div
        className={`absolute inset-0 flex items-center justify-center font-label uppercase tracking-wide text-xs text-graphite bg-gallery-white/70 ${className}`}
      >
        Vista previa 3D no disponible en este navegador
      </div>
    );
  }

  const stages = allStageProgress(progress);
  const camera = CameraRig({ stages });
  const lightIntensity = lerp(0.2, 0.6, Math.max(stages[2], stages[3]));
  const opacity = 1 - stages[7];

  return (
    <div className={`absolute inset-0 ${className}`} style={{ opacity }}>
      <CropBoxOverlay stageT={stages[1]} />
      <Canvas camera={{ position: camera.position, fov: 35 }}>
        <Suspense fallback={null}>
          {/* "studio" per ui-ux.md fotografía: acabado mate, fondo neutro, una
              sola fuente de luz. "city" was casting a warm/orange tint that
              shifted the walnut frame toward pink/terracotta. */}
          <Stage environment="studio" intensity={lightIntensity} shadows="contact">
            {modelUrl ? <CityModel modelUrl={modelUrl} /> : <PlaceholderBlock stages={stages} />}
          </Stage>
        </Suspense>
      </Canvas>
    </div>
  );
}

// Stage 2 — a line draws the crop box around the section to be printed.
function CropBoxOverlay({ stageT }) {
  if (stageT <= 0) return null;
  const w = 300;
  const h = 200;
  const perimeter = 2 * (w + h);

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      viewBox={`0 0 ${w + 40} ${h + 40}`}
      aria-hidden="true"
    >
      <rect
        x="20"
        y="20"
        width={w}
        height={h}
        fill="none"
        stroke="#232323" /* --graphite — reads on the photo now, not a dark bg */
        strokeWidth="2"
        strokeDasharray={perimeter}
        strokeDashoffset={perimeter * (1 - stageT)}
      />
    </svg>
  );
}
