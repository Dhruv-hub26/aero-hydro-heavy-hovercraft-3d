import React, { useMemo, useRef, useEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CamoType, SpeedMode } from '../types';

interface HovercraftModelProps {
  isEngineRunning: boolean;
  speedMode: SpeedMode;
  isWireframe: boolean;
  camo: CamoType;
  onMeshStatsLoaded?: (triangles: number, vertices: number) => void;
  onGunAimUpdate?: (azimuthDeg: number, elevationDeg: number) => void;
}

export const HovercraftModel: React.FC<HovercraftModelProps> = ({
  isEngineRunning,
  speedMode,
  isWireframe,
  camo,
  onMeshStatsLoaded,
  onGunAimUpdate,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const deckGunsRef = useRef<THREE.Object3D[]>([]);
  const turbinesRef = useRef<THREE.Object3D[]>([]);
  const radarDishRef = useRef<THREE.Object3D | null>(null);
  const fanSpeedRef = useRef<number>(0);
  const lastAimReport = useRef({ az: 0, el: 0 });

  const { scene } = useGLTF('/hovercraft.glb');

  // Compute normalization and bounding box once
  const { normalizedScale, centerOffset, totalTriangles, totalVertices } = useMemo(() => {
    const box = new THREE.Box3().setFromObject(scene);
    const size = new THREE.Vector3();
    box.getSize(size);
    const center = new THREE.Vector3();
    box.getCenter(center);

    const maxDim = Math.max(size.x, size.y, size.z);
    // Target length ~16 units across world
    const targetSize = 16.0;
    const scale = maxDim > 0 ? targetSize / maxDim : 1.0;

    let triangles = 0;
    let vertices = 0;

    scene.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        if (mesh.geometry) {
          const geom = mesh.geometry;
          if (geom.index) {
            triangles += geom.index.count / 3;
          } else if (geom.attributes.position) {
            triangles += geom.attributes.position.count / 3;
          }
          if (geom.attributes.position) {
            vertices += geom.attributes.position.count;
          }
        }
      }
    });

    return {
      normalizedScale: scale,
      centerOffset: new THREE.Vector3(
        -center.x * scale,
        -box.min.y * scale, // Skirt bottom aligned at y = 0
        -center.z * scale
      ),
      totalTriangles: Math.round(triangles),
      totalVertices: Math.round(vertices),
    };
  }, [scene]);

  // Report mesh statistics to HUD
  useEffect(() => {
    if (onMeshStatsLoaded) {
      onMeshStatsLoaded(totalTriangles, totalVertices);
    }
  }, [totalTriangles, totalVertices, onMeshStatsLoaded]);

  // Isolate Deck Guns, Turbines / Lift Fans, and Top Radar Dish
  useEffect(() => {
    const guns: THREE.Object3D[] = [];
    const turbines: THREE.Object3D[] = [];
    let radar: THREE.Object3D | null = null;

    scene.traverse((obj) => {
      const name = obj.name.toLowerCase();

      // Deck Guns matching Gun_1 material or cannon nodes
      const isGunMesh =
        name === 'plane.085' ||
        name === 'plane.088' ||
        name === 'plane.092' ||
        name === 'plane.096' ||
        name === 'plane.115' ||
        name === 'plane.119' ||
        name.includes('gun') ||
        name.includes('turret');

      if (isGunMesh) {
        guns.push(obj);
      }

      // Top Radar Dish / Gantry Scanner
      if (name === 'plane.013' || name.includes('radar') || name.includes('dish') || name.includes('antenna')) {
        radar = obj;
      }

      // Lift Fans & Ducted Thruster Propellers
      const isTurbine =
        name.startsWith('circle') ||
        name === 'plane.001' ||
        name === 'plane.008' ||
        name === 'plane.029' ||
        name === 'plane.047' ||
        name === 'plane.073' ||
        name.includes('fan') ||
        name.includes('rotor') ||
        name.includes('propeller');

      if (isTurbine && !isGunMesh) {
        turbines.push(obj);
      }
    });

    deckGunsRef.current = guns;
    turbinesRef.current = turbines;
    radarDishRef.current = radar;
  }, [scene]);

  // Preserve native Sketchfab metallic/roughness textures & handle wireframe / camo
  useEffect(() => {
    const camoTints: Record<CamoType, THREE.Color | null> = {
      slate: null, // Keep 100% native authentic Sketchfab materials & textures
      arctic: new THREE.Color('#e2e8f0'),
      desert: new THREE.Color('#d97706'),
      abyss: new THREE.Color('#0b111a'),
    };

    const tint = camoTints[camo];

    scene.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh;
        const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];

        materials.forEach((mat) => {
          if (!mat) return;
          const stdMat = mat as THREE.MeshStandardMaterial;

          // Wireframe inspection toggle
          if ('wireframe' in stdMat) {
            stdMat.wireframe = isWireframe;
          }

          // Balanced environment map reflection for authentic metallic highlights
          if ('envMapIntensity' in stdMat) {
            stdMat.envMapIntensity = 1.25;
          }

          // Cache initial color once to preserve original textures
          if (stdMat.color) {
            if (!stdMat.userData.originalColor) {
              stdMat.userData.originalColor = stdMat.color.clone();
            }

            if (!tint) {
              // Exact original material color
              stdMat.color.copy(stdMat.userData.originalColor);
            } else {
              // Subtle tint overlay preserving diffuse maps
              stdMat.color.copy(stdMat.userData.originalColor).lerp(tint, 0.35);
            }
          }

          stdMat.needsUpdate = true;
        });
      }
    });
  }, [scene, isWireframe, camo]);

  // Animation Loop: Interactive Gun Aiming, Turbine Fans, Radar Sweep & Floating Buoyancy
  useFrame((state, delta) => {
    const safeDelta = Math.min(delta, 0.05);
    const t = state.clock.getElapsedTime();

    // 1. DYNAMIC FLOATING WATER DISPLACEMENT
    if (groupRef.current) {
      const speedMultiplier = isEngineRunning ? (speedMode === 2.0 ? 1.35 : 1.0) : 0.65;
      const baseElevation = isEngineRunning ? (speedMode === 2.0 ? 0.22 : 0.1) : 0.0;

      groupRef.current.position.y = baseElevation + Math.sin(t * 1.5) * 0.12 * speedMultiplier;
      groupRef.current.rotation.z = Math.cos(t * 1.2) * 0.02 * speedMultiplier;
      groupRef.current.rotation.x = Math.sin(t * 1.0) * 0.02 * speedMultiplier;
    }

    // 2. INTERACTIVE DECK GUNS TARGETING (Pointer Raycast Sync)
    if (deckGunsRef.current.length > 0) {
      // Clamp pointer azimuth yaw between -65 deg and +65 deg
      const targetYaw = THREE.MathUtils.clamp(
        state.pointer.x * (Math.PI * 0.36),
        -Math.PI * 0.36,
        Math.PI * 0.36
      );
      // Elevation pitch clamped between -5 deg and +30 deg
      const targetPitch = THREE.MathUtils.clamp(
        -state.pointer.y * (Math.PI * 0.18),
        -Math.PI * 0.08,
        Math.PI * 0.26
      );

      const gunLerp = Math.min(safeDelta * 4.5, 0.25);
      deckGunsRef.current.forEach((gun) => {
        gun.rotation.y = THREE.MathUtils.lerp(gun.rotation.y, targetYaw, gunLerp);
        gun.rotation.x = THREE.MathUtils.lerp(gun.rotation.x, targetPitch, gunLerp);
      });

      // Report live telemetry for HUD azimuth / elevation
      if (onGunAimUpdate) {
        const azDeg = Math.round(targetYaw * (180 / Math.PI));
        const elDeg = Math.round(targetPitch * (180 / Math.PI));
        if (azDeg !== lastAimReport.current.az || elDeg !== lastAimReport.current.el) {
          lastAimReport.current = { az: azDeg, el: elDeg };
          onGunAimUpdate(azDeg, elDeg);
        }
      }
    }

    // 3. REAL-TIME SPINNING TURBINE LIFT FANS & REAR THRUSTERS
    const targetFanSpeed = isEngineRunning
      ? speedMode === 2.0
        ? 65.0 // 2.0x Max Boost: motion blur spin
        : speedMode === 1.0
        ? 28.0 // 1.0x Cruise: high-speed rotation
        : 8.0  // 0.5x Drift: gentle idle spin
      : 0.0;   // Standby: smooth braking friction

    fanSpeedRef.current = THREE.MathUtils.lerp(
      fanSpeedRef.current,
      targetFanSpeed,
      safeDelta * 2.2
    );

    if (turbinesRef.current.length > 0 && fanSpeedRef.current > 0.01) {
      const rotationStep = fanSpeedRef.current * safeDelta;
      turbinesRef.current.forEach((rotor) => {
        rotor.rotation.z += rotationStep;
      });
    }

    // 4. CONTINUOUS RADAR / TOP SCANNER DISH ROTATION
    if (radarDishRef.current) {
      radarDishRef.current.rotation.y += 0.85 * safeDelta;
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      <group
        scale={normalizedScale}
        position={[centerOffset.x, centerOffset.y, centerOffset.z]}
      >
        <primitive object={scene} />
      </group>
    </group>
  );
};

useGLTF.preload('/hovercraft.glb');
