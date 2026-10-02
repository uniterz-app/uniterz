import { sampleUniterzUMarkPoints } from "../../../../../../lib/splash/sampleUniterzUMark";

/**
 * Void Corona 粒子パラメータ（完全生成）。
 * 静止座標ではなく「初期角・半径・自転・位相」を持ち、毎フレーム個別に動かす。
 */
export type VoidCoronaParticlePack = {
  count: number;
  angle0: Float32Array;
  /** 黒円縁=0 … 外周=1 */
  radiusNorm: Float32Array;
  spin: Float32Array;
  phase: Float32Array;
  /**
   * formU 用ターゲット（マーク中心相対、-0.5..0.5 を markSize に掛ける）。
   * 未割当なら 0。
   */
  targetOffX: Float32Array;
  targetOffY: Float32Array;
  /** 描画バッファ（worklet が x/y を書き換える） */
  buffer: { x: number; y: number }[];
};

export type VoidCoronaParticleLayers = {
  rimWhite: VoidCoronaParticlePack;
  pinCyan: VoidCoronaParticlePack;
  pinGold: VoidCoronaParticlePack;
  pinPink: VoidCoronaParticlePack;
  pinViolet: VoidCoronaParticlePack;
  pinSky: VoidCoronaParticlePack;
  pinMint: VoidCoronaParticlePack;
  pinPeach: VoidCoronaParticlePack;
  grainCool: VoidCoronaParticlePack;
  grainWarm: VoidCoronaParticlePack;
  bokehCyan: VoidCoronaParticlePack;
  bokehPink: VoidCoronaParticlePack;
  bokehGold: VoidCoronaParticlePack;
};

function mulberry32(seed: number) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function makePack(count: number): VoidCoronaParticlePack {
  return {
    count,
    angle0: new Float32Array(count),
    radiusNorm: new Float32Array(count),
    spin: new Float32Array(count),
    phase: new Float32Array(count),
    targetOffX: new Float32Array(count),
    targetOffY: new Float32Array(count),
    buffer: Array.from({ length: count }, () => ({ x: 0, y: 0 })),
  };
}

function fillPack(
  pack: VoidCoronaParticlePack,
  rand: () => number,
  radiusFn: (u: number, r: () => number) => number,
  spinScale: number
) {
  for (let i = 0; i < pack.count; i++) {
    pack.angle0[i] = rand() * Math.PI * 2;
    pack.radiusNorm[i] = Math.max(0, Math.min(1, radiusFn(rand(), rand)));
    pack.phase[i] = rand();
    pack.spin[i] = (rand() - 0.5) * 2 * spinScale;
  }
}

export function listVoidCoronaPacks(
  layers: VoidCoronaParticleLayers
): VoidCoronaParticlePack[] {
  return [
    layers.rimWhite,
    layers.pinCyan,
    layers.pinGold,
    layers.pinPink,
    layers.pinViolet,
    layers.pinSky,
    layers.pinMint,
    layers.pinPeach,
    layers.grainCool,
    layers.grainWarm,
    layers.bokehCyan,
    layers.bokehPink,
    layers.bokehGold,
  ];
}

/**
 * 参照画の密度感を維持しつつ、色別パックで多色表示。
 * 合計 roughly 2万（UI スレッドで毎フレーム更新可能な上限付近）。
 */
export function buildVoidCoronaParticleLayers(
  width: number,
  height: number
): VoidCoronaParticleLayers {
  const rand = mulberry32(0xc0ffee ^ Math.round(width * 17 + height * 31));

  // 白は少なめ、色パックを多めにして「いろんな色」がはっきり見えるようにする
  const rimWhite = makePack(900);
  const pinCyan = makePack(2600);
  const pinGold = makePack(2600);
  const pinPink = makePack(2600);
  const pinViolet = makePack(2400);
  const pinSky = makePack(2200);
  const pinMint = makePack(2000);
  const pinPeach = makePack(1800);
  const grainCool = makePack(1100);
  const grainWarm = makePack(1100);
  const bokehCyan = makePack(240);
  const bokehPink = makePack(240);
  const bokehGold = makePack(220);

  const nearRim = (u: number) => Math.pow(u, 2.4) * 0.12;
  const core = (u: number) => Math.pow(u, 2.0) * 0.5;
  const mid = (u: number) => 0.12 + Math.pow(u, 1.15) * 0.55;
  const far = (u: number) => 0.35 + Math.pow(u, 0.85) * 0.65;
  const haze = (u: number) => 0.4 + Math.pow(u, 0.65) * 0.55;
  const dust = (u: number) => Math.pow(u, 0.5);

  fillPack(rimWhite, rand, nearRim, 0.55);
  fillPack(pinCyan, rand, core, 0.9);
  fillPack(pinGold, rand, mid, 1.05);
  fillPack(pinPink, rand, core, 0.95);
  fillPack(pinViolet, rand, mid, 1.1);
  fillPack(pinSky, rand, far, 1.2);
  fillPack(pinMint, rand, mid, 1.0);
  fillPack(pinPeach, rand, far, 1.25);
  fillPack(grainCool, rand, dust, 1.55);
  fillPack(grainWarm, rand, dust, 1.6);
  fillPack(bokehCyan, rand, haze, 0.55);
  fillPack(bokehPink, rand, haze, 0.5);
  fillPack(bokehGold, rand, haze, 0.45);

  return {
    rimWhite,
    pinCyan,
    pinGold,
    pinPink,
    pinViolet,
    pinSky,
    pinMint,
    pinPeach,
    grainCool,
    grainWarm,
    bokehCyan,
    bokehPink,
    bokehGold,
  };
}

