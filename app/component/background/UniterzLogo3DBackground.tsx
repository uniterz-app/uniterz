"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Center, useGLTF } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

const SCALE = 4.4;
const POSITION: [number, number, number] = [0, 0.1, 0];

const ROTATE_SPEED = 0.52;
const FLOAT_AMPLITUDE = 0.01;
const FLOAT_SPEED = 1.25;
const BREATH_PERIOD_SEC = 3.6; // 3.6秒で拡大↔縮小を繰り返す
const BREATH_SCALE_AMPLITUDE = 0.055; // 縮小側をもう少し強める

type BgColorTheme = {
  baseColor: string;
  emissiveColor: string;
  edgeGlowColor: string;
  emissiveIntensity: number;
  pulseAmount: number;
  metalness: number;
  roughness: number;
  clearcoat: number;
  clearcoatRoughness: number;
  reflectivity: number;
  pointLightAColor: string;
  pointLightBColor: string;
  bgColor: string;
  fogColor: string;
  overlayGradA: string;
  overlayGradB: string;
  overlayGradC: string;
  ambientIntensity: number;
  directionalIntensity: number;
  pointLightAIntensity: number;
  pointLightBIntensity: number;
  bloomIntensity: number;
  bloomThreshold: number;
  bloomSmoothing: number;
};

const COLOR_THEMES = {
  current: {
    baseColor: "#0b1c20",
    emissiveColor: "#38e8d8",
    edgeGlowColor: "#6cff8e",
    emissiveIntensity: 0.72,
    pulseAmount: 0.035,
    metalness: 0.02,
    roughness: 0.22,
    clearcoat: 1,
    clearcoatRoughness: 0.04,
    reflectivity: 0.14,
    pointLightAColor: "#63f6ff",
    pointLightBColor: "#78ffa6",
    bgColor: "#031015",
    fogColor: "#031015",
    overlayGradA: "rgba(99,246,255,0.10)",
    overlayGradB: "rgba(120,255,166,0.08)",
    overlayGradC: "rgba(18,72,84,0.05)",
    ambientIntensity: 0.08,
    directionalIntensity: 0.45,
    pointLightAIntensity: 7.6,
    pointLightBIntensity: 6.8,
    bloomIntensity: 0.52,
    bloomThreshold: 0.2,
    bloomSmoothing: 0.25,
  },
  cyberPurple: {
    baseColor: "#120d1f",
    emissiveColor: "#b26bff",
    edgeGlowColor: "#7ee0ff",
    emissiveIntensity: 0.75,
    pulseAmount: 0.04,
    metalness: 0.08,
    roughness: 0.2,
    clearcoat: 1,
    clearcoatRoughness: 0.05,
    reflectivity: 0.18,
    pointLightAColor: "#78d9ff",
    pointLightBColor: "#c59dff",
    bgColor: "#090616",
    fogColor: "#090616",
    overlayGradA: "rgba(126,224,255,0.12)",
    overlayGradB: "rgba(197,157,255,0.10)",
    overlayGradC: "rgba(80,46,120,0.08)",
    ambientIntensity: 0.08,
    directionalIntensity: 0.48,
    pointLightAIntensity: 8.2,
    pointLightBIntensity: 7.2,
    bloomIntensity: 0.56,
    bloomThreshold: 0.19,
    bloomSmoothing: 0.25,
  },
  gunmetal: {
    baseColor: "#6f7782",
    emissiveColor: "#5f7387",
    edgeGlowColor: "#98a9b9",
    emissiveIntensity: 0.22,
    pulseAmount: 0.01,
    metalness: 0.92,
    roughness: 0.18,
    clearcoat: 0.95,
    clearcoatRoughness: 0.08,
    reflectivity: 0.55,
    pointLightAColor: "#8dc3e8",
    pointLightBColor: "#9eb7cb",
    bgColor: "#05080d",
    fogColor: "#05080d",
    overlayGradA: "rgba(141,195,232,0.10)",
    overlayGradB: "rgba(158,183,203,0.08)",
    overlayGradC: "rgba(66,78,92,0.08)",
    ambientIntensity: 0.07,
    directionalIntensity: 0.5,
    pointLightAIntensity: 7.4,
    pointLightBIntensity: 6.6,
    bloomIntensity: 0.44,
    bloomThreshold: 0.24,
    bloomSmoothing: 0.28,
  },
  blackMetal: {
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
    bgColor: "#020409",
    fogColor: "#020409",
    overlayGradA: "rgba(133,182,222,0.05)",
    overlayGradB: "rgba(111,146,180,0.045)",
    overlayGradC: "rgba(24,34,48,0.07)",
    ambientIntensity: 0.045,
    directionalIntensity: 0.62,
    pointLightAIntensity: 8.0,
    pointLightBIntensity: 6.9,
    bloomIntensity: 0.24,
    bloomThreshold: 0.34,
    bloomSmoothing: 0.31,
  },
} as const satisfies Record<string, BgColorTheme>;

