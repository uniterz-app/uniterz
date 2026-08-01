// 月次レポート表紙 — 月間順位の上位帯アクセント。
// My Rank の順位帯マイルストーン（TOP10 / 20 / 50 / 100）に揃える。

export type MonthlyReportRankBand =
  | "top10"
  | "top20"
  | "top50"
  | "top100"
  | "field";

export type MonthlyReportRankBandAccent = {
  band: MonthlyReportRankBand;
  /** バッジ文言（field は空） */
  label: string | null;
  main: string;
  border: string;
  tint: string;
  glow: string;
  text: string;
};

export function resolveMonthlyReportRankBand(rank: number): MonthlyReportRankBand {
  if (!Number.isFinite(rank) || rank < 1) return "field";
  const r = Math.floor(rank);
  if (r <= 10) return "top10";
  if (r <= 20) return "top20";
  if (r <= 50) return "top50";
  if (r <= 100) return "top100";
  return "field";
}

export function monthlyReportRankBandAccent(
  rank: number
): MonthlyReportRankBandAccent {
  const band = resolveMonthlyReportRankBand(rank);
  switch (band) {
    case "top10":
      return {
        band,
        label: "TOP10",
        main: "#fcd34d",
        border: "rgba(252,211,77,0.58)",
        tint: "rgba(252,211,77,0.11)",
        glow: "rgba(252,211,77,0.34)",
        text: "#fde68a",
      };
    case "top20":
      return {
        band,
        label: "TOP20",
        main: "#e2e8f0",
        border: "rgba(226,232,240,0.52)",
        tint: "rgba(226,232,240,0.10)",
        glow: "rgba(226,232,240,0.28)",
        text: "#f1f5f9",
      };
    case "top50":
      return {
        band,
        label: "TOP50",
        main: "#22d3ee",
        border: "rgba(34,211,238,0.55)",
        tint: "rgba(34,211,238,0.10)",
        glow: "rgba(34,211,238,0.34)",
        text: "#67e8f9",
      };
    case "top100":
      return {
        band,
        label: "TOP100",
        main: "#a3e635",
        border: "rgba(163,230,53,0.52)",
        tint: "rgba(163,230,53,0.10)",
        glow: "rgba(163,230,53,0.30)",
        text: "#bef264",
      };
    default:
      return {
        band,
        label: null,
        main: "#22d3ee",
        border: "rgba(34,211,238,0.38)",
        tint: "rgba(34,211,238,0.05)",
        glow: "rgba(34,211,238,0.18)",
        text: "rgba(165,243,252,0.78)",
      };
  }
}
