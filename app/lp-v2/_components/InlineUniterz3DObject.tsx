"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Center, useGLTF } from "@react-three/drei";
import { useMemo, useRef } from "react";
import * as THREE from "three";

const ROTATE_SPEED = 0.52;
const FLOAT_AMPLITUDE = 0.01;
const FLOAT_SPEED = 1.25;
const BREATH_PERIOD_SEC = 3.6;
const BREATH_SCALE_AMPLITUDE = 0.055;

const THEME = {
  baseColor: "#07090d",
  emissiveColor: "#1c2430",
  edgeGlowColor: "#6b8bab",
  emissiveIntensity: 0.08,
  pulseAmount: 0.004,
  metalness: 1,
  roughness: 0.17,
  clearcoat: 0.88,
  clearcoatRoughness: 0.12,
  reflectivity: 0.86,
  pointLightAColor: "#85b6de",
  pointLightBColor: "#6f92b4",
  bloomLikeOverlayA: "rgba(133,182,222,0.05)",
  bloomLikeOverlayB: "rgba(111,146,180,0.045)",
};

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

function MiniLogo() {
  const spinRef = useRef<THREE.Group>(null);
  const orientRef = useRef<THREE.Group>(null);
  const emissiveMatsRef = useRef<NeonMat[]>([]);
  const glowMatsRef = useRef<GlowMat[]>([]);
  const { scene } = useGLTF("/logo/uniterz-logo.glb");

  const cloned = useMemo(() => {
    emissiveMatsRef.current = [];
    glowMatsRef.current = [];
    const s = scene.clone(true);
    s.traverse((obj) => {
      if (!(obj instanceof THREE.Mesh)) return;
      if (obj.userData?.__edgeGlow) return;
      obj.castShadow = false;
      obj.receiveShadow = false;
      obj.renderOrder = 1;

      const baseMat = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(THEME.baseColor),
        emissive: new THREE.Color(THEME.emissiveColor),
        emissiveIntensity: THEME.emissiveIntensity,
        metalness: THEME.metalness,
        roughness: THEME.roughness,
        clearcoat: THEME.clearcoat,
        clearcoatRoughness: THEME.clearcoatRoughness,
        reflectivity: THEME.reflectivity,
        transparent: true,
        opacity: 0.92,
        side: THREE.DoubleSide,
        depthWrite: false,
        toneMapped: false,
      }) as NeonMat;

      baseMat.userData = {
        baseEmissiveIntensity: THEME.emissiveIntensity,
        pulseOffset: Math.random() * Math.PI * 2,
        pulseSpeed: 0.62 + Math.random() * 0.06,
      };

      obj.material = baseMat;
      emissiveMatsRef.current.push(baseMat);

      if (obj.geometry) {
        const edgeGlowMat = new THREE.MeshBasicMaterial({
          color: new THREE.Color(THEME.edgeGlowColor),
          transparent: true,
          opacity: 0.045,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
          side: THREE.DoubleSide,
          toneMapped: false,
        }) as GlowMat;

        edgeGlowMat.userData = {
          baseOpacity: 0.045,
          pulseOffset: Math.random() * Math.PI * 2,
          pulseSpeed: 0.68 + Math.random() * 0.06,
        };

        const edgeGlow = new THREE.Mesh(obj.geometry, edgeGlowMat);
        edgeGlow.userData.__edgeGlow = true;
        edgeGlow.renderOrder = 2;
        edgeGlow.scale.setScalar(1.002);
        obj.add(edgeGlow);
        glowMatsRef.current.push(edgeGlowMat);
      }
    });
    return s;
  }, [scene]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    if (spinRef.current) {
      spinRef.current.rotation.y = t * ROTATE_SPEED;
      spinRef.current.position.y = Math.sin(t * FLOAT_SPEED) * FLOAT_AMPLITUDE;
      const phase = (t % BREATH_PERIOD_SEC) / BREATH_PERIOD_SEC;
      const inhale = phase < 0.5 ? phase / 0.5 : 1 - (phase - 0.5) / 0.5;
      const eased = 0.5 - 0.5 * Math.cos(inhale * Math.PI);
      const breathScale = 1 - eased * BREATH_SCALE_AMPLITUDE;
      spinRef.current.scale.setScalar(breathScale);
    }

    for (const mat of emissiveMatsRef.current) {
      const { baseEmissiveIntensity, pulseOffset, pulseSpeed } = mat.userData;
      const pulse = (Math.sin(t * pulseSpeed + pulseOffset) + 1) * 0.5;
      mat.emissiveIntensity = baseEmissiveIntensity + pulse * THEME.pulseAmount;
    }

    for (const mat of glowMatsRef.current) {
      const { baseOpacity, pulseOffset, pulseSpeed } = mat.userData;
      const pulse = (Math.sin(t * pulseSpeed + pulseOffset) + 1) * 0.5;
      mat.opacity = baseOpacity + pulse * 0.007;
    }
  });

  return (
    <group position={[0, -0.02, 0]} scale={2.5}>
      <group ref={spinRef}>
        <group ref={orientRef} rotation={[Math.PI / 2, 0, 0]}>
          <Center>
            <primitive object={cloned} />
          </Center>
        </group>
      </group>
    </group>
  );
}

useGLTF.preload("/logo/uniterz-logo.glb");

type InlineUniterz3DObjectProps = {
  className?: string;
};

export default function InlineUniterz3DObject({
  className = "",
}: InlineUniterz3DObjectProps) {
  return (
    <div className={`pointer-events-none relative ${className}`}>
      <Canvas
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        camera={{ position: [0, 0, 6], fov: 28 }}
      >
        <ambientLight intensity={0.045} />
        <directionalLight position={[4, 6, 8]} intensity={0.62} color="#dcfffd" />
        <pointLight
          position={[-4, 4, 7]}
          intensity={8.0}
          color={THEME.pointLightAColor}
          distance={24}
        />
        <pointLight
          position={[4, -1, 7]}
          intensity={6.9}
          color={THEME.pointLightBColor}
          distance={22}
        />
        <pointLight position={[0, 2, -8]} intensity={0.8} color="#08202a" distance={18} />
        <MiniLogo />
      </Canvas>
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(circle at 50% 24%, ${THEME.bloomLikeOverlayA} 0%, rgba(0,0,0,0) 40%),
            radial-gradient(circle at 50% 62%, ${THEME.bloomLikeOverlayB} 0%, rgba(0,0,0,0) 44%)
          `,
        }}
      />
    </div>
  );
}

