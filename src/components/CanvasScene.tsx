import React, { useRef, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';
import { HovercraftModel } from './HovercraftModel';
import { OceanModel } from './OceanModel';
import { SprayParticles } from './SprayParticles';
import { CameraController } from './CameraController';
import { MuzzleProjectiles } from './MuzzleProjectiles';
import { CamoType, SpeedMode, CameraPreset } from '../types';

interface CanvasSceneProps {
  isEngineRunning: boolean;
  speedMode: SpeedMode;
  isWireframe: boolean;
  camo: CamoType;
  cameraPreset: CameraPreset;
  resetSignal: number;
  fireSignal: number;
  gunAim: { azimuth: number; elevation: number };
  onMeshStatsLoaded: (triangles: number, vertices: number) => void;
  onBearingUpdate: (bearing: number) => void;
  onGunAimUpdate?: (azimuthDeg: number, elevationDeg: number) => void;
}

// Scene inner component to monitor camera azimuthal angle for compass bearing
const BearingTracker: React.FC<{
  controlsRef: React.RefObject<OrbitControlsImpl | null>;
  onBearingUpdate: (bearing: number) => void;
}> = ({ controlsRef, onBearingUpdate }) => {
  const lastBearingRef = useRef(-1);

  useFrame(() => {
    if (!controlsRef.current) return;
    const azimuth = controlsRef.current.getAzimuthalAngle();
    const deg = Math.round((azimuth * (180 / Math.PI) + 360) % 360);
    if (deg !== lastBearingRef.current) {
      lastBearingRef.current = deg;
      onBearingUpdate(deg);
    }
  });

  return null;
};

export const CanvasScene: React.FC<CanvasSceneProps> = ({
  isEngineRunning,
  speedMode,
  isWireframe,
  camo,
  cameraPreset,
  resetSignal,
  fireSignal,
  gunAim,
  onMeshStatsLoaded,
  onBearingUpdate,
  onGunAimUpdate,
}) => {
  const controlsRef = useRef<OrbitControlsImpl | null>(null);

  return (
    <div className="w-full h-full absolute inset-0 bg-[#05080e]">
      <Canvas
        camera={{ position: [24, 14, 28], fov: 42, near: 0.1, far: 350 }}
        shadows
        gl={{
          antialias: true,
          powerPreference: 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.15,
        }}
      >
        {/* Dark abyss background color */}
        <color attach="background" args={['#05080e']} />

        {/* Subtle depth fog matching background abyss */}
        <fog attach="fog" args={['#05080e', 40, 160]} />

        {/* Photorealistic PBR Environment reflections */}
        <Environment preset="sunset" />

        {/* Studio Ambient illumination */}
        <ambientLight intensity={1.2} color="#cbd5e1" />

        {/* Key Directional Sun Spotlight */}
        <directionalLight
          position={[30, 38, 20]}
          intensity={2.8}
          color="#fffbeb"
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-near={0.5}
          shadow-camera-far={120}
          shadow-camera-left={-20}
          shadow-camera-right={20}
          shadow-camera-top={20}
          shadow-camera-bottom={-20}
          shadow-bias={-0.00015}
        />

        {/* Ocean Surface Upward Bounce Fill Light */}
        <directionalLight
          position={[0, -12, 4]}
          intensity={1.0}
          color="#38bdf8"
        />

        {/* Soft Cyan & Amber Tactical Highlights */}
        <spotLight
          position={[-22, 14, 18]}
          intensity={3.8}
          color="#5EEAD4"
          angle={0.65}
          penumbra={0.8}
          distance={65}
        />

        <spotLight
          position={[20, 12, -22]}
          intensity={3.6}
          color="#F59E0B"
          angle={0.65}
          penumbra={0.85}
          distance={60}
        />

        {/* Exactly ONE Hovercraft and ONE Ocean instance */}
        <Suspense fallback={null}>
          <HovercraftModel
            isEngineRunning={isEngineRunning}
            speedMode={speedMode}
            isWireframe={isWireframe}
            camo={camo}
            onMeshStatsLoaded={onMeshStatsLoaded}
            onGunAimUpdate={onGunAimUpdate}
          />
          <OceanModel
            isEngineRunning={isEngineRunning}
            speedMode={speedMode}
          />
          <SprayParticles
            isEngineRunning={isEngineRunning}
            speedMode={speedMode}
          />
          <MuzzleProjectiles
            fireSignal={fireSignal}
            gunAim={gunAim}
          />
        </Suspense>

        {/* Orbit Controls with buttery smooth damping and distance constraints */}
        <OrbitControls
          ref={controlsRef}
          target={[0, 1.2, 0]}
          enableDamping={true}
          dampingFactor={0.05}
          minDistance={8}
          maxDistance={70}
          maxPolarAngle={Math.PI / 2 - 0.05} // Prevent camera clipping below water level
          enablePan={false}
        />

        <CameraController
          preset={cameraPreset}
          controlsRef={controlsRef}
          resetSignal={resetSignal}
        />

        <BearingTracker
          controlsRef={controlsRef}
          onBearingUpdate={onBearingUpdate}
        />
      </Canvas>
    </div>
  );
};
