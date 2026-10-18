import React, { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';
import { CameraPreset } from '../types';

interface CameraControllerProps {
  preset: CameraPreset;
  controlsRef: React.RefObject<OrbitControlsImpl | null>;
  resetSignal: number;
}

const PRESET_CONFIGS: Record<CameraPreset, { position: [number, number, number]; target: [number, number, number] }> = {
  orbit: {
    position: [24, 14, 28],
    target: [0, 1.2, 0],
  },
  cockpit: {
    position: [0.0, 4.2, 6.2],
    target: [0, 1.8, 10.5],
  },
  turbines: {
    position: [-9.8, 5.8, -10.5],
    target: [0, 2.2, -1.8],
  },
  top: {
    position: [0.05, 34.0, 0.05],
    target: [0, 0, 0],
  },
};

export const CameraController: React.FC<CameraControllerProps> = ({
  preset,
  controlsRef,
  resetSignal,
}) => {
  const isTransitioningRef = useRef(false);
  const targetCameraPos = useRef(new THREE.Vector3(...PRESET_CONFIGS.orbit.position));
  const targetLookAt = useRef(new THREE.Vector3(...PRESET_CONFIGS.orbit.target));

  // Trigger smooth transition whenever preset changes or reset signal fires
  useEffect(() => {
    const config = PRESET_CONFIGS[preset];
    targetCameraPos.current.set(...config.position);
    targetLookAt.current.set(...config.target);
    isTransitioningRef.current = true;
  }, [preset, resetSignal]);

  // If user starts manual orbit drag, stop forced interpolation so it feels completely natural
  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;

    const handleStart = () => {
      isTransitioningRef.current = false;
    };

    controls.addEventListener('start', handleStart);
    return () => {
      controls.removeEventListener('start', handleStart);
    };
  }, [controlsRef]);

  useFrame((state, delta) => {
    if (!isTransitioningRef.current) return;

    // Prevent step jumps on low FPS or tab blur
    const safeDelta = Math.min(delta, 0.05);

    // Smoothly lerp camera position
    state.camera.position.lerp(targetCameraPos.current, safeDelta * 3.5);

    // Smoothly lerp OrbitControls target
    if (controlsRef.current) {
      controlsRef.current.target.lerp(targetLookAt.current, safeDelta * 4.0);
      controlsRef.current.update();
    }

    // Stop transition when reached
    const distCam = state.camera.position.distanceTo(targetCameraPos.current);
    const distTarget = controlsRef.current
      ? controlsRef.current.target.distanceTo(targetLookAt.current)
      : 0;

    if (distCam < 0.06 && distTarget < 0.06) {
      isTransitioningRef.current = false;
    }
  });

  return null;
};