// ここを current / cyberPurple で切り替えるだけで色変更・復帰できます。
const ACTIVE_COLOR_THEME: keyof typeof COLOR_THEMES = "blackMetal";
const THEME = COLOR_THEMES[ACTIVE_COLOR_THEME];

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

function Logo3D({ scale = SCALE }: { scale?: number }) {
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
      emissiveMats.push(baseMat);

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
      const phase = (t % BREATH_PERIOD_SEC) / BREATH_PERIOD_SEC; // 0..1
      // 0->0.5で吸う(拡大)、0.5->1で吐く(縮小)
      const inhale = phase < 0.5 ? phase / 0.5 : 1 - (phase - 0.5) / 0.5;
      const eased = 0.5 - 0.5 * Math.cos(inhale * Math.PI);
      // 拡大はせず、基準サイズから縮小して戻るだけにする
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
    <group position={POSITION} scale={scale}>
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

const SPLASH_LOGO_SCALE = 5.15;

/** 初回レンダループ後に1回だけ（スプラッシュで装飾より先に3Dを見せる用） */
function FirstFrameSignal({ onFirstFrame }: { onFirstFrame?: () => void }) {
  const fired = useRef(false);
  useFrame(() => {
    if (fired.current || !onFirstFrame) return;
    fired.current = true;
    onFirstFrame();
  });
  return null;
}

export type UniterzLogo3DBackgroundProps = {
  /** page: ランキング等の背景。splash: 起動スプラッシュ用（やや大きめ・DPR 抑制） */
  variant?: "page" | "splash";
  className?: string;
  /** splash 向け: WebGL 初回描画後に1回だけ呼ぶ */
  onFirstFrame?: () => void;
};

export default function UniterzLogo3DBackground({
  variant = "page",
  className,
  onFirstFrame,
}: UniterzLogo3DBackgroundProps) {
  const isSplash = variant === "splash";
  const logoScale = isSplash ? SPLASH_LOGO_SCALE : SCALE;
  const dpr: [number, number] = isSplash ? [1, 1.25] : [1, 1.5];

  return (
    <div
      className={[
        "pointer-events-none absolute inset-0 z-0 h-full w-full",
        className ?? "",
      ].join(" ")}
      style={{ backgroundColor: THEME.bgColor }}
    >
      <Canvas
        className="h-full w-full"
        dpr={dpr}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: "high-performance",
        }}
        camera={{ position: [0, 0, 8], fov: 28 }}
      >
        <color attach="background" args={[THEME.bgColor]} />
        <fog attach="fog" args={[THEME.fogColor, 9, 22]} />

        <ambientLight intensity={THEME.ambientIntensity} />

        <directionalLight
          position={[4, 6, 8]}
          intensity={THEME.directionalIntensity}
          color="#dcfffd"
        />

        <pointLight
          position={[-4, 4, 7]}
          intensity={THEME.pointLightAIntensity}
          color={THEME.pointLightAColor}
          distance={24}
        />

        <pointLight
          position={[4, -1, 7]}
          intensity={THEME.pointLightBIntensity}
          color={THEME.pointLightBColor}
          distance={22}
        />

        <pointLight
          position={[0, 2, -8]}
          intensity={0.8}
          color="#08202a"
          distance={18}
        />

        <Logo3D scale={logoScale} />

        <EffectComposer multisampling={0}>
          <Bloom
            blendFunction={BlendFunction.SCREEN}
            intensity={THEME.bloomIntensity}
            luminanceThreshold={THEME.bloomThreshold}
            luminanceSmoothing={THEME.bloomSmoothing}
            mipmapBlur
          />
        </EffectComposer>

        {onFirstFrame ? <FirstFrameSignal onFirstFrame={onFirstFrame} /> : null}
      </Canvas>

      {/* splash では Canvas の上に HTML を重ねず、まず3Dだけを見せる（装飾は AnimatedSplashScreen 側） */}
      {variant === "page" && (
        <>
          <div
            className="absolute inset-0"
            style={{
              /* 画面中央で帯状に明るくならないよう、広げて弱める */
              background: `
            radial-gradient(circle at 50% 22%, ${THEME.overlayGradA} 0%, rgba(0,0,0,0) 24%),
            radial-gradient(circle at 50% 58%, ${THEME.overlayGradB} 0%, rgba(0,0,0,0) 30%),
            radial-gradient(circle at 50% 42%, ${THEME.overlayGradC} 0%, rgba(0,0,0,0) 50%)
          `,
            }}
          />
          <div className="absolute inset-0 bg-black/12" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0)_0%,rgba(8,17,22,0.08)_55%,rgba(8,17,22,0.22)_100%)]" />
        </>
      )}
    </div>
  );
}