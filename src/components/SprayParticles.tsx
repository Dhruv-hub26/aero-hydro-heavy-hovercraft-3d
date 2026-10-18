import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface SprayParticlesProps {
  isEngineRunning: boolean;
  speedMode: number;
}

export const SprayParticles: React.FC<SprayParticlesProps> = ({ isEngineRunning, speedMode }) => {
  const pointsRef = useRef<THREE.Points>(null);
  const count = 450;

  const [positions, velocities] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      // Skirt perimeter distribution (approximate oval around hovercraft)
      const angle = Math.random() * Math.PI * 2;
      const radiusX = 3.5 + Math.random() * 2.5;
      const radiusZ = 7.0 + Math.random() * 3.5;

      pos[i * 3] = Math.cos(angle) * radiusX;
      pos[i * 3 + 1] = 0.05 + Math.random() * 0.4;
      pos[i * 3 + 2] = Math.sin(angle) * radiusZ;

      // Velocity outwards and slightly back
      vel[i * 3] = Math.cos(angle) * (1.5 + Math.random() * 2.5);
      vel[i * 3 + 1] = 0.5 + Math.random() * 1.5;
      vel[i * 3 + 2] = Math.sin(angle) * (1.5 + Math.random() * 2.5) - 1.2;
    }
    return [pos, vel];
  }, []);

  useFrame((_, delta) => {
    if (!pointsRef.current) return;
    const posAttr = pointsRef.current.geometry.attributes.position;
    const pArr = posAttr.array as Float32Array;

    const intensity = isEngineRunning ? speedMode : 0.2;

    for (let i = 0; i < count; i++) {
      const idx = i * 3;
      pArr[idx] += velocities[idx] * delta * intensity;
      pArr[idx + 1] += (velocities[idx + 1] - 3.2 * delta) * delta * intensity; // gravity
      pArr[idx + 2] += velocities[idx + 2] * delta * intensity;

      // Reset when below water or too far
      if (pArr[idx + 1] < 0 || Math.abs(pArr[idx]) > 14 || Math.abs(pArr[idx + 2]) > 18) {
        const angle = Math.random() * Math.PI * 2;
        const radiusX = 3.2 + Math.random() * 1.8;
        const radiusZ = 6.5 + Math.random() * 3.0;
        pArr[idx] = Math.cos(angle) * radiusX;
        pArr[idx + 1] = 0.1 + Math.random() * 0.3;
        pArr[idx + 2] = Math.sin(angle) * radiusZ;
      }
    }
    posAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.16}
        color={new THREE.Color('#a5f3fc')}
        transparent
        opacity={isEngineRunning ? 0.35 * Math.min(speedMode, 1.4) : 0.08}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
};
