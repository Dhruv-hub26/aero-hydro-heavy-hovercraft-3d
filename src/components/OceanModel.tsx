import React, { useEffect, useRef } from 'react';
import { useGLTF, useAnimations } from '@react-three/drei';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

interface OceanModelProps {
  speedMode: number;
  isEngineRunning: boolean;
}

export const OceanModel: React.FC<OceanModelProps> = ({ speedMode, isEngineRunning }) => {
  const oceanRef = useRef<THREE.Group>(null);
  const { scene, animations } = useGLTF('/ocean.glb');
  const { actions, mixer } = useAnimations(animations, oceanRef);

  // Automatically play baked water wave animations
  useEffect(() => {
    const firstAction = Object.values(actions)[0];
    if (firstAction) {
      firstAction.reset().fadeIn(0.5).play();
      firstAction.timeScale = 0.8;
    }
  }, [actions]);

  // Filter duplicate vehicle meshes and style the water surface
  useEffect(() => {
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const name = mesh.name.toLowerCase();

        // The water surface mesh in ocean.glb is ' _0' with material 'Root' and 41 wave morph targets
        const isWater =
          mesh.name === ' _0' ||
          name.includes('water') ||
          name.includes('ocean') ||
          (mesh.material &&
            ((mesh.material as THREE.Material).name.toLowerCase().includes('water') ||
              (mesh.material as THREE.Material).name === 'root'));

        if (isWater) {
          mesh.visible = true;
          mesh.receiveShadow = true;
          if (mesh.material) {
            const mat = mesh.material as THREE.MeshStandardMaterial;
            mat.roughness = 0.15;
            mat.metalness = 0.8;
            mat.color = new THREE.Color('#062033');
            mat.transparent = true;
            mat.opacity = 0.96;
            mat.needsUpdate = true;
          }
        } else {
          // Strictly hide duplicate vehicle parts
          mesh.visible = false;
          mesh.castShadow = false;
          mesh.receiveShadow = false;
        }
      }
    });
  }, [scene]);

  // Modulate wave animation speed dynamically with throttle
  useFrame(() => {
    if (mixer) {
      const targetTimeScale = isEngineRunning ? 0.8 * speedMode : 0.5;
      mixer.timeScale = THREE.MathUtils.lerp(mixer.timeScale, targetTimeScale, 0.05);
    }
  });

  return (
    <group position={[0, -1.8, 0]}>
      {/* 
        The raw ocean GLB internal root has a 0.005445 scale factor (1/183.6).
        Applying [65, 45, 65] normalizes the water mesh to ~60 world units,
        placing cresting waves directly under and around the 16-unit hovercraft skirt.
      */}
      <group ref={oceanRef} scale={[65, 45, 65]} position={[0, 0, 0]}>
        <primitive object={scene} />
      </group>

      {/* Infinite ocean baseline plane blending with depth fog to horizon */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
        <planeGeometry args={[1800, 1800]} />
        <meshStandardMaterial
          color="#051522"
          roughness={0.15}
          metalness={0.8}
          envMapIntensity={1.4}
        />
      </mesh>
    </group>
  );
};

useGLTF.preload('/ocean.glb');
