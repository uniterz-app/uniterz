/**
 * 3D カメラスプラッシュ — 位置 / lookAt スプラインと尺。
 * 点は少数（多いと震える）。UI から分離。
 */
import * as THREE from "three";

export const SPLASH_CAMERA3D_ACCENT = "#00F5FF";
export const SPLASH_CAMERA3D_MAGENTA = "#FF2BD6";
export const SPLASH_CAMERA3D_BG = "#030609";

export type SplashCamera3dVariantId =
  | "arenaDive"
  | "neonTunnel"
  | "broadcastLock"
  | "orbitalStrike"
  | "authField";

export type SplashCamera3dVariantMeta = {
  id: SplashCamera3dVariantId;
  label: string;
  labelJa: string;
  noteJa: string;
  /** カメラ移動尺（秒） */
  durationSec: number;
  /** 開始 FOV */
  fovStart: number;
  /** 終了 FOV（ロック時に絞る案用） */
  fovEnd: number;
  /** lookAt をロゴへ寄せ始める進行度 (0–1) */
  lookAtBlendFrom: number;
  /** ロゴ目標（lookAt 収束先） */
  logoLookAt: readonly [number, number, number];
};

export const SPLASH_CAMERA3D_VARIANTS: readonly SplashCamera3dVariantMeta[] = [
  {
    id: "arenaDive",
    label: "A · Arena Dive",
    labelJa: "会場ダイブ",
    noteJa: "上空リング照明からコート中央のロゴへ急降下。",
    durationSec: 6.2,
    fovStart: 58,
    fovEnd: 32,
    lookAtBlendFrom: 0.55,
    logoLookAt: [0, 0.35, 0],
  },
  {
    id: "neonTunnel",
    label: "B · Neon Tunnel",
    labelJa: "トンネル突破",
    noteJa: "ネオン六角トンネルを抜け、消失点のロゴをくぐる。",
    durationSec: 5.8,
    fovStart: 72,
    fovEnd: 38,
    lookAtBlendFrom: 0.62,
    logoLookAt: [0, 0, -2],
  },
  {
    id: "broadcastLock",
    label: "C · Broadcast Lock",
    labelJa: "放送ロック",
    noteJa: "手前 HUD から奥の金属ロゴへドリーインしてロック。",
    durationSec: 6.0,
    fovStart: 42,
    fovEnd: 28,
    lookAtBlendFrom: 0.4,
    logoLookAt: [0, 0.05, 0],
  },
  {
    id: "orbitalStrike",
    label: "D · Orbital Strike",
    labelJa: "周回撃ち込み",
    noteJa: "半周してリムライト → 閃光プッシュインで静止。",
    durationSec: 6.4,
    fovStart: 36,
    fovEnd: 26,
    lookAtBlendFrom: 0.35,
    logoLookAt: [0, 0.08, 0],
  },
  {
    id: "authField",
    label: "E · Auth Field",
    labelJa: "認証フィールド",
    noteJa: "夜間コートの奥へプッシュインして認証へ着地。",
    durationSec: 0.96,
    fovStart: 46,
    fovEnd: 34,
    lookAtBlendFrom: 0.55,
    logoLookAt: [0, 0.18, -1.2],
  },
] as const;

export function getSplashCamera3dMeta(
  id: SplashCamera3dVariantId
): SplashCamera3dVariantMeta {
  const found = SPLASH_CAMERA3D_VARIANTS.find((v) => v.id === id);
  if (!found) return SPLASH_CAMERA3D_VARIANTS[0];
  return found;
}

type PathDef = {
  position: readonly (readonly [number, number, number])[];
  lookAt: readonly (readonly [number, number, number])[];
};

const PATHS: Record<SplashCamera3dVariantId, PathDef> = {
  arenaDive: {
    position: [
      [0, 14.5, 6.5],
      [1.2, 9.5, 4.2],
      [-0.8, 5.2, 3.6],
      [0.4, 2.4, 4.8],
      [0, 1.15, 5.6],
    ],
    lookAt: [
      [0, 2.5, 0],
      [0, 1.2, 0],
      [0, 0.6, 0],
      [0, 0.4, 0],
      [0, 0.35, 0],
    ],
  },
  neonTunnel: {
    position: [
      [0, 0, 18],
      [0.15, 0.05, 12],
      [-0.1, -0.05, 7],
      [0, 0, 2.4],
      [0, 0, -0.6],
      [0, 0, -3.2],
    ],
    lookAt: [
      [0, 0, 10],
      [0, 0, 5],
      [0, 0, 0],
      [0, 0, -2],
      [0, 0, -4],
      [0, 0, -6],
    ],
  },
  broadcastLock: {
    position: [
      [0, 0.15, 7.2],
      [0.05, 0.1, 5.4],
      [0, 0.08, 3.8],
      [0, 0.06, 2.6],
    ],
    lookAt: [
      [0, 0.1, 2.5],
      [0, 0.08, 1.2],
      [0, 0.05, 0.2],
      [0, 0.05, 0],
    ],
  },
  orbitalStrike: {
    position: [
      [4.8, 1.4, 3.2],
      [3.2, 0.9, 4.6],
      [0.6, 0.55, 5.4],
      [-1.8, 0.35, 4.2],
      [-0.4, 0.2, 3.0],
      [0, 0.12, 2.35],
    ],
    lookAt: [
      [0, 0.2, 0],
      [0, 0.15, 0],
      [0, 0.1, 0],
      [0, 0.08, 0],
      [0, 0.08, 0],
      [0, 0.08, 0],
    ],
  },
  /** Rest: コートを見下ろす。Dock: 地平へ前進（周回しない） */
  authField: {
    position: [
      [0, 4.4, 11.2],
      [0.1, 2.8, 7.2],
      [-0.05, 1.7, 4.4],
      [0, 1.15, 2.6],
    ],
    lookAt: [
      [0, 0.2, -2.4],
      [0, 0.18, -1.6],
      [0, 0.16, -1.2],
      [0, 0.14, -0.8],
    ],
  },
};

function toCurve(
  pts: readonly (readonly [number, number, number])[]
): THREE.CatmullRomCurve3 {
  return new THREE.CatmullRomCurve3(
    pts.map(([x, y, z]) => new THREE.Vector3(x, y, z)),
    false,
    "catmullrom",
    0.35
  );
}

const curveCache = new Map<
  SplashCamera3dVariantId,
  { position: THREE.CatmullRomCurve3; lookAt: THREE.CatmullRomCurve3 }
>();

export function getSplashCamera3dCurves(id: SplashCamera3dVariantId) {
  let cached = curveCache.get(id);
  if (!cached) {
    const def = PATHS[id];
    cached = {
      position: toCurve(def.position),
      lookAt: toCurve(def.lookAt),
    };
    curveCache.set(id, cached);
  }
  return cached;
}

/** ease-out-expo（カメラ進行用） */
export function easeOutExpo(t: number): number {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  return 1 - Math.pow(2, -10 * t);
}

/** smoothstep */
export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}
