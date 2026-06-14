import type { CSSProperties } from "react";
import type { Language } from "@/lib/i18n/language";
import type { MobileMetric } from "@/app/component/rankings/_data/mockRows";
import { t } from "@/lib/i18n/t";
import { streakShortLabel, upsetShortLabel } from "@/lib/i18n/rankings";

export type CyberRankPalette = {
  accent: string;
  accentGlow: string;
  stroke: string;
  textFill: string;
  glowFilter: string;
  barFill: string;
  barGlow: boolean;
  firstPlaceFrame: boolean;
};

/** 1位=金、順位が下がるほどアクセント・グローが薄くフェード */
export function cyberRankPalette(rank: number): CyberRankPalette {
  if (rank === 1) {
    return {
      accent: "#FFD65A",
      accentGlow: "rgba(255,214,90,0.72)",
      stroke: "#F59E0B",
      textFill: "#FFFBEB",
      glowFilter:
        "drop-shadow(0 0 2px #FBBF24) drop-shadow(0 0 12px rgba(251,191,36,0.82)) drop-shadow(0 0 24px rgba(255,214,90,0.38))",
      barFill: "#B8FF3C",
      barGlow: true,
      firstPlaceFrame: true,
    };
  }

  if (rank === 2) {
    return {
      accent: "#FCD34D",
      accentGlow: "rgba(252,211,77,0.55)",
      stroke: "rgba(251,146,60,0.88)",
      textFill: "rgba(255,251,235,0.96)",
      glowFilter:
        "drop-shadow(0 0 8px rgba(251,191,36,0.5)) drop-shadow(0 0 16px rgba(255,43,214,0.22))",
      barFill: "rgba(184,255,60,0.82)",
      barGlow: true,
      firstPlaceFrame: false,
    };
  }

  if (rank === 3) {
    return {
      accent: "#FB923C",
      accentGlow: "rgba(251,146,60,0.48)",
      stroke: "rgba(255,43,214,0.72)",
      textFill: "rgba(255,255,255,0.94)",
      glowFilter:
        "drop-shadow(0 0 8px rgba(255,43,214,0.48)) drop-shadow(0 0 14px rgba(255,43,214,0.18))",
      barFill: "rgba(184,255,60,0.68)",
      barGlow: true,
      firstPlaceFrame: false,
    };
  }

  const t = Math.min(1, (rank - 4) / 14);
  const accentAlpha = 0.88 - t * 0.52;
  const glowAlpha = 0.52 - t * 0.38;

  return {
    accent: `rgba(255, 43, 214, ${accentAlpha})`,
    accentGlow: `rgba(255, 43, 214, ${glowAlpha})`,
    stroke: `rgba(255, 43, 214, ${0.72 - t * 0.42})`,
    textFill: `rgba(255, 255, 255, ${0.9 - t * 0.28})`,
    glowFilter: `drop-shadow(0 0 ${6 + t * 2}px rgba(255,43,214,${0.42 - t * 0.28})) drop-shadow(0 0 ${12 + t * 4}px rgba(255,43,214,${0.16 - t * 0.1}))`,
    barFill: `rgba(184,255,60,${0.62 - t * 0.38})`,
    barGlow: rank <= 6,
    firstPlaceFrame: false,
  };
}

export type CyberRankNumVariant = "list" | "tower";

function cyberRankNumFontSize(
  rank: number,
  compact: boolean,
  variant: CyberRankNumVariant
): string {
  if (variant === "tower") {
    return compact
      ? rank <= 3
        ? "2.65rem"
        : "2.4rem"
      : rank <= 3
        ? "3.5rem"
        : "3.2rem";
  }
  return compact
    ? rank <= 3
      ? "1.85rem"
      : "1.65rem"
    : rank <= 3
      ? "2.55rem"
      : "2.25rem";
}

export function cyberRankNumStyle(
  rank: number,
  compact: boolean,
  variant: CyberRankNumVariant = "list"
): CSSProperties {
  const p = cyberRankPalette(rank);
  return {
    fontSize: cyberRankNumFontSize(rank, compact, variant),
    transform: "skewX(-12deg)",
    display: "inline-block",
    color: p.textFill,
    WebkitTextStroke: `1.2px ${p.stroke}`,
    paintOrder: "stroke fill",
    filter: p.glowFilter,
    letterSpacing: "0.05em",
  };
}

export const CYBER_LIST_CYAN = "#00F5FF";
export const CYBER_LIST_MAGENTA = "#FF2BD6";

export function cyberMetricTag(metric: MobileMetric, lang: Language): string {
  if (metric === "totalScore") return t(lang).rankings.pts.toUpperCase();
  if (metric === "winRate") return "WIN%";
  if (metric === "marginPrecision") return "PREC";
  if (metric === "exactHits") return "EXACT";
  if (metric === "upsetScore") return upsetShortLabel(lang).toUpperCase();
  if (metric === "streak") return streakShortLabel(lang).toUpperCase();
  if (metric === "goalScorerHits") return "GOALS";
  return "STAT";
}
