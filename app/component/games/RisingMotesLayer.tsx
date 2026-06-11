"use client";

import { useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

/**
 * ページ遷移などで再マウントされても位相がリセットされないよう、
 * モジュール読込時刻を共通の時計として使う。
 */
const BG_CLOCK_START_MS =
  typeof performance !== "undefined" ? performance.now() : 0;

function bgElapsedSec(): number {
  if (typeof performance === "undefined") return 0;
  return (performance.now() - BG_CLOCK_START_MS) / 1000;
}

function cssResumeDelay(baseDelaySec: number): string {
  return `${(baseDelaySec - bgElapsedSec()).toFixed(2)}s`;
}

type RisingMote = {
  id: number;
  left: string;
  size: number;
  duration: number;
  delay: number;
  drift: number;
  startX: number;
  endX: number;
  opacityPeak: number;
  opacityMid: number;
  glow: number;
  background: string;
  shadow: string;
  blur: number;
  bottom: number;
};

function createSeededRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function pick<T>(rand: () => number, items: readonly T[]): T {
  return items[Math.floor(rand() * items.length)]!;
}

function lerp(rand: () => number, min: number, max: number): number {
  return min + rand() * (max - min);
}

function buildRisingMotes(count: number): RisingMote[] {
  const rand = createSeededRandom(0x6a09e667);
  const palettes = [
    { background: "rgba(187,247,208,0.92)", shadow: "rgba(74,222,128,0.82)" },
    { background: "rgba(153,246,228,0.88)", shadow: "rgba(34,211,238,0.78)" },
    { background: "rgba(240,253,244,0.84)", shadow: "rgba(134,239,172,0.72)" },
    { background: "rgba(167,243,208,0.9)", shadow: "rgba(52,211,153,0.8)" },
    { background: "rgba(204,251,241,0.86)", shadow: "rgba(45,212,191,0.74)" },
  ] as const;

  return Array.from({ length: count }, (_, id) => {
    const size = lerp(rand, 1.1, 4.6);
    const palette = pick(rand, palettes);
    const drift = lerp(rand, -28, 28);
    return {
      id,
      left: `${lerp(rand, 2, 97).toFixed(1)}%`,
      size: Number(size.toFixed(2)),
      duration: Number(lerp(rand, 14, 34).toFixed(1)),
      delay: Number(lerp(rand, 0, 20).toFixed(2)),
      drift: Number(drift.toFixed(1)),
      startX: Number(lerp(rand, -10, 10).toFixed(1)),
      endX: Number(lerp(rand, -14, 14).toFixed(1)),
      opacityPeak: Number(lerp(rand, 0.38, 0.92).toFixed(2)),
      opacityMid: Number(lerp(rand, 0.22, 0.68).toFixed(2)),
      glow: Number(lerp(rand, 3, 12).toFixed(1)),
      background: palette.background,
      shadow: palette.shadow,
      blur: Number(lerp(rand, 0, 0.65).toFixed(2)),
      bottom: Number(lerp(rand, -14, -2).toFixed(1)),
    };
  });
}

const RISING_MOTES = buildRisingMotes(20);
/** lite（モバイル）でも十分見える粒数 */
export const LITE_MOTE_COUNT = 16;

type RisingMotesLayerProps = {
  lite?: boolean;
};

/** 上昇する発光バーティクル（モート） */
export default function RisingMotesLayer({ lite = false }: RisingMotesLayerProps) {
  const reduceMotion = useReducedMotion();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  const phase = useMemo(
    () => ({
      motes: RISING_MOTES.map((m) =>
        hydrated ? cssResumeDelay(m.delay) : `${m.delay.toFixed(2)}s`,
      ),
    }),
    [hydrated],
  );

  if (hydrated && reduceMotion) return null;

  const motes = lite ? RISING_MOTES.slice(0, LITE_MOTE_COUNT) : RISING_MOTES;

  return (
    <div
      className="pointer-events-none absolute inset-0 z-[6] overflow-visible"
      aria-hidden
    >
      {motes.map((mote, i) => {
        const size = lite ? Math.max(mote.size, 2.2) : mote.size;
        const background = lite
          ? "rgba(187,247,208,0.92)"
          : mote.background;
        const boxShadow = lite
          ? "0 0 7px rgba(74,222,128,0.85)"
          : `0 0 ${mote.glow}px ${mote.shadow}`;

        return (
          <span
            key={mote.id}
            className="absolute rounded-full"
            style={
              {
                left: mote.left,
                bottom: lite ? -8 : mote.bottom,
                width: size,
                height: size,
                opacity: 0,
                willChange: "transform, opacity",
                background,
                boxShadow,
                filter:
                  !lite && mote.blur > 0.05
                    ? `blur(${mote.blur}px)`
                    : undefined,
                "--mote-drift": `${mote.drift}px`,
                "--mote-start-x": `${mote.startX}px`,
                "--mote-end-x": `${mote.endX}px`,
                animation: `gamesMoteRise ${mote.duration}s linear infinite`,
                animationDelay: phase.motes[i],
              } as React.CSSProperties
            }
          />
        );
      })}
    </div>
  );
}
