/** Web `RisingMotesLayer.tsx` と同じシード付きモート配置 */
export type RisingMoteSpec = {
  id: number;
  leftPct: number;
  size: number;
  durationMs: number;
  delayMs: number;
  drift: number;
  startX: number;
  endX: number;
  opacityPeak: number;
  background: string;
  shadowColor: string;
  shadowRadius: number;
};

function createSeededRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function lerp(rand: () => number, min: number, max: number): number {
  return min + rand() * (max - min);
}

export function buildRisingMotesNative(count: number): RisingMoteSpec[] {
  const rand = createSeededRandom(0x6a09e667);
  const palette = {
    background: "rgba(187,247,208,0.92)",
    shadowColor: "rgba(74,222,128,0.85)",
  };

  return Array.from({ length: count }, (_, id) => {
    const size = Math.max(lerp(rand, 1.1, 4.6), 2.2);
    const drift = lerp(rand, -28, 28);
    return {
      id,
      leftPct: lerp(rand, 2, 97),
      size: Number(size.toFixed(2)),
      durationMs: Math.round(lerp(rand, 14, 34) * 1000),
      delayMs: Math.round(lerp(rand, 0, 20) * 1000),
      drift: Number(drift.toFixed(1)),
      startX: Number(lerp(rand, -10, 10).toFixed(1)),
      endX: Number(lerp(rand, -14, 14).toFixed(1)),
      opacityPeak: Number(lerp(rand, 0.38, 0.92).toFixed(2)),
      background: palette.background,
      shadowColor: palette.shadowColor,
      shadowRadius: 7,
    };
  });
}

export const RISING_MOTES_NATIVE = buildRisingMotesNative(20);
export const LITE_MOTE_COUNT_NATIVE = 16;
