import React from 'react';
import { useProgress } from '@react-three/drei';
import { Shield, Radio, Gauge } from 'lucide-react';

interface LoadingScreenProps {
  onStartExperience?: () => void;
  isReady: boolean;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ onStartExperience, isReady }) => {
  const { progress, item } = useProgress();

  const formattedItem = item ? item.split('/').pop() || item : '3D Naval Assets';
  const displayProgress = Math.min(100, Math.round(progress));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#06090e] tactical-scanlines">
      {/* Background circular radar grid */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
        <div className="w-[500px] h-[500px] rounded-full border border-teal-500/30 flex items-center justify-center">
          <div className="w-[360px] h-[360px] rounded-full border border-teal-500/20 flex items-center justify-center">
            <div className="w-[200px] h-[200px] rounded-full border border-cyan-500/20 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-teal-400"></div>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 w-full max-w-md p-8 mx-4 hud-card-accent rounded-xl">
        {/* Top Header Badge */}
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <Shield className="w-5 h-5 text-teal-400 animate-pulse" />
            <span className="font-mono text-xs tracking-widest text-teal-300 uppercase font-semibold">
              TAC-OPS // SYS-BOOT
            </span>
          </div>
          <span className="font-mono text-[11px] text-slate-400">SEC-LEVEL 4</span>
        </div>

        {/* Main Title */}
        <div className="mb-6 text-center">
          <h1 className="text-xl font-bold tracking-tight text-white uppercase font-sans">
            AERO-HYDRO HEAVY RIG
          </h1>
          <p className="font-mono text-xs text-cyan-400/90 mt-1">
            MK-VIII AMPHIBIOUS ASSAULT PLATFORM
          </p>
        </div>

        {/* Progress Display */}
        <div className="space-y-3 mb-6">
          <div className="flex justify-between items-center text-xs font-mono">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-teal-400 animate-spin" />
              {displayProgress < 100 ? `SYNCHRONIZING: ${formattedItem}` : 'TELEMETRY CALIBRATED'}
            </span>
            <span className="font-bold text-teal-300">{displayProgress}%</span>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden p-0.5 border border-teal-500/30">
            <div
              className="h-full bg-gradient-to-r from-teal-500 via-cyan-400 to-amber-400 rounded-full transition-all duration-300 shadow-[0_0_12px_rgba(94,234,212,0.8)]"
              style={{ width: `${Math.max(displayProgress, 5)}%` }}
            />
          </div>

          <div className="flex justify-between text-[10px] font-mono text-slate-500">
            <span>PLENUM CUSHION: STANDBY</span>
            <span>AUDIO BUS: SYNTHESIS</span>
          </div>
        </div>

        {/* Action Button */}
        {isReady && onStartExperience ? (
          <button
            onClick={onStartExperience}
            className="w-full py-3.5 px-6 rounded-lg font-mono text-xs uppercase tracking-wider font-bold bg-gradient-to-r from-teal-500 via-cyan-500 to-teal-400 text-slate-950 hover:brightness-110 active:scale-[0.98] transition-all shadow-[0_0_25px_rgba(94,234,212,0.4)] flex items-center justify-center gap-2 cursor-pointer"
          >
            <Gauge className="w-4 h-4 text-slate-950" />
            ENTER TACTICAL COCKPIT // INITIALIZE
          </button>
        ) : (
          <div className="text-center font-mono text-[11px] text-slate-400 py-2">
            Loading heavy-poly hull & ocean physics...
          </div>
        )}
      </div>
    </div>
  );
};
