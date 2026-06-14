import type { MobileMetric } from "@/app/component/rankings/_data/mockRows";

export type RankingMetricAccent = {
  label: string;
  labelDim: string;
  border: string;
  value: string;
  bg: string;
  bar: { hi: string; lo: string; glow: string };
};

/** MyRankCard HUD セグメントバーと同じ指標色 */
export const RANKING_METRIC_ACCENT: Record<string, RankingMetricAccent> = {
  totalScore: {
    label: "#67e8f9",
    labelDim: "rgba(103,232,249,0.42)",
    border: "rgba(34,211,238,0.92)",
    value: "#ecfeff",
    bg: "rgba(34,211,238,0.1)",
    bar: { hi: "#8CF0FF", lo: "#0891b2", glow: "rgba(34,211,238,0.55)" },
  },
  winRate: {
    label: "#4ade80",
    labelDim: "rgba(74,222,128,0.42)",
    border: "rgba(74,222,128,0.92)",
    value: "#ecfdf5",
    bg: "rgba(74,222,128,0.1)",
    bar: { hi: "#86efac", lo: "#16a34a", glow: "rgba(34,197,94,0.5)" },
  },
  marginPrecision: {
    label: "#c4b5fd",
    labelDim: "rgba(196,181,253,0.42)",
    border: "rgba(167,139,250,0.92)",
    value: "#f5f3ff",
    bg: "rgba(167,139,250,0.1)",
    bar: { hi: "#ddd6fe", lo: "#7c3aed", glow: "rgba(139,92,246,0.5)" },
  },
  exactHits: {
    label: "#c4b5fd",
    labelDim: "rgba(196,181,253,0.42)",
    border: "rgba(167,139,250,0.92)",
    value: "#f5f3ff",
    bg: "rgba(167,139,250,0.1)",
    bar: { hi: "#ddd6fe", lo: "#7c3aed", glow: "rgba(139,92,246,0.5)" },
  },
  upsetScore: {
    label: "#fb923c",
    labelDim: "rgba(251,146,60,0.42)",
    border: "rgba(251,146,60,0.92)",
    value: "#fff7ed",
    bg: "rgba(251,146,60,0.1)",
    bar: { hi: "#fcd34d", lo: "#d97706", glow: "rgba(245,158,11,0.5)" },
  },
  streak: {
    label: "#86efac",
    labelDim: "rgba(134,239,172,0.42)",
    border: "rgba(57,255,136,0.85)",
    value: "#ecfdf5",
    bg: "rgba(57,255,136,0.12)",
    bar: { hi: "#bbf7d0", lo: "#22c55e", glow: "rgba(57,255,136,0.5)" },
  },
  goalScorerHits: {
    label: "#f9a8d4",
    labelDim: "rgba(249,168,212,0.42)",
    border: "rgba(244,114,182,0.92)",
    value: "#fdf2f8",
    bg: "rgba(244,114,182,0.12)",
    bar: { hi: "#fbcfe8", lo: "#db2777", glow: "rgba(244,114,182,0.5)" },
  },
};

const DEFAULT = RANKING_METRIC_ACCENT.totalScore;

export function rankingMetricAccent(
  metric: MobileMetric | string
): RankingMetricAccent {
  return RANKING_METRIC_ACCENT[metric] ?? DEFAULT;
}
