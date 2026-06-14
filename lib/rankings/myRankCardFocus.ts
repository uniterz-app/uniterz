import type { MobileMetric } from "@/app/component/rankings/_data/mockRows";
import type { MyRankCardFrameTone } from "@/app/component/rankings/MyRankCardFrame";
import { RANKINGS_CYAN } from "@/lib/rankings/rankingsCyberTheme";

const LIME = "#b8ff3c";
const LIME_DIM = "rgba(184,255,60,0.35)";
const LIME_GLOW = "rgba(184,255,60,0.55)";
const CYAN = RANKINGS_CYAN;
const CYAN_DIM = "rgba(34,211,238,0.35)";
const CYAN_GLOW = "rgba(34,211,238,0.55)";

export const MY_RANK_TOP_PERCENT_SHOW_MAX = 50;

export type MyRankCardAccent = {
  primary: string;
  dim: string;
  glow: string;
  hairline: string;
  towerBg: string;
  avatarBg: string;
};

export function myRankCardAccent(tone: MyRankCardFrameTone): MyRankCardAccent {
  if (tone === "down") {
    return {
      primary: CYAN,
      dim: CYAN_DIM,
      glow: CYAN_GLOW,
      hairline: "rgba(34,211,238,0.22)",
      towerBg:
        "linear-gradient(180deg, rgba(34,211,238,0.08) 0%, rgba(34,211,238,0.02) 55%, transparent 100%)",
      avatarBg: "rgba(34,211,238,0.05)",
    };
  }
  if (tone === "neutral") {
    return {
      primary: "#CBD5E1",
      dim: "rgba(148,163,184,0.25)",
      glow: "rgba(148,163,184,0.35)",
      hairline: "rgba(255,255,255,0.12)",
      towerBg:
        "linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.015) 55%, transparent 100%)",
      avatarBg: "rgba(255,255,255,0.03)",
    };
  }
  return {
    primary: LIME,
    dim: LIME_DIM,
    glow: LIME_GLOW,
    hairline: "rgba(184,255,60,0.18)",
    towerBg:
      "linear-gradient(180deg, rgba(184,255,60,0.07) 0%, rgba(184,255,60,0.02) 55%, transparent 100%)",
    avatarBg: "rgba(184,255,60,0.04)",
  };
}

export function computeMyRankTopPercent(
  rank: number,
  totalEntries: number
): string | null {
  if (totalEntries <= 0 || rank < 1) return null;
  const pct = (rank / totalEntries) * 100;
  if (pct > MY_RANK_TOP_PERCENT_SHOW_MAX) return null;
  const clamped = Math.min(
    MY_RANK_TOP_PERCENT_SHOW_MAX,
    Math.max(0.1, pct)
  );
  return clamped < 10 ? clamped.toFixed(1) : String(Math.round(clamped));
}

export const MY_RANK_METRIC_HUD_LABEL: Record<MobileMetric, string> = {
  totalScore: "TOTAL PTS",
  winRate: "WIN%",
  marginPrecision: "PREC",
  exactHits: "EXACT",
  upsetScore: "UPSET",
  streak: "STREAK",
  goalScorerHits: "SCORER",
};

export type MyRankStatsSource = {
  totalPosts?: number;
  totalPoints?: number;
  totalPrecision?: number;
  totalUpset?: number;
};

export function deriveMyRankListAvgRow(
  source: MyRankStatsSource | null | undefined
) {
  const posts = source?.totalPosts ?? 0;
  if (posts <= 0) return undefined;
  return {
    avgTotalScore: (source?.totalPoints ?? 0) / posts,
    avgMarginPrecision: (source?.totalPrecision ?? 0) / posts,
    avgUpsetScore: (source?.totalUpset ?? 0) / posts,
  };
}
