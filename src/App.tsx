import { useState, useCallback, Suspense, useEffect } from 'react';
import { CanvasScene } from './components/CanvasScene';
import { TelemetryHUD } from './components/TelemetryHUD';
import { useHovercraftAudio } from './hooks/useHovercraftAudio';
import { CamoType, SpeedMode, CameraPreset } from './types';

export function App() {
  const [isEngineRunning, setIsEngineRunning] = useState(true);
  const [speedMode, setSpeedMode] = useState<SpeedMode>(1.0);
  const [isMuted, setIsMuted] = useState(false);
  const [isWireframe, setIsWireframe] = useState(false);
  const [camo, setCamo] = useState<CamoType>('slate');
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('orbit');
  const [resetSignal, setResetSignal] = useState(0);

  // Dynamic telemetry from scene
  const [bearing, setBearing] = useState(42);
  const [trianglesCount, setTrianglesCount] = useState(0);
  const [verticesCount, setVerticesCount] = useState(0);
  const [gunAim, setGunAim] = useState({ azimuth: 0, elevation: 0 });
  const [fireSignal, setFireSignal] = useState(0);

  // Zero-asset procedural Web Audio Engine
  const { initAudio, playClick, playGunBurst } = useHovercraftAudio({
    isMuted,
    isEngineRunning,
    speedMode,
  });

  const handleToggleEngine = useCallback(() => {
    initAudio();
    setIsEngineRunning((prev) => !prev);
  }, [initAudio]);

  const handleToggleMute = useCallback(() => {
    initAudio();
    setIsMuted((prev) => !prev);
  }, [initAudio]);

  const handleResetCamera = useCallback(() => {
    setCameraPreset('orbit');
    setResetSignal((s) => s + 1);
  }, []);

  const handleMeshStatsLoaded = useCallback((triangles: number, vertices: number) => {
    setTrianglesCount(triangles);
    setVerticesCount(vertices);
  }, []);

  const handleGunAimUpdate = useCallback((azimuth: number, elevation: number) => {
    setGunAim({ azimuth, elevation });
  }, []);

  const handleFireGuns = useCallback(() => {
    initAudio();
    playGunBurst();
    setFireSignal((s) => s + 1);
  }, [initAudio, playGunBurst]);

  // Spacebar hotkey to fire naval artillery burst
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        handleFireGuns();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleFireGuns]);

  return (
    <div
      onClick={initAudio}
      className="relative w-screen h-screen overflow-hidden bg-[#06090e]"
    >
      {/* 3D Scene Viewport - 100% unobstructed */}
      <Suspense fallback={null}>
        <CanvasScene
          isEngineRunning={isEngineRunning}
          speedMode={speedMode}
          isWireframe={isWireframe}
          camo={camo}
          cameraPreset={cameraPreset}
          resetSignal={resetSignal}
          onMeshStatsLoaded={handleMeshStatsLoaded}
          onBearingUpdate={setBearing}
          onGunAimUpdate={handleGunAimUpdate}
          fireSignal={fireSignal}
          gunAim={gunAim}
        />
      </Suspense>

      {/* Interactive Telemetry HUD with strict pointer-events isolation */}
      <TelemetryHUD
        isEngineRunning={isEngineRunning}
        speedMode={speedMode}
        isMuted={isMuted}
        isWireframe={isWireframe}
        camo={camo}
        cameraPreset={cameraPreset}
        bearing={bearing}
        trianglesCount={trianglesCount}
        verticesCount={verticesCount}
        gunAim={gunAim}
        onFireGuns={handleFireGuns}
        onToggleEngine={handleToggleEngine}
        onSelectSpeedMode={setSpeedMode}
        onToggleMute={handleToggleMute}
        onToggleWireframe={() => setIsWireframe((w) => !w)}
        onSelectCamo={setCamo}
        onSelectCameraPreset={setCameraPreset}
        onResetCamera={handleResetCamera}
        playClick={playClick}
      />
    </div>
  );
}

export default App;
