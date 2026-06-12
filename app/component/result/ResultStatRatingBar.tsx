"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  CyberSlantedSegBar,
  type CyberSegAccent,
} from "@/app/component/rankings/CyberSlantedSegBar";
import { rankingMetricAccent } from "@/lib/rankings/rankingMetricAccent";

function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}

/** リザルト指標 → ランキング指標キー */
function resultMetricToRankingKey(
  metricKey?: "scorePrecision" | "upsetPoints" | "pointsV3"
): string {
  switch (metricKey) {
    case "scorePrecision":
      return "marginPrecision";
    case "upsetPoints":
      return "upsetScore";
    case "pointsV3":
      return "totalScore";
    default:
      return "totalScore";
  }
}

/** contrast 帯：比率に応じてランキング指標色を切り替え */
function contrastRankingKey(r: number): string {
  const x = clamp01(r);
  if (x < 0.28) return "totalScore";
  if (x < 0.52) return "winRate";
  if (x < 0.76) return "upsetScore";
  return "marginPrecision";
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const h = hex.replace("#", "").trim();
  if (!h) return null;
  const v = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  if (v.length !== 6 || !/^[0-9a-fA-F]+$/.test(v)) return null;
  const n = parseInt(v, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function teamAccent(hex: string): CyberSegAccent {
  const rgb = hexToRgb(hex) ?? { r: 59, g: 130, b: 246 };
  return {
    border: `rgba(${rgb.r},${rgb.g},${rgb.b},0.92)`,
    glow: `rgba(${rgb.r},${rgb.g},${rgb.b},0.5)`,
    bg: `rgba(${rgb.r},${rgb.g},${rgb.b},0.1)`,
  };
}

function toCyberAccent(
  metricKey: string
): CyberSegAccent {
  const a = rankingMetricAccent(metricKey);
  return {
    border: a.border,
    glow: a.bar.glow,
    bg: a.bg,
  };
}

export type ResultStatRatingBarProps = {
  /** 0–1（value / max） */
  ratio: number;
  animateMs?: number;
  delayMs?: number;
  size?: "sm" | "md" | "lg";
  /** contrast: 比率に応じてランキング指標色を切り替え */
  tone?: "default" | "contrast";
  /** 指定時はチーム色のセグメント */
  teamBaseHex?: string;
  /** リザルト指標別の固定色（ランキング指標色に対応） */
  metricKey?: "scorePrecision" | "upsetPoints" | "pointsV3";
  /** セグメント本数（ランキング既定 10） */
  segmentCount?: 5 | 10;
  /**
   * 指定時は内部の IntersectionObserver を使わず、true になったタイミングで点灯開始
   */
  animationActive?: boolean;
};

export default function ResultStatRatingBar({
  ratio,
  delayMs = 0,
  size = "md",
  teamBaseHex,
  tone = "default",
  metricKey,
  segmentCount = 10,
  animationActive,
}: ResultStatRatingBarProps) {
  const r = clamp01(ratio);
  const pct = r * 100;
  const rootRef = useRef<HTMLDivElement>(null);
  const [ioInView, setIoInView] = useState(false);
  const controlled = animationActive !== undefined;
  const inView = controlled ? animationActive : ioInView;

  const accent: CyberSegAccent = teamBaseHex
    ? teamAccent(teamBaseHex)
    : tone === "contrast"
      ? toCyberAccent(contrastRankingKey(r))
      : toCyberAccent(resultMetricToRankingKey(metricKey));

  useEffect(() => {
    if (controlled) return;
    const el = rootRef.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      (entries) => {
        const e = entries[0];
        if (e?.isIntersecting) {
          setIoInView(true);
          obs.disconnect();
        }
      },
      { root: null, rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, [controlled]);

  return (
    <div ref={rootRef} className="flex min-w-0 flex-1 items-center" aria-hidden>
      <CyberSlantedSegBar
        pct={pct}
        segments={segmentCount}
        compact={size === "sm"}
        tall={size === "lg"}
        enter={inView}
        enterDelay={delayMs / 1000}
        accent={accent}
        maxWidthClass="max-w-full"
      />
    </div>
  );
}
