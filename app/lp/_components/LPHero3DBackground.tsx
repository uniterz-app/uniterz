"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import {
  Environment,
  Float,
  RoundedBox,
  MeshTransmissionMaterial,
} from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import { useRef } from "react";
import * as THREE from "three";

function HeroScene() {
  const rootRef = useRef<THREE.Group>(null);
  const orbRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const frameRef = useRef<THREE.Mesh>(null);
  const backPanelLeftRef = useRef<THREE.Mesh>(null);
  const backPanelRightRef = useRef<THREE.Mesh>(null);
  const glassLeftRef = useRef<THREE.Mesh>(null);
  const glassRightRef = useRef<THREE.Mesh>(null);
  const glowPlateRef = useRef<THREE.Mesh>(null);
  const orbMatRef = useRef<THREE.MeshPhysicalMaterial>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    if (rootRef.current) {
      rootRef.current.rotation.y = Math.sin(t * 0.22) * 0.08;
      rootRef.current.position.y = Math.sin(t * 0.55) * 0.02;
    }

    if (orbRef.current) {
      orbRef.current.rotation.y += 0.005;
      orbRef.current.position.y = 1.68 + Math.sin(t * 1.35) * 0.07;
    }

    if (ringRef.current) {
      ringRef.current.rotation.z = t * 0.28;
      ringRef.current.rotation.x = Math.PI / 2 + Math.sin(t * 0.7) * 0.04;
    }

    if (frameRef.current) {
      frameRef.current.rotation.y = Math.sin(t * 0.32) * 0.08;
    }

    if (backPanelLeftRef.current) {
      backPanelLeftRef.current.position.x = -1.7 + Math.sin(t * 0.45) * 0.04;
      backPanelLeftRef.current.rotation.y = 0.24 + Math.sin(t * 0.32) * 0.03;
    }

    if (backPanelRightRef.current) {
      backPanelRightRef.current.position.x = 1.88 + Math.sin(t * 0.4 + 1.2) * 0.05;
      backPanelRightRef.current.rotation.y = -0.34 + Math.sin(t * 0.28 + 0.7) * 0.03;
    }

    if (glassLeftRef.current) {
      glassLeftRef.current.rotation.y = -0.34 + Math.sin(t * 0.52) * 0.025;
    }

    if (glassRightRef.current) {
      glassRightRef.current.rotation.y = 0.36 + Math.sin(t * 0.48 + 0.8) * 0.025;
    }

    if (glowPlateRef.current) {
      const mat = glowPlateRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.16 + ((Math.sin(t * 1.6) + 1) * 0.5) * 0.06;
    }

    if (orbMatRef.current) {
      orbMatRef.current.emissiveIntensity =
        0.58 + ((Math.sin(t * 1.4 + 0.6) + 1) * 0.5) * 0.18;
    }
  });

  return (
    <group ref={rootRef} position={[0.2, -0.28, 0]}>
      {/* floor glow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.96, 0]}>
        <circleGeometry args={[3.7, 72]} />
        <meshBasicMaterial
          color="#43e8ff"
          transparent
          opacity={0.07}
          toneMapped={false}
        />
      </mesh>

      {/* far back panels */}
      <mesh
        ref={backPanelLeftRef}
        position={[-1.7, 0.55, -1.28]}
        rotation={[0, 0.24, 0]}
      >
        <boxGeometry args={[1.28, 3.7, 0.16]} />
        <meshStandardMaterial
          color="#0b1420"
          metalness={0.52}
          roughness={0.38}
        />
      </mesh>

      <mesh
        ref={backPanelRightRef}
        position={[1.88, 0.72, -1.42]}
        rotation={[0, -0.34, 0]}
      >
        <boxGeometry args={[1.56, 4.1, 0.18]} />
        <meshStandardMaterial
          color="#0a131d"
          metalness={0.58}
          roughness={0.34}
        />
      </mesh>

      {/* large luminous frame behind main object */}
      <mesh ref={frameRef} position={[0.35, 1.02, -0.78]}>
        <torusGeometry args={[1.28, 0.08, 18, 96]} />
        <meshBasicMaterial
          color="#8cf3ff"
          transparent
          opacity={0.32}
          toneMapped={false}
        />
      </mesh>

      <mesh position={[0.35, 1.02, -0.9]}>
        <ringGeometry args={[1.56, 1.82, 96]} />
        <meshBasicMaterial
          color="#9cf6ff"
          transparent
          opacity={0.08}
          side={THREE.DoubleSide}
          toneMapped={false}
        />
      </mesh>

      {/* bottom big stage */}
      <RoundedBox
        args={[4.5, 0.52, 3.24]}
        radius={0.12}
        smoothness={4}
        position={[0.04, -1.48, 0]}
      >
        <meshStandardMaterial
          color="#0a1019"
          metalness={0.62}
          roughness={0.32}
        />
      </RoundedBox>

      {/* left extension block */}
      <RoundedBox
        args={[1.68, 0.68, 1.24]}
        radius={0.08}
        smoothness={4}
        position={[-1.3, -1.16, 0.54]}
      >
        <meshStandardMaterial
          color="#0b111b"
          metalness={0.58}
          roughness={0.3}
        />
      </RoundedBox>

      {/* right extension block */}
      <RoundedBox
        args={[1.54, 0.62, 1.16]}
        radius={0.08}
        smoothness={4}
        position={[1.42, -1.18, 0.42]}
      >
        <meshStandardMaterial
          color="#0b121d"
          metalness={0.58}
          roughness={0.3}
        />
      </RoundedBox>

      {/* middle stage */}
      <RoundedBox
        args={[3.0, 0.44, 2.08]}
        radius={0.09}
        smoothness={4}
        position={[0.18, -0.94, 0.04]}
      >
        <meshStandardMaterial
          color="#0c1624"
          metalness={0.62}
          roughness={0.24}
        />
      </RoundedBox>

      {/* top stage */}
      <group position={[0.24, -0.52, 0.08]}>
        <RoundedBox args={[1.92, 0.28, 1.32]} radius={0.06} smoothness={4}>
          <meshStandardMaterial
            color="#0d1623"
            metalness={0.66}
            roughness={0.2}
          />
        </RoundedBox>

        <mesh ref={glowPlateRef} position={[0, 0.16, 0]}>
          <boxGeometry args={[1.74, 0.02, 1.12]} />
          <meshBasicMaterial
            color="#72f3ff"
            transparent
            opacity={0.18}
            toneMapped={false}
          />
        </mesh>

        <mesh position={[0, 0.168, 0]}>
          <boxGeometry args={[1.48, 0.015, 0.88]} />
          <meshBasicMaterial
            color="#d8faff"
            transparent
            opacity={0.18}
            toneMapped={false}
          />
        </mesh>
      </group>

      {/* foreground bars */}
      <mesh position={[-1.72, -1.02, 1.14]} rotation={[0, 0.08, 0]}>
        <boxGeometry args={[0.9, 0.06, 0.06]} />
        <meshBasicMaterial
          color="#68edff"
          transparent
          opacity={0.34}
          toneMapped={false}
        />
      </mesh>

      <mesh position={[1.7, -0.98, 1.08]} rotation={[0, -0.1, 0]}>
        <boxGeometry args={[0.96, 0.06, 0.06]} />
        <meshBasicMaterial
          color="#7ef4ff"
          transparent
          opacity={0.28}
          toneMapped={false}
        />
      </mesh>

      {/* vertical glass shapes */}
      <mesh
        ref={glassLeftRef}
        position={[-0.62, 0.86, -0.04]}
        rotation={[0, -0.34, 0]}
      >
        <boxGeometry args={[0.05, 2.72, 1.24]} />
        <MeshTransmissionMaterial
          color="#8eeeff"
          transmission={1}
          roughness={0.02}
          thickness={0.5}
          ior={1.12}
          chromaticAberration={0.01}
          backside
          transparent
          opacity={0.22}
        />
      </mesh>

      <mesh
        ref={glassRightRef}
        position={[0.72, 1.0, 0.12]}
        rotation={[0, 0.36, 0]}
      >
        <boxGeometry args={[0.05, 2.94, 1.42]} />
        <MeshTransmissionMaterial
          color="#b8f6ff"
          transmission={1}
          roughness={0.02}
          thickness={0.56}
          ior={1.12}
          chromaticAberration={0.01}
          backside
          transparent
          opacity={0.18}
        />
      </mesh>

      {/* center ring */}
      <mesh ref={ringRef} position={[0.1, 1.12, 0.02]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.92, 0.03, 16, 96]} />
        <meshBasicMaterial
          color="#7cf2ff"
          toneMapped={false}
          transparent
          opacity={0.7}
        />
      </mesh>

      {/* floating orb */}
      <Float speed={1.2} rotationIntensity={0.14} floatIntensity={0.22}>
        <mesh ref={orbRef} position={[0.1, 1.68, 0.02]}>
          <sphereGeometry args={[0.62, 64, 64]} />
          <meshPhysicalMaterial
            ref={orbMatRef}
            color="#101722"
            emissive="#6ef1ff"
            emissiveIntensity={0.62}
            metalness={0.22}
            roughness={0.24}
            clearcoat={1}
            clearcoatRoughness={0.08}
            reflectivity={0.24}
          />
        </mesh>
      </Float>

      {/* orb halo */}
      <mesh position={[0.1, 1.68, 0.02]}>
        <sphereGeometry args={[0.82, 48, 48]} />
        <meshBasicMaterial
          color="#8cf4ff"
          transparent
          opacity={0.08}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

