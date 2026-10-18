import React from 'react';
import {
  Volume2,
  VolumeX,
  RotateCcw,
  Box,
  Compass,
  Gauge,
  Wind,
  Waves,
  Crosshair,
  Sliders,
  ChevronRight,
  Shield,
  Zap,
} from 'lucide-react';
import { CamoType, SpeedMode, CameraPreset, TelemetryData } from '../types';

interface TelemetryHUDProps {
  isEngineRunning: boolean;
  speedMode: SpeedMode;
  isMuted: boolean;
  isWireframe: boolean;
  camo: CamoType;
  cameraPreset: CameraPreset;
  bearing: number;
  trianglesCount: number;
  verticesCount: number;
  gunAim?: { azimuth: number; elevation: number };
  onFireGuns?: () => void;
  onToggleEngine: () => void;
  onSelectSpeedMode: (mode: SpeedMode) => void;
  onToggleMute: () => void;
  onToggleWireframe: () => void;
  onSelectCamo: (camo: CamoType) => void;
  onSelectCameraPreset: (preset: CameraPreset) => void;
  onResetCamera: () => void;
  playClick: (freq?: number, type?: 'light' | 'action') => void;
}

const CAMO_OPTIONS: { id: CamoType; label: string; colorDot: string }[] = [
  { id: 'slate', label: 'Naval Slate', colorDot: 'bg-[#94A3B8]' },
  { id: 'arctic', label: 'Arctic White', colorDot: 'bg-[#E2E8F0]' },
  { id: 'desert', label: 'Desert Sand', colorDot: 'bg-[#D97706]' },
  { id: 'abyss', label: 'Deep Abyss', colorDot: 'bg-[#0F172A] border border-[#5EEAD4]/40' },
];

const CAMERA_PRESETS: { id: CameraPreset; label: string }[] = [
  { id: 'orbit', label: 'NAVAL ORBIT' },
  { id: 'cockpit', label: 'COCKPIT HELM' },
  { id: 'turbines', label: 'FAN TURBINES' },
  { id: 'top', label: 'TOP SCAN' },
];

