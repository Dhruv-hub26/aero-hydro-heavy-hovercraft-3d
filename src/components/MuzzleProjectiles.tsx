import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface MuzzleProjectilesProps {
  fireSignal: number;
  gunAim: { azimuth: number; elevation: number };
}

interface Projectile {
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  color: THREE.Color;
  life: number;
  maxLife: number;
  size: number;
}

export const MuzzleProjectiles: React.FC<MuzzleProjectilesProps> = ({
  fireSignal,
  gunAim,
}) => {
  const pointsRef = useRef<THREE.Points>(null);
  const flashLightRef = useRef<THREE.PointLight>(null);
  const projectilesRef = useRef<Projectile[]>([]);
  const flashTimerRef = useRef<number>(0);

  const maxParticles = 90;
  const positions = useRef(new Float32Array(maxParticles * 3));
  const colors = useRef(new Float32Array(maxParticles * 3));

  // Forward gun barrel muzzle origins (Port and Starboard bow turrets)
  const muzzleOrigins = [
    new THREE.Vector3(-1.8, 1.85, 6.4),
    new THREE.Vector3(1.8, 1.85, 6.4),
  ];

  // Whenever fireSignal increments (Spacebar or UI click)
  useEffect(() => {
    if (fireSignal === 0) return;

    // Trigger muzzle flash point light
    flashTimerRef.current = 0.09;
    if (flashLightRef.current) {
      flashLightRef.current.intensity = 15;
    }

    // Convert live gun aiming degrees to radians
    const yawRad = (gunAim.azimuth * Math.PI) / 180;
    const pitchRad = (gunAim.elevation * Math.PI) / 180;

    // Unit forward aiming vector
    const forwardDir = new THREE.Vector3(
      Math.sin(yawRad),
      Math.sin(pitchRad),
      Math.cos(yawRad)
    ).normalize();

    // Spawn high-velocity laser tracer rounds & muzzle spark bursts from both barrels
    muzzleOrigins.forEach((origin) => {
      // 1. High-velocity tracer beam core
      const tracerVel = forwardDir.clone().multiplyScalar(55.0);
      projectilesRef.current.push({
        pos: origin.clone(),
        vel: tracerVel,
        color: new THREE.Color('#5EEAD4'), // Electric Pastel Mint
        life: 0.55,
        maxLife: 0.55,
        size: 0.42,
      });

      // 2. Secondary amber tracer trailing core
      projectilesRef.current.push({
        pos: origin.clone().add(new THREE.Vector3(0, -0.05, -0.3)),
        vel: forwardDir.clone().multiplyScalar(48.0),
        color: new THREE.Color('#FB923C'), // Warm Amber Glow
        life: 0.45,
        maxLife: 0.45,
        size: 0.32,
      });

      // 3. Muzzle blast spark scatter (8 sparks per barrel)
      for (let s = 0; s < 8; s++) {
        const spreadVel = forwardDir
          .clone()
          .multiplyScalar(18 + Math.random() * 15)
          .add(
            new THREE.Vector3(
              (Math.random() - 0.5) * 8,
              (Math.random() - 0.5) * 6,
              (Math.random() - 0.5) * 6
            )
          );

        projectilesRef.current.push({
          pos: origin.clone().add(
            new THREE.Vector3(
              (Math.random() - 0.5) * 0.2,
              (Math.random() - 0.5) * 0.2,
              Math.random() * 0.3
            )
          ),
          vel: spreadVel,
          color: Math.random() > 0.4 ? new THREE.Color('#5EEAD4') : new THREE.Color('#F59E0B'),
          life: 0.22 + Math.random() * 0.25,
          maxLife: 0.47,
          size: 0.18,
        });
      }
    });

    // Keep active particles capped to maxParticles to ensure 60fps performance
    if (projectilesRef.current.length > maxParticles) {
      projectilesRef.current = projectilesRef.current.slice(-maxParticles);
    }
  }, [fireSignal, gunAim]);

  useFrame((_, delta) => {
    const safeDelta = Math.min(delta, 0.05);

    // Muzzle flash decay
    if (flashTimerRef.current > 0) {
      flashTimerRef.current -= safeDelta;
      if (flashLightRef.current) {
        flashLightRef.current.intensity = Math.max(
          0,
          (flashTimerRef.current / 0.09) * 15
        );
      }
    }

    // Update active projectiles and particles
    const activeList = projectilesRef.current;
    let validCount = 0;

    for (let i = 0; i < activeList.length; i++) {
      const p = activeList[i];
      p.life -= safeDelta;

      if (p.life > 0) {
        // Move forward along velocity
        p.pos.addScaledVector(p.vel, safeDelta);

        const idx = validCount * 3;
        positions.current[idx] = p.pos.x;
        positions.current[idx + 1] = p.pos.y;
        positions.current[idx + 2] = p.pos.z;

        // Fade brightness with remaining lifetime
        const alpha = Math.max(0, p.life / p.maxLife);
        colors.current[idx] = p.color.r * alpha;
        colors.current[idx + 1] = p.color.g * alpha;
        colors.current[idx + 2] = p.color.b * alpha;

        activeList[validCount] = p;
        validCount++;
      }
    }
    activeList.length = validCount;

    // Fill remaining buffer with zero positions
    for (let i = validCount; i < maxParticles; i++) {
      const idx = i * 3;
      positions.current[idx] = 0;
      positions.current[idx + 1] = -100;
      positions.current[idx + 2] = 0;
      colors.current[idx] = 0;
      colors.current[idx + 1] = 0;
      colors.current[idx + 2] = 0;
    }

    if (pointsRef.current) {
      pointsRef.current.geometry.attributes.position.needsUpdate = true;
      pointsRef.current.geometry.attributes.color.needsUpdate = true;
    }
  });

  return (
    <group>
      {/* Dynamic Muzzle Flash Point Light */}
      <pointLight
        ref={flashLightRef}
        position={[0, 2.0, 6.5]}
        intensity={0}
        color="#5EEAD4"
        distance={22}
        decay={2}
      />

      {/* Laser Tracer Projectiles & Muzzle Sparks */}
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[positions.current, 3]}
          />
          <bufferAttribute
            attach="attributes-color"
            args={[colors.current, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.24}
          vertexColors
          transparent
          opacity={0.9}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
    </group>
  );
};