export type VoidCoronaMotionMode =
  | "converge"
  | "materialize"
  | "portal"
  | "pulse"
  | "pass"
  | "formU";

/** formU 終端: ロック / 粒子のままホールド / 散開 */
export type VoidCoronaFormUExit = "lock" | "hold" | "scatter";

/** 全レイヤーに U マーク目標点を割り当てる */
export function attachVoidCoronaUTargets(
  layers: VoidCoronaParticleLayers
): VoidCoronaParticleLayers {
  const packs = listVoidCoronaPacks(layers);
  let total = 0;
  for (const p of packs) total += p.count;
  const samples = sampleUniterzUMarkPoints(total);
  let k = 0;
  for (const pack of packs) {
    for (let i = 0; i < pack.count; i++) {
      const s = samples[k++] ?? { x: 0, y: 0 };
      pack.targetOffX[i] = s.x;
      pack.targetOffY[i] = s.y;
    }
  }
  return layers;
}

/**
 * 1 粒子の位置を mode × progress で計算。
 * （描画側 worklet にも同等ロジックあり。ここは共有ドキュメント用）
 */
export function voidCoronaParticleXY(
  mode: VoidCoronaMotionMode,
  t: number,
  breath: number,
  angle0: number,
  radiusNorm: number,
  spin: number,
  phase: number,
  cx: number,
  cy: number,
  voidR: number,
  span: number,
  targetOffX = 0,
  targetOffY = 0,
  markSize = 0,
  formExit: VoidCoronaFormUExit = "lock"
): { x: number; y: number } {
  let rn = radiusNorm;
  let ang = angle0;

  if (mode === "converge") {
    const local = Math.min(1, Math.max(0, (t - phase * 0.38) / 0.72));
    const ease = local * local * (3 - 2 * local);
    ang = angle0 + spin * (0.35 + t * 2.1) + ease * spin * 2.4;
    rn = radiusNorm * (1 - ease * 0.97) + 0.012 * ease;
  } else if (mode === "materialize") {
    const local = Math.min(1, Math.max(0, (t - phase * 0.3) / 0.68));
    const ease = local * local * (3 - 2 * local);
    ang = angle0 + spin * t * 2.6 + (1 - ease) * (phase - 0.5) * 1.4;
    const target = 0.035 + phase * 0.09;
    rn = radiusNorm * (1 - ease) + target * ease;
  } else if (mode === "portal") {
    const kick = Math.max(0, t - 0.32 - phase * 0.22);
    ang = angle0 + spin * (0.25 + t * 1.0) + kick * spin * 1.8;
    rn = radiusNorm * (1 + kick * kick * (2.6 + Math.abs(spin) * 1.2));
  } else if (mode === "pulse") {
    const wobble = Math.sin((t * 2.4 + phase) * Math.PI * 2) * 0.5 + 0.5;
    ang = angle0 + spin * (0.4 + t * 0.65) + breath * spin * 0.35;
    rn =
      radiusNorm *
      (1 +
        breath * 0.06 * (1 - radiusNorm) +
        wobble * 0.025 * (spin >= 0 ? 1 : -1));
  } else if (mode === "formU") {
    const shrinkLocal = Math.min(1, Math.max(0, (t - phase * 0.18) / 0.42));
    const shrink = shrinkLocal * shrinkLocal * (3 - 2 * shrinkLocal);
    ang = angle0 + spin * (0.3 + t * 1.6) + shrink * spin * 1.2;
    rn = radiusNorm * (1 - shrink * 0.88) + 0.04 * (1 - shrink);
    const sx = cx + Math.cos(ang) * (voidR + Math.max(0, rn) * span);
    const sy = cy + Math.sin(ang) * (voidR + Math.max(0, rn) * span);
    const tx = cx + targetOffX * markSize;
    const ty = cy + targetOffY * markSize;
    const formLocal = Math.min(
      1,
      Math.max(0, (t - 0.28 - phase * 0.22) / 0.48)
    );
    const form = formLocal * formLocal * (3 - 2 * formLocal);
    let x = sx + (tx - sx) * form;
    let y = sy + (ty - sy) * form;
    if (formExit === "scatter" && t > 0.78) {
      const kick = Math.min(1, Math.max(0, (t - 0.78) / 0.22));
      const ease = kick * kick;
      x += Math.cos(ang + spin) * ease * span * (0.35 + Math.abs(spin));
      y += Math.sin(ang + spin) * ease * span * (0.35 + Math.abs(spin));
    }
    return { x, y };
  } else {
    const local = Math.min(1, Math.max(0, (t - phase * 0.22) / 0.82));
    const ease = local * local;
    ang =
      angle0 + spin * (0.2 + t * 1.25) + ease * (spin >= 0 ? 0.85 : -0.85);
    rn = radiusNorm * (0.82 + ease * (1.55 + Math.abs(spin)));
  }

  const r = voidR + Math.max(0, rn) * span;
  return {
    x: cx + Math.cos(ang) * r,
    y: cy + Math.sin(ang) * r,
  };
}