export const TelemetryHUD: React.FC<TelemetryHUDProps> = ({
  isEngineRunning,
  speedMode,
  isMuted,
  isWireframe,
  camo,
  cameraPreset,
  bearing,
  trianglesCount,
  verticesCount,
  gunAim,
  onFireGuns,
  onToggleEngine,
  onSelectSpeedMode,
  onToggleMute,
  onToggleWireframe,
  onSelectCamo,
  onSelectCameraPreset,
  onResetCamera,
  playClick,
}) => {
  // Derive telemetry metrics dynamically from propulsion state & speed mode
  const telemetry: TelemetryData = React.useMemo(() => {
    if (!isEngineRunning) {
      return {
        speedKnots: 0,
        speedKmh: 0,
        rpm: 650,
        plenumPressureKPa: 24,
        trimAngleDeg: 0.2,
        waveHeightM: 0.6,
        bearingDeg: bearing,
        trianglesCount,
        fanRps: 4,
      };
    }

    if (speedMode === 0.5) {
      return {
        speedKnots: 22.4,
        speedKmh: 41.5,
        rpm: 2150,
        plenumPressureKPa: 68,
        trimAngleDeg: 1.2,
        waveHeightM: 0.9,
        bearingDeg: bearing,
        trianglesCount,
        fanRps: 18,
      };
    } else if (speedMode === 1.0) {
      return {
        speedKnots: 48.6,
        speedKmh: 90.0,
        rpm: 4850,
        plenumPressureKPa: 112,
        trimAngleDeg: 2.8,
        waveHeightM: 1.3,
        bearingDeg: bearing,
        trianglesCount,
        fanRps: 38,
      };
    } else {
      // 2.0x boost
      return {
        speedKnots: 76.8,
        speedKmh: 142.2,
        rpm: 7420,
        plenumPressureKPa: 168,
        trimAngleDeg: 4.4,
        waveHeightM: 1.8,
        bearingDeg: bearing,
        trianglesCount,
        fanRps: 62,
      };
    }
  }, [isEngineRunning, speedMode, bearing, trianglesCount]);

  const getBearingCompass = (deg: number) => {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(((deg % 360) / 22.5)) % 16;
    return directions[index];
  };

  return (
    <div className="pointer-events-none fixed inset-0 z-20 flex flex-col justify-between p-4 sm:p-6 md:p-8 w-screen h-screen overflow-hidden select-none font-sans">
      
      {/* 1. TOP HEADER BAR */}
      <header className="w-full flex items-center justify-between gap-4">
        {/* Unit Identifier */}
        <div className="pointer-events-auto flex items-center gap-3 backdrop-blur-xl bg-slate-950/60 border border-white/10 px-4 py-2.5 rounded-2xl shadow-xl">
          <div className="flex items-center gap-2.5 border-r border-white/10 pr-3">
            <Shield className="w-4 h-4 text-[#5EEAD4]" />
            <div className="flex flex-col">
              <span className="font-mono text-xs sm:text-sm font-bold tracking-wider text-slate-100">
                [HVR] AERO-HYDRO HEAVY RIG
              </span>
              <span className="font-sans text-[10px] text-[#94A3B8] tracking-widest uppercase">
                MK-VIII AMPHIBIOUS HULL
              </span>
            </div>
          </div>

          {/* Status Indicator */}
          <div
            className={`flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-mono tracking-wider transition-all duration-300 ${
              isEngineRunning
                ? 'bg-[#5EEAD4]/10 border border-[#5EEAD4]/40 text-[#5EEAD4] shadow-[0_0_12px_rgba(94,234,212,0.25)]'
                : 'bg-[#F59E0B]/10 border border-[#F59E0B]/30 text-[#F59E0B]'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isEngineRunning ? 'bg-[#5EEAD4] animate-ping' : 'bg-[#F59E0B]'
              }`}
            />
            <span>
              {isEngineRunning ? '[TURBINE AIR-CUSHION ACTIVE]' : '[CUSHION STANDBY]'}
            </span>
          </div>

          {/* Active Radar Sweep Indicator */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono tracking-wider bg-[#38BDF8]/10 border border-[#38BDF8]/30 text-[#38BDF8] shadow-[0_0_10px_rgba(56,189,248,0.2)]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#38BDF8] animate-pulse" />
            <span>RADAR SWEEP: 360° ACTIVE</span>
          </div>
        </div>

        {/* Quick Utility Controls */}
        <div className="pointer-events-auto flex items-center gap-2 backdrop-blur-xl bg-slate-950/60 border border-white/10 p-1.5 rounded-2xl shadow-xl">
          {/* Wireframe toggle */}
          <button
            onClick={() => {
              playClick(1050, 'light');
              onToggleWireframe();
            }}
            title="Toggle Hull Wireframe Mode"
            className={`px-3 py-1.5 rounded-xl font-mono text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
              isWireframe
                ? 'bg-[#5EEAD4]/20 border border-[#5EEAD4] text-[#5EEAD4]'
                : 'text-[#94A3B8] hover:text-white hover:bg-white/5 border border-transparent'
            }`}
          >
            <Box className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">WIREFRAME</span>
          </button>

          {/* Audio toggle */}
          <button
            onClick={() => {
              playClick(850, 'light');
              onToggleMute();
            }}
            title={isMuted ? 'Unmute Turbine Audio' : 'Mute Turbine Audio'}
            className={`p-2 rounded-xl font-mono text-xs flex items-center justify-center transition-all cursor-pointer ${
              !isMuted
                ? 'bg-[#5EEAD4]/20 border border-[#5EEAD4]/50 text-[#5EEAD4]'
                : 'text-[#94A3B8] hover:text-white hover:bg-white/5 border border-white/5'
            }`}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-[#94A3B8]" /> : <Volume2 className="w-4 h-4 text-[#5EEAD4]" />}
          </button>

          {/* Reset Orbit */}
          <button
            onClick={() => {
              playClick(1200, 'light');
              onResetCamera();
            }}
            title="Reset Orbit View"
            className="p-2 rounded-xl text-[#94A3B8] hover:text-white hover:bg-white/5 border border-white/5 transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* 2. MIDDLE SIDE TELEMETRY CARDS (Cleanly docked to left & right, 0 center clutter) */}
      <div className="w-full flex justify-between items-center my-auto pointer-events-none py-4">
        
        {/* Left Telemetry Panel: LIFT & PROPULSION CORE */}
        <div className="pointer-events-auto hidden md:flex flex-col gap-3.5 w-76 backdrop-blur-xl bg-slate-950/60 border border-white/10 rounded-2xl p-4 shadow-2xl">
          <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
            <span className="font-sans text-xs font-semibold tracking-wider text-[#5EEAD4] flex items-center gap-1.5 uppercase">
              <Wind className="w-3.5 h-3.5" />
              LIFT & PROPULSION CORE
            </span>
            <span className="font-mono text-[10px] text-[#94A3B8]">SEC.01</span>
          </div>

          {/* Velocity Readout */}
          <div className="bg-slate-900/50 p-3 rounded-xl border border-white/5 flex items-baseline justify-between">
            <div>
              <div className="text-[10px] font-sans uppercase text-[#94A3B8] tracking-wider">Velocity</div>
              <div className="font-mono text-2xl font-bold text-white tracking-tight">
                {telemetry.speedKnots.toFixed(1)} <span className="text-xs text-[#5EEAD4] font-normal">KTS</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] font-sans uppercase text-[#94A3B8] tracking-wider">Ground Speed</div>
              <div className="font-mono text-sm font-semibold text-[#38BDF8]">
                {telemetry.speedKmh.toFixed(1)} <span className="text-[10px] text-[#94A3B8]">KM/H</span>
              </div>
            </div>
          </div>

          {/* Air-Cushion Plenum Pressure Gauge */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-[#94A3B8] font-sans flex items-center gap-1.5 uppercase tracking-wide">
                <Gauge className="w-3 h-3 text-[#38BDF8]" />
                PLENUM PRESSURE
              </span>
              <span className="text-[#38BDF8] font-mono font-semibold">{telemetry.plenumPressureKPa} kPa</span>
            </div>
            <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-white/10">
              <div
                className="h-full bg-gradient-to-r from-[#5EEAD4] to-[#38BDF8] transition-all duration-300"
                style={{ width: `${Math.min(100, (telemetry.plenumPressureKPa / 180) * 100)}%` }}
              />
            </div>
          </div>

          {/* Turbine RPM Gauge */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-[#94A3B8] font-sans flex items-center gap-1.5 uppercase tracking-wide">
                <Zap className="w-3 h-3 text-[#F59E0B]" />
                TURBINE ROTOR
              </span>
              <span className="text-[#F59E0B] font-mono font-semibold">{telemetry.rpm.toLocaleString()} RPM</span>
            </div>
            <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-white/10">
              <div
                className="h-full bg-gradient-to-r from-[#F59E0B] to-[#FB923C] transition-all duration-300"
                style={{ width: `${Math.min(100, (telemetry.rpm / 8000) * 100)}%` }}
              />
            </div>
          </div>

          {/* Hydrofoil Trim Angle & Fan RPS */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5">
            <div className="bg-slate-900/40 p-2.5 rounded-xl border border-white/5">
              <span className="text-[10px] font-sans uppercase text-[#94A3B8] block">HYDRO TRIM</span>
              <span className="font-mono text-sm text-slate-100 font-bold">+{telemetry.trimAngleDeg.toFixed(1)}°</span>
            </div>
            <div className="bg-slate-900/40 p-2.5 rounded-xl border border-white/5">
              <span className="text-[10px] font-sans uppercase text-[#94A3B8] block">FAN FREQ</span>
              <span className="font-mono text-sm text-[#5EEAD4] font-bold">{telemetry.fanRps} RPS</span>
            </div>
          </div>
        </div>

        {/* Right Telemetry Panel: NAVAL SPECIFICATIONS & SEAS */}
        <div className="pointer-events-auto hidden md:flex flex-col gap-3.5 w-76 backdrop-blur-xl bg-slate-950/60 border border-white/10 rounded-2xl p-4 shadow-2xl">
          <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
            <span className="font-sans text-xs font-semibold tracking-wider text-[#38BDF8] flex items-center gap-1.5 uppercase">
              <Waves className="w-3.5 h-3.5" />
              NAVAL TELEMETRY & SEAS
            </span>
            <span className="font-mono text-[10px] text-[#94A3B8]">SEC.02</span>
          </div>

          {/* Compass Heading & Wave State */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-slate-900/50 p-2.5 rounded-xl border border-white/5">
              <span className="text-[10px] font-sans text-[#94A3B8] flex items-center gap-1 uppercase tracking-wide">
                <Compass className="w-3 h-3 text-[#5EEAD4]" />
                Bearing
              </span>
              <div className="font-mono text-lg font-bold text-[#5EEAD4] mt-0.5">
                {String(telemetry.bearingDeg).padStart(3, '0')}°
                <span className="text-xs text-[#94A3B8] ml-1 font-normal">
                  {getBearingCompass(telemetry.bearingDeg)}
                </span>
              </div>
            </div>

            <div className="bg-slate-900/50 p-2.5 rounded-xl border border-white/5">
              <span className="text-[10px] font-sans text-[#94A3B8] flex items-center gap-1 uppercase tracking-wide">
                <Waves className="w-3 h-3 text-[#38BDF8]" />
                Wave Swell
              </span>
              <div className="font-mono text-lg font-bold text-[#38BDF8] mt-0.5">
                {telemetry.waveHeightM.toFixed(1)} <span className="text-xs text-[#94A3B8] font-normal">M</span>
              </div>
            </div>
          </div>

          {/* Interactive Deck Guns Targeting Live Telemetry */}
          <div className="bg-slate-900/50 p-2.5 rounded-xl border border-white/5 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-sans text-[11px] text-[#5EEAD4] flex items-center gap-1.5 uppercase tracking-wide font-semibold">
                <Crosshair className="w-3.5 h-3.5 text-[#5EEAD4]" />
                GUNS TRACKING
              </span>
              <span className="px-2 py-0.5 rounded text-[9px] font-mono bg-[#5EEAD4]/15 border border-[#5EEAD4]/40 text-[#5EEAD4] uppercase font-bold tracking-wider">
                POINTER SYNC // LIVE
              </span>
            </div>

            <div className="flex justify-between items-center text-xs font-mono pt-0.5">
              <div className="flex items-center gap-1.5 text-[#94A3B8]">
                <span className="text-[10px] uppercase">AZIMUTH:</span>
                <span className="text-white font-bold">{gunAim ? `${gunAim.azimuth >= 0 ? '+' : ''}${gunAim.azimuth}°` : '0°'}</span>
              </div>
              <div className="flex items-center gap-1.5 text-[#94A3B8]">
                <span className="text-[10px] uppercase">ELEV:</span>
                <span className="text-[#38BDF8] font-bold">{gunAim ? `${gunAim.elevation >= 0 ? '+' : ''}${gunAim.elevation}°` : '0°'}</span>
              </div>
            </div>

            {onFireGuns && (
              <button
                onClick={() => {
                  playClick(1400, 'action');
                  onFireGuns();
                }}
                className="w-full mt-1 py-1.5 px-2 rounded-lg font-mono text-[10px] uppercase tracking-wider font-bold bg-[#F59E0B]/20 hover:bg-[#F59E0B]/30 border border-[#F59E0B]/50 text-[#F59E0B] flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-[0.98]"
              >
                <Zap className="w-3 h-3 text-[#F59E0B]" />
                FIRE BATTERIES [SPACE]
              </button>
            )}
          </div>

          {/* Polygon Telemetry */}
          <div className="bg-slate-900/40 p-2.5 rounded-xl border border-white/5 space-y-1 text-xs">
            <div className="flex justify-between items-center text-[#94A3B8]">
              <span className="font-sans text-[11px] flex items-center gap-1.5 uppercase tracking-wide">
                <Crosshair className="w-3 h-3 text-[#F59E0B]" />
                HULL TRIANGLES
              </span>
              <span className="font-mono font-bold text-slate-100">
                {trianglesCount > 0 ? trianglesCount.toLocaleString() : '214,820'}
              </span>
            </div>
            <div className="flex justify-between items-center text-[#94A3B8] text-[10px]">
              <span className="font-sans uppercase">VERTICES COUNT</span>
              <span className="font-mono">{verticesCount > 0 ? verticesCount.toLocaleString() : '122,540'}</span>
            </div>
          </div>

          {/* Camo / Finish Selector */}
          <div className="space-y-2 pt-1 border-t border-white/5">
            <div className="flex items-center justify-between text-[11px] font-sans text-[#94A3B8]">
              <span className="flex items-center gap-1.5 uppercase tracking-wide">
                <Sliders className="w-3 h-3 text-[#5EEAD4]" />
                HULL CAMOUFLAGE
              </span>
              <span className="text-[10px] uppercase text-[#94A3B8]">FINISH</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {CAMO_OPTIONS.map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    playClick(1000, 'light');
                    onSelectCamo(c.id);
                  }}
                  className={`flex items-center gap-2 p-1.5 rounded-xl text-[11px] font-sans tracking-wide transition-all cursor-pointer ${
                    camo === c.id
                      ? 'bg-[#5EEAD4]/15 border border-[#5EEAD4]/60 text-white font-semibold'
                      : 'bg-slate-900/40 hover:bg-slate-800/60 border border-white/5 text-[#94A3B8]'
                  }`}
                >
                  <span className={`w-2.5 h-2.5 rounded-full ${c.colorDot}`} />
                  <span className="truncate">{c.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 3. BOTTOM DOCK (Single Unified Glass Row) */}
      <footer className="w-full flex justify-center">
        <div className="pointer-events-auto w-full max-w-5xl backdrop-blur-xl bg-slate-950/60 border border-white/10 p-2.5 md:p-3 rounded-2xl shadow-2xl flex flex-wrap lg:flex-nowrap items-center justify-between gap-3">
          
          {/* Camera Presets */}
          <div className="flex items-center gap-1.5 order-2 lg:order-1 overflow-x-auto py-1">
            <span className="font-sans text-[10px] text-[#94A3B8] uppercase px-2 hidden sm:inline tracking-wider">
              VIEW:
            </span>
            {CAMERA_PRESETS.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  playClick(920, 'light');
                  onSelectCameraPreset(p.id);
                }}
                className={`px-3 py-1.5 rounded-xl font-mono text-[11px] tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                  cameraPreset === p.id
                    ? 'bg-[#5EEAD4]/20 border border-[#5EEAD4] text-[#5EEAD4] font-bold shadow-[0_0_12px_rgba(94,234,212,0.25)]'
                    : 'text-[#94A3B8] hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Center Action: ENGAGE / STANDBY PROPULSION */}
          <div className="order-1 lg:order-2 w-full lg:w-auto flex justify-center">
            <button
              onClick={() => {
                playClick(isEngineRunning ? 650 : 1300, 'action');
                onToggleEngine();
              }}
              className={`w-full sm:w-auto px-6 py-2.5 rounded-xl font-sans text-xs md:text-sm font-bold tracking-wider uppercase transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-lg ${
                isEngineRunning
                  ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-[#38BDF8] text-slate-950 hover:brightness-110 shadow-[0_0_25px_rgba(94,234,212,0.45)]'
                  : 'bg-gradient-to-r from-[#F59E0B] via-amber-500 to-rose-500 text-slate-950 hover:brightness-110 shadow-[0_0_25px_rgba(245,158,11,0.35)]'
              }`}
            >
              <Zap className="w-4 h-4 text-slate-950 fill-current" />
              <span>{isEngineRunning ? 'DISENGAGE PROPULSION' : 'ENGAGE PROPULSION'}</span>
              <ChevronRight className="w-4 h-4 text-slate-950" />
            </button>
          </div>

          {/* Speed Multipliers */}
          <div className="flex items-center gap-1.5 order-3">
            <span className="font-sans text-[10px] text-[#94A3B8] uppercase px-2 hidden sm:inline tracking-wider">
              THROTTLE:
            </span>
            {([0.5, 1.0, 2.0] as SpeedMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => {
                  playClick(1100 + mode * 200, 'light');
                  onSelectSpeedMode(mode);
                }}
                className={`px-3 py-1.5 rounded-xl font-mono text-[11px] tracking-wider transition-all cursor-pointer ${
                  speedMode === mode
                    ? mode === 2.0
                      ? 'bg-rose-500/20 border border-rose-400 text-rose-300 font-bold shadow-[0_0_12px_rgba(244,63,94,0.3)]'
                      : 'bg-[#5EEAD4]/20 border border-[#5EEAD4] text-[#5EEAD4] font-bold shadow-[0_0_12px_rgba(94,234,212,0.25)]'
                    : 'text-[#94A3B8] hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                {mode === 0.5 ? '0.5x DRIFT' : mode === 1.0 ? '1.0x CRUISE' : '2.0x BOOST'}
              </button>
            ))}
          </div>

        </div>
      </footer>
    </div>
  );
};
