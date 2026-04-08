/** レーダー 0–10 スコアからパーセンタイル概算（10% 刻み・チャートと整合） */
export function approxPercentileFromRadar10(score: number): number {
  if (!Number.isFinite(score)) return 0;
  return Math.max(0, Math.min(100, Math.round(score * 10)));
}

export type PercentileTier = "elite" | "top" | "low";

export function formatPercentileDisplay(
  now: number,
  lang: "ja" | "en"
): { text: string; tier: PercentileTier } {
  if (now >= 90) {
    return lang === "en"
      ? { text: `Top ${100 - now}%`, tier: "elite" }
      : { text: `上位 ${100 - now}%`, tier: "elite" };
  }
  if (now >= 50) {
    return lang === "en"
      ? { text: `Top ${100 - now}%`, tier: "top" }
      : { text: `上位 ${100 - now}%`, tier: "top" };
  }
  return lang === "en"
    ? { text: `Bottom ${now}%`, tier: "low" }
    : { text: `下位 ${now}%`, tier: "low" };
}

export function percentileTierTextClass(tier: PercentileTier): string {
  switch (tier) {
    case "elite":
      return "text-amber-400";
    case "top":
      return "text-orange-400";
    default:
      return "text-sky-400";
  }
}
