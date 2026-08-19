/**
 * 認証起動の 3D 世界 — 六角フィールド（試用）。
 * カメラ飛行は `AuthLandingCameraRigNative` のまま。
 * 戻す: `authLandingFieldVariant.ts` を `"court"`。
 */
import { useMemo, useRef, type ReactNode } from "react";
import { useFrame } from "@react-three/fiber/native";
import * as THREE from "three";
import {
  SPLASH_CAMERA3D_ACCENT,
  SPLASH_CAMERA3D_BG,
} from "@/lib/splash/camera3dPaths";

const CYAN = SPLASH_CAMERA3D_ACCENT;
const INK = "#E9FDFF";
const TEAL = "#7FB5C2";

type HexDef = {
  p: readonly [number, number, number];
  r: number;
  rot: readonly [number, number, number];
  mode: "wire" | "fill" | "both";
  opacity: number;
  color: string;
  nested?: readonly number[];
};

/** 左右・上下に散らす。中央のロゴ帯は空ける。 */
const DRIFT_HEXES: readonly HexDef[] = [
  { p: [-3.6, 1.8, 7.2], r: 0.62, rot: [0.2, 0.4, 0.1], mode: "wire", opacity: 0.55, color: CYAN },
  { p: [3.9, 2.4, 6.4], r: 0.48, rot: [-0.15, -0.3, 0.08], mode: "both", opacity: 0.22, color: INK },
  { p: [-4.4, 0.6, 5.1], r: 0.9, rot: [0.4, 0.2, -0.12], mode: "fill", opacity: 0.08, color: CYAN },
  { p: [4.2, 0.9, 4.6], r: 0.7, rot: [0.1, -0.5, 0.2], mode: "wire", opacity: 0.32, color: TEAL },
  { p: [-2.8, 3.1, 8.4], r: 0.34, rot: [0.6, 0.1, 0], mode: "wire", opacity: 0.4, color: INK },
  { p: [2.6, 3.4, 8.8], r: 0.28, rot: [-0.4, 0.2, 0.1], mode: "fill", opacity: 0.12, color: INK },
  { p: [-5.1, 2.0, 3.2], r: 1.15, rot: [0.08, 0.7, 0.05], mode: "fill", opacity: 0.06, color: CYAN },
  { p: [5.4, 1.5, 2.8], r: 1.05, rot: [-0.1, -0.55, 0], mode: "wire", opacity: 0.18, color: CYAN, nested: [0.62] },
  { p: [-3.1, -0.2, 3.8], r: 0.52, rot: [1.15, 0.2, 0], mode: "wire", opacity: 0.28, color: TEAL },
  { p: [3.4, -0.4, 3.4], r: 0.44, rot: [1.2, -0.15, 0], mode: "both", opacity: 0.16, color: CYAN },
  { p: [-2.2, 2.6, 1.6], r: 0.38, rot: [0.25, 0.35, -0.1], mode: "wire", opacity: 0.36, color: INK },
  { p: [2.4, 2.8, 1.2], r: 0.3, rot: [-0.2, -0.4, 0.08], mode: "fill", opacity: 0.1, color: TEAL },
  { p: [-4.8, 3.6, 9.6], r: 0.72, rot: [0.05, 0.15, 0.4], mode: "fill", opacity: 0.07, color: INK },
  { p: [4.6, 3.8, 10.2], r: 0.85, rot: [0.1, -0.2, -0.3], mode: "fill", opacity: 0.05, color: CYAN },
  { p: [-1.8, 0.4, -1.2], r: 0.42, rot: [0.9, 0.4, 0], mode: "wire", opacity: 0.3, color: CYAN },
  { p: [1.9, 0.55, -1.6], r: 0.36, rot: [0.85, -0.3, 0.1], mode: "wire", opacity: 0.24, color: TEAL },
  { p: [-3.8, 1.1, -3.4], r: 0.78, rot: [0.2, 0.5, 0.12], mode: "both", opacity: 0.14, color: CYAN, nested: [0.42] },
  { p: [4.0, 1.4, -4.0], r: 0.64, rot: [-0.15, -0.45, 0], mode: "wire", opacity: 0.22, color: INK },
];