export default function LPHero3DBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden rounded-[32px]">
      <Canvas
        dpr={[1, 1.5]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
        camera={{ position: [0, 0.42, 7.6], fov: 34 }}
      >
        <color attach="background" args={["#07101a"]} />
        <fog attach="fog" args={["#07101a", 8, 17]} />

        <ambientLight intensity={0.34} />
        <directionalLight
          position={[4.8, 6.2, 5]}
          intensity={1.15}
          color="#ebfdff"
        />
        <directionalLight
          position={[-4.4, 2.2, 4.2]}
          intensity={0.58}
          color="#7feeff"
        />
        <pointLight
          position={[0, 1.9, 2.7]}
          intensity={18}
          distance={9}
          color="#71f3ff"
        />
        <pointLight
          position={[2.1, 1.4, 2.3]}
          intensity={10}
          distance={8}
          color="#bff8ff"
        />
        <pointLight
          position={[-2.3, -0.3, 2]}
          intensity={7}
          distance={7}
          color="#3fe3ff"
        />

        <HeroScene />
        <Environment preset="city" />

        <EffectComposer multisampling={0}>
          <Bloom
            blendFunction={BlendFunction.SCREEN}
            intensity={1.02}
            luminanceThreshold={0.18}
            luminanceSmoothing={0.24}
            mipmapBlur
          />
        </EffectComposer>
      </Canvas>

      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(circle at 58% 34%, rgba(112,242,255,0.12) 0%, rgba(0,0,0,0) 18%),
            radial-gradient(circle at 52% 62%, rgba(55,200,255,0.08) 0%, rgba(0,0,0,0) 26%),
            radial-gradient(circle at 24% 22%, rgba(170,245,255,0.05) 0%, rgba(0,0,0,0) 20%)
          `,
        }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0)_0%,rgba(0,8,14,0.14)_58%,rgba(0,0,0,0.34)_100%)]" />
    </div>
  );
}