"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Center, Environment, useGLTF } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

const SCALE = 4.4;
const POSITION: [number, number, number] = [0, 0.1, 0];

const ROTATE_SPEED = 0.52;
const FLOAT_AMPLITUDE = 0.01;
const FLOAT_SPEED = 1.25;

type NeonMat = THREE.MeshPhysicalMaterial & {
  userData: {
    baseEmissiveIntensity: number;
    pulseOffset: number;
    pulseSpeed: number;
  };
};

type GlowMat = THREE.MeshBasicMaterial & {
  userData: {
    baseOpacity: number;
    pulseOffset: number;
    pulseSpeed: number;
  };
};

function Logo3D() {
  const spinRef = useRef<THREE.Group>(null);
  const orientRef = useRef<THREE.Group>(null);
  const emissiveMatsRef = useRef<NeonMat[]>([]);
  const glowMatsRef = useRef<GlowMat[]>([]);
  const { scene } = useGLTF("/logo/uniterz-logo.glb");

  const clonedScene = useMemo(() => {
    const s = scene.clone(true);

    const emissiveMats: NeonMat[] = [];
    const glowMats: GlowMat[] = [];

    const meshes: THREE.Mesh[] = [];
    s.traverse((obj) => {
      if (obj instanceof THREE.Mesh) meshes.push(obj);
    });

    for (const obj of meshes) {
      obj.castShadow = false;
      obj.receiveShadow = false;
      obj.renderOrder = 1;

      const baseMat = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color("#0b1c20"),
        emissive: new THREE.Color("#38e8d8"),
        emissiveIntensity: 0.85,
        metalness: 0.02,
        roughness: 0.22,
        clearcoat: 1,
        clearcoatRoughness: 0.04,
        reflectivity: 0.14,
        transparent: true,
        opacity: 0.92,
        side: THREE.DoubleSide,
        depthWrite: false,
        toneMapped: false,
      }) as NeonMat;

      baseMat.userData = {
        baseEmissiveIntensity: 0.85,
        pulseOffset: Math.random() * Math.PI * 2,
        pulseSpeed: 0.62 + Math.random() * 0.06,
      };

      obj.material = baseMat;
      emissiveMats.push(baseMat);

      if (obj.geometry) {
        const edgeGlowMat = new THREE.MeshBasicMaterial({
          color: new THREE.Color("#6cff8e"),
          transparent: true,
          opacity: 0.06,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
          side: THREE.DoubleSide,
          toneMapped: false,
        }) as GlowMat;

        edgeGlowMat.userData = {
          baseOpacity: 0.06,
          pulseOffset: Math.random() * Math.PI * 2,
          pulseSpeed: 0.68 + Math.random() * 0.06,
        };

        const edgeGlow = new THREE.Mesh(obj.geometry, edgeGlowMat);
        edgeGlow.name = `${obj.name || "mesh"}__edgeGlow`;
        edgeGlow.renderOrder = 2;
        edgeGlow.scale.setScalar(1.002);
        obj.add(edgeGlow);

        glowMats.push(edgeGlowMat);
      }
    }

    emissiveMatsRef.current = emissiveMats;
    glowMatsRef.current = glowMats;
    return s;
  }, [scene]);

  useEffect(() => {
    if (!orientRef.current) return;
    orientRef.current.rotation.set(Math.PI / 2, 0, 0);
  }, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    if (spinRef.current) {
      spinRef.current.rotation.y = t * ROTATE_SPEED;
      spinRef.current.position.y = Math.sin(t * FLOAT_SPEED) * FLOAT_AMPLITUDE;
    }

    for (const mat of emissiveMatsRef.current) {
      const { baseEmissiveIntensity, pulseOffset, pulseSpeed } = mat.userData;
      const pulse = (Math.sin(t * pulseSpeed + pulseOffset) + 1) * 0.5;
      mat.emissiveIntensity = baseEmissiveIntensity + pulse * 0.05;
    }

    for (const mat of glowMatsRef.current) {
      const { baseOpacity, pulseOffset, pulseSpeed } = mat.userData;
      const pulse = (Math.sin(t * pulseSpeed + pulseOffset) + 1) * 0.5;
      mat.opacity = baseOpacity + pulse * 0.01;
    }
  });

  return (
    <group position={POSITION} scale={SCALE}>
      <group ref={spinRef}>
        <group ref={orientRef}>
          <Center>
            <primitive object={clonedScene} />
          </Center>
        </group>
      </group>
    </group>
  );
}

useGLTF.preload("/logo/uniterz-logo.glb");

export default function UniterzLogo3DBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 h-full w-full">
      <Canvas
        className="h-full w-full"
        dpr={[1, 1.5]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
        camera={{ position: [0, 0, 8], fov: 28 }}
      >
        <color attach="background" args={["#031015"]} />
        <fog attach="fog" args={["#031015", 9, 22]} />

        <ambientLight intensity={0.08} />

        <directionalLight
          position={[4, 6, 8]}
          intensity={0.45}
          color="#dcfffd"
        />

        <pointLight
          position={[-4, 4, 7]}
          intensity={10}
          color="#63f6ff"
          distance={24}
        />

        <pointLight
          position={[4, -1, 7]}
          intensity={9}
          color="#78ffa6"
          distance={22}
        />

        <pointLight
          position={[0, 2, -8]}
          intensity={0.8}
          color="#08202a"
          distance={18}
        />

        <Logo3D />
        <Environment preset="city" />

        <EffectComposer multisampling={0}>
          <Bloom
            blendFunction={BlendFunction.SCREEN}
            intensity={0.75}
            luminanceThreshold={0.16}
            luminanceSmoothing={0.22}
            mipmapBlur
          />
        </EffectComposer>
      </Canvas>

      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(circle at 50% 22%, rgba(99,246,255,0.10) 0%, rgba(0,0,0,0) 24%),
            radial-gradient(circle at 50% 58%, rgba(120,255,166,0.08) 0%, rgba(0,0,0,0) 30%),
            radial-gradient(circle at 50% 42%, rgba(18,72,84,0.05) 0%, rgba(0,0,0,0) 50%)
          `,
        }}
      />
      <div className="absolute inset-0 bg-black/18" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0)_0%,rgba(0,8,14,0.10)_58%,rgba(0,0,0,0.30)_100%)]" />
    </div>
  );
}