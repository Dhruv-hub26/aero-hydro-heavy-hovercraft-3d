import { useEffect, useRef, useState, useCallback } from 'react';
import { SpeedMode } from '../types';

interface AudioEngineState {
  isMuted: boolean;
  isEngineRunning: boolean;
  speedMode: SpeedMode;
}

export function useHovercraftAudio({
  isMuted,
  isEngineRunning,
  speedMode,
}: AudioEngineState) {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const engineGainRef = useRef<GainNode | null>(null);
  
  // Oscillators and filters for turbine air-cushion
  const oscTriRef = useRef<OscillatorNode | null>(null);
  const oscSineRef = useRef<OscillatorNode | null>(null);
  const filterRef = useRef<BiquadFilterNode | null>(null);
  const noiseSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const noiseGainRef = useRef<GainNode | null>(null);
  const noiseFilterRef = useRef<BiquadFilterNode | null>(null);

  const [isAudioInitialized, setIsAudioInitialized] = useState(false);

  // Initialize Web Audio Context
  const initAudio = useCallback(() => {
    if (audioCtxRef.current) {
      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }
      return;
    }

    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;

      // Master output gain
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(isMuted ? 0 : 0.65, ctx.currentTime);
      masterGain.connect(ctx.destination);
      masterGainRef.current = masterGain;

      // Engine primary gain
      const engineGain = ctx.createGain();
      engineGain.gain.setValueAtTime(0, ctx.currentTime);
      engineGain.connect(masterGain);
      engineGainRef.current = engineGain;

      // Primary Biquad Lowpass Filter
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(140, ctx.currentTime);
      filter.Q.setValueAtTime(2.5, ctx.currentTime);
      filter.connect(engineGain);
      filterRef.current = filter;

      // Turbine Oscillator 1: Triangle for rich low acoustic air rumble
      const oscTri = ctx.createOscillator();
      oscTri.type = 'triangle';
      oscTri.frequency.setValueAtTime(45, ctx.currentTime);
      oscTri.connect(filter);
      oscTri.start();
      oscTriRef.current = oscTri;

      // Turbine Oscillator 2: Detuned Sine for heavy cushion resonance
      const oscSine = ctx.createOscillator();
      oscSine.type = 'sine';
      oscSine.frequency.setValueAtTime(48.5, ctx.currentTime); // Slight beat frequency
      oscSine.connect(filter);
      oscSine.start();
      oscSineRef.current = oscSine;

      // Procedural Air Turbulence (White noise buffer through resonant bandpass)
      const bufferSize = ctx.sampleRate * 2;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = noiseBuffer;
      noiseSource.loop = true;

      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.setValueAtTime(220, ctx.currentTime);
      noiseFilter.Q.setValueAtTime(1.8, ctx.currentTime);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.08, ctx.currentTime);

      noiseSource.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(engineGain);
      noiseSource.start();

      noiseSourceRef.current = noiseSource;
      noiseFilterRef.current = noiseFilter;
      noiseGainRef.current = noiseGain;

      setIsAudioInitialized(true);
    } catch (e) {
      console.warn('Web Audio API not supported or initialized yet:', e);
    }
  }, [isMuted]);

  // Handle Master Mute
  useEffect(() => {
    if (!masterGainRef.current || !audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    const targetGain = isMuted ? 0.0001 : 0.65;
    masterGainRef.current.gain.cancelScheduledValues(ctx.currentTime);
    masterGainRef.current.gain.setTargetAtTime(targetGain, ctx.currentTime, 0.08);
  }, [isMuted]);

  // Handle Engine Run state & Throttle modulation
  useEffect(() => {
    if (!audioCtxRef.current || !engineGainRef.current) return;
    const ctx = audioCtxRef.current;
    const now = ctx.currentTime;

    if (!isEngineRunning) {
      // Fade out smoothly (0.5s decay)
      engineGainRef.current.gain.cancelScheduledValues(now);
      engineGainRef.current.gain.setTargetAtTime(0.0001, now, 0.35);
      return;
    }

    // Engine is running: Calculate target acoustic parameters based on speed multiplier
    let basePitch = 44; // Hz
    let filterFreq = 160; // Hz
    let airNoiseGain = 0.06;
    let targetEngineGain = 0.55;

    if (speedMode === 0.5) {
      // Idle cushion drift
      basePitch = 38;
      filterFreq = 140;
      airNoiseGain = 0.04;
      targetEngineGain = 0.45;
    } else if (speedMode === 1.0) {
      // Naval cruise
      basePitch = 64;
      filterFreq = 260;
      airNoiseGain = 0.09;
      targetEngineGain = 0.65;
    } else if (speedMode === 2.0) {
      // Emergency max boost
      basePitch = 96;
      filterFreq = 420;
      airNoiseGain = 0.16;
      targetEngineGain = 0.82;
    }

    // 0.4s smooth ramp
    engineGainRef.current.gain.cancelScheduledValues(now);
    engineGainRef.current.gain.setTargetAtTime(targetEngineGain, now, 0.25);

    if (oscTriRef.current && oscSineRef.current && filterRef.current) {
      oscTriRef.current.frequency.cancelScheduledValues(now);
      oscTriRef.current.frequency.setTargetAtTime(basePitch, now, 0.3);

      oscSineRef.current.frequency.cancelScheduledValues(now);
      oscSineRef.current.frequency.setTargetAtTime(basePitch * 1.08, now, 0.3);

      filterRef.current.frequency.cancelScheduledValues(now);
      filterRef.current.frequency.setTargetAtTime(filterFreq, now, 0.3);
    }

    if (noiseGainRef.current && noiseFilterRef.current) {
      noiseGainRef.current.gain.cancelScheduledValues(now);
      noiseGainRef.current.gain.setTargetAtTime(airNoiseGain, now, 0.25);

      noiseFilterRef.current.frequency.cancelScheduledValues(now);
      noiseFilterRef.current.frequency.setTargetAtTime(filterFreq * 1.4, now, 0.3);
    }
  }, [isEngineRunning, speedMode]);

  // Tactile UI click sound synthesis
  const playClick = useCallback((freq = 950, type: 'light' | 'action' = 'light') => {
    if (isMuted || !audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const clickOsc = ctx.createOscillator();
    const clickGain = ctx.createGain();

    clickOsc.type = type === 'action' ? 'triangle' : 'sine';
    clickOsc.frequency.setValueAtTime(freq, ctx.currentTime);
    clickOsc.frequency.exponentialRampToValueAtTime(freq * 0.4, ctx.currentTime + 0.04);

    clickGain.gain.setValueAtTime(type === 'action' ? 0.25 : 0.12, ctx.currentTime);
    clickGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.045);

    clickOsc.connect(clickGain);
    clickGain.connect(masterGainRef.current || ctx.destination);

    clickOsc.start();
    clickOsc.stop(ctx.currentTime + 0.05);
  }, [isMuted]);

  // Procedural Naval Gun Cannon Burst Sound Synthesizer
  const playGunBurst = useCallback(() => {
    if (isMuted || !audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const now = ctx.currentTime;
    // 3 rapid naval cannon bursts
    for (let i = 0; i < 3; i++) {
      const burstTime = now + i * 0.09;

      // Heavy bass thump (exponential pitch drop from 190Hz to 32Hz)
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(190, burstTime);
      osc.frequency.exponentialRampToValueAtTime(32, burstTime + 0.14);

      oscGain.gain.setValueAtTime(0.45, burstTime);
      oscGain.gain.exponentialRampToValueAtTime(0.001, burstTime + 0.16);

      // Noise burst for mechanical muzzle report
      const noiseBuffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.15), ctx.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let j = 0; j < data.length; j++) {
        data[j] = Math.random() * 2 - 1;
      }
      const noiseNode = ctx.createBufferSource();
      noiseNode.buffer = noiseBuffer;

      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = 'lowpass';
      noiseFilter.frequency.setValueAtTime(800, burstTime);
      noiseFilter.frequency.exponentialRampToValueAtTime(150, burstTime + 0.12);

      const noiseBurstGain = ctx.createGain();
      noiseBurstGain.gain.setValueAtTime(0.35, burstTime);
      noiseBurstGain.gain.exponentialRampToValueAtTime(0.001, burstTime + 0.14);

      noiseNode.connect(noiseFilter);
      noiseFilter.connect(noiseBurstGain);
      noiseBurstGain.connect(masterGainRef.current || ctx.destination);

      osc.connect(oscGain);
      oscGain.connect(masterGainRef.current || ctx.destination);

      osc.start(burstTime);
      osc.stop(burstTime + 0.17);
      noiseNode.start(burstTime);
      noiseNode.stop(burstTime + 0.16);
    }
  }, [isMuted]);

  return {
    initAudio,
    isAudioInitialized,
    playClick,
    playGunBurst,
  };
}