/** 消失点まわり。飛行中の手前はほぼ動かさない。 */
const ANCHOR_HEXES: readonly HexDef[] = [
  { p: [0, 0.04, -2.2], r: 2.35, rot: [-Math.PI / 2, 0, 0.12], mode: "wire", opacity: 0.28, color: CYAN, nested: [1.45, 0.72] },
  { p: [0, 0.05, -6.4], r: 3.4, rot: [-Math.PI / 2, 0, 0], mode: "wire", opacity: 0.14, color: TEAL, nested: [2.1] },
  { p: [-2.6, 2.2, -8.2], r: 0.95, rot: [0.05, 0.1, 0.2], mode: "fill", opacity: 0.05, color: CYAN },
  { p: [2.8, 1.8, -8.8], r: 0.8, rot: [0.08, -0.12, -0.15], mode: "wire", opacity: 0.16, color: INK },
  { p: [0, 0.9, -11.2], r: 1.6, rot: [0, 0, 0], mode: "wire", opacity: 0.2, color: CYAN, nested: [1.05, 0.48] },
];

function hexGeometry(radius: number): THREE.BufferGeometry {
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= 6; i += 1) {
    const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
    pts.push(new THREE.Vector3(Math.cos(a) * radius, Math.sin(a) * radius, 0));
  }
  return new THREE.BufferGeometry().setFromPoints(pts);
}

function lineMat(color: string, opacity: number) {
  return (
    <lineBasicMaterial
      color={color}
      transparent
      opacity={opacity}
      toneMapped={false}
      blending={THREE.AdditiveBlending}
      depthWrite={false}
    />
  );
}

function HexMark({ def }: { def: HexDef }) {
  const nested = def.nested;
  const geos = useMemo(() => {
    const radii = [def.r, ...(nested ?? [])];
    return radii.map((r) => hexGeometry(r));
  }, [def.r, nested]);

  return (
    <group position={def.p} rotation={def.rot}>
      {(def.mode === "fill" || def.mode === "both") && (
        <mesh>
          <circleGeometry args={[def.r, 6]} />
          <meshBasicMaterial
            color={def.color}
            transparent
            opacity={def.mode === "both" ? Math.min(0.1, def.opacity * 0.45) : def.opacity}
            toneMapped={false}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
      {(def.mode === "wire" || def.mode === "both") &&
        geos.map((geo, i) => (
          <line key={i} geometry={geo}>
            {lineMat(def.color, def.opacity * (i === 0 ? 1 : 0.72))}
          </line>
        ))}
    </group>
  );
}

function Links() {
  const geo = useMemo(() => {
    const pts = [
      new THREE.Vector3(-3.6, 1.8, 7.2),
      new THREE.Vector3(-2.2, 2.6, 1.6),
      new THREE.Vector3(-1.8, 0.4, -1.2),
      new THREE.Vector3(0, 0.9, -11.2),
      new THREE.Vector3(1.9, 0.55, -1.6),
      new THREE.Vector3(2.4, 2.8, 1.2),
      new THREE.Vector3(3.9, 2.4, 6.4),
    ];
    return new THREE.BufferGeometry().setFromPoints(pts);
  }, []);

  return <line geometry={geo}>{lineMat(CYAN, 0.1)}</line>;
}

function DriftGroup({ children }: { children: ReactNode }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    const g = ref.current;
    if (!g) return;
    const t = clock.elapsedTime;
    g.rotation.y = Math.sin(t * 0.06) * 0.035;
    g.position.y = Math.sin(t * 0.09) * 0.06;
  });
  return <group ref={ref}>{children}</group>;
}

function FloorGlow() {
  return (
    <mesh position={[0, 0.01, -2.4]} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[4.2, 48]} />
      <meshBasicMaterial
        color={CYAN}
        transparent
        opacity={0.05}
        toneMapped={false}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  );
}

export default function AuthHexFieldSceneNative() {
  return (
    <group>
      <fog attach="fog" args={[SPLASH_CAMERA3D_BG, 10, 32]} />
      <ambientLight intensity={0.06} />
      <pointLight
        position={[0, 6.5, 2]}
        intensity={8}
        color={CYAN}
        distance={28}
        decay={2}
      />
      <FloorGlow />
      {ANCHOR_HEXES.map((def, i) => (
        <HexMark key={`a-${i}`} def={def} />
      ))}
      <DriftGroup>
        {DRIFT_HEXES.map((def, i) => (
          <HexMark key={`d-${i}`} def={def} />
        ))}
        <Links />
      </DriftGroup>
    </group>
  );
}
