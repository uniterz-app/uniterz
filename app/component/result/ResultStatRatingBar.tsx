"use client";

import React, { useEffect, useRef, useState } from "react";

const DEFAULT_SEGMENTS = 5;

function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}

/** 各セグメントが担当する全体比率のうち、埋まる割合 0–1（例: 5本なら各20%、10本なら各10%） */
function segmentFill(
  overallRatio: number,
  index: number,
  segmentCount: number
) {
  const pos = overallRatio * segmentCount;
  return clamp01(pos - index);
}

type BarPalette = { core: string; edge: string; shadow: string };

/** 低→高でシアン〜バイオレット〜マゼンタのネオン寄り（サイバー調） */
function paletteForRatio(r: number): BarPalette {
  const x = clamp01(r);
  if (x < 0.2) {
    return {
      core: "rgba(34,211,238,0.22)",
      edge: "rgba(15,118,110,0.55)",
      shadow: "0 0 10px rgba(34,211,238,0.2)",
    };
  }
  if (x < 0.45) {
    return {
      core: "rgba(34,211,238,0.88)",
      edge: "rgba(8,145,178,0.92)",
      shadow: "0 0 14px rgba(34,211,238,0.45), 0 0 6px rgba(56,189,248,0.35)",
    };
  }
  if (x < 0.7) {
    return {
      core: "rgba(129,140,248,0.9)",
      edge: "rgba(59,130,246,0.95)",
      shadow: "0 0 16px rgba(129,140,248,0.5), 0 0 8px rgba(56,189,248,0.4)",
    };
  }
  return {
    core: "rgba(232,121,249,0.92)",
    edge: "rgba(168,85,247,0.95)",
    shadow: "0 0 18px rgba(232,121,249,0.55), 0 0 10px rgba(34,211,238,0.25)",
  };
}

/** ランキング podium 等：トラックとフィルともにコントラスト高め */
function paletteContrastForRatio(r: number): BarPalette {
  const x = clamp01(r);
  if (x < 0.28) {
    return {
      core: "rgba(34,211,238,0.98)",
      edge: "rgba(8,145,178,1)",
      shadow: "0 0 10px rgba(34,211,238,0.55)",
    };
  }
  if (x < 0.52) {
    return {
      core: "rgba(52,211,153,0.96)",
      edge: "rgba(5,150,105,1)",
      shadow: "0 0 12px rgba(52,211,153,0.5)",
    };
  }
  if (x < 0.76) {
    return {
      core: "rgba(250,204,21,0.96)",
      edge: "rgba(202,138,4,1)",
      shadow: "0 0 12px rgba(250,204,21,0.45)",
    };
  }
  return {
    core: "rgba(251,113,133,0.98)",
    edge: "rgba(225,29,72,1)",
    shadow: "0 0 14px rgba(251,113,133,0.55)",
  };
}

const WHITE = { r: 255, g: 255, b: 255 };
const BLACK = { r: 0, g: 0, b: 0 };

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const h = hex.replace("#", "").trim();
  if (!h) return null;
  const v =
    h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  if (v.length !== 6 || !/^[0-9a-fA-F]+$/.test(v)) return null;
  const n = parseInt(v, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function mixRgb(
  a: { r: number; g: number; b: number },
  b: { r: number; g: number; b: number },
  t: number
) {
  const u = clamp01(t);
  return {
    r: Math.round(a.r + (b.r - a.r) * u),
    g: Math.round(a.g + (b.g - a.g) * u),
    b: Math.round(a.b + (b.b - a.b) * u),
  };
}

/** 左→右（segment 0→last）でチーム色が徐々に濃くなる */
function teamSegmentPalette(
  hex: string,
  segmentIndex: number,
  numSegments: number
): BarPalette {
  const base = hexToRgb(hex) ?? { r: 59, g: 130, b: 246 };
  const t = numSegments <= 1 ? 0 : segmentIndex / (numSegments - 1);
  const lifted = mixRgb(WHITE, base, 0.42 - t * 0.2);
  const sunk = mixRgb(base, BLACK, 0.26 + t * 0.54);
  const core = mixRgb(lifted, sunk, 0.52);
  const edge = mixRgb(sunk, BLACK, 0.38);
  const ca = 0.4 + t * 0.5;
  const ea = 0.7 + t * 0.26;
  return {
    core: `rgba(${core.r},${core.g},${core.b},${ca})`,
    edge: `rgba(${edge.r},${edge.g},${edge.b},${ea})`,
    shadow: `0 0 ${8 + t * 12}px rgba(${base.r},${base.g},${base.b},${
      0.16 + t * 0.34
    })`,
  };
}

export type ResultStatRatingBarProps = {
  /** 0–1（value / max） */
  ratio: number;
  animateMs?: number;
  delayMs?: number;
  size?: "sm" | "md";
  /** contrast: トラック明るめ＋シアン→緑→黄→赤の高コントラスト帯 */
  tone?: "default" | "contrast";
  /** 指定時はセグメントごとにチーム色を左（やや明るめ）→右（濃く）へ変化 */
  teamBaseHex?: string;
  /** セグメント本数（既定 5＝20%×5、10＝10%×10） */
  segmentCount?: 5 | 10;
};

const SKEW_DEG = -14;

export default function ResultStatRatingBar({
  ratio,
  animateMs = 480,
  delayMs = 0,
  size = "md",
  teamBaseHex,
  segmentCount = DEFAULT_SEGMENTS,
  tone = "default",
}: ResultStatRatingBarProps) {
  const n = segmentCount;
  const r = clamp01(ratio);
  const cyberPal =
    tone === "contrast" ? paletteContrastForRatio(r) : paletteForRatio(r);
  const h = size === "sm" ? "h-[7px]" : "h-[9px]";
  const trackBg =
    tone === "contrast" ? "bg-white/14" : "bg-white/[0.06]";
  const rootRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      (entries) => {
        const e = entries[0];
        if (e?.isIntersecting) {
          setInView(true);
          obs.disconnect();
        }
      },
      { root: null, rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const paletteAt = (i: number): BarPalette =>
    teamBaseHex ? teamSegmentPalette(teamBaseHex, i, n) : cyberPal;

  return (
    <div
      ref={rootRef}
      className="flex min-w-0 flex-1 items-center px-1"
      style={{ transform: `skewX(${SKEW_DEG}deg)` }}
      aria-hidden
    >
      <div className="flex min-w-0 flex-1 gap-px">
        {Array.from({ length: n }, (_, i) => {
          const pal = paletteAt(i);
          const target = segmentFill(r, i, n);
          const w = inView ? target * 100 : 0;
          return (
            <div
              key={i}
              className={[
                "min-w-0 flex-1 overflow-hidden rounded-[2px]",
                trackBg,
                h,
              ].join(" ")}
            >
              <div
                className="h-full origin-left rounded-[2px] transition-[width] ease-out"
                style={{
                  width: `${w}%`,
                  transitionDuration: `${animateMs}ms`,
                  transitionDelay: `${delayMs}ms`,
                  background: `linear-gradient(180deg, ${pal.edge} 0%, ${pal.core} 48%, ${pal.edge} 100%)`,
                  boxShadow: inView && target > 0.02 ? pal.shadow : "none",
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
