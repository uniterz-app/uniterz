import type { CommunityMetric, CommunityPeriodType } from "./types";

export function metricLabel(
  m: CommunityMetric,
  lang: "ja" | "en"
): string {
  if (lang === "en") {
    switch (m) {
      case "totalPoints":
        return "Total points";
      case "totalPrecision":
        return "Score precision";
      case "totalUpset":
        return "Upset points";
      case "winRate":
        return "Win rate";
      case "activeWinStreak":
        return "Win streak";
      default:
        return m;
    }
  }
  switch (m) {
    case "totalPoints":
      return "総合ポイント";
    case "totalPrecision":
      return "スコア精度";
    case "totalUpset":
      return "アップセット";
    case "winRate":
      return "勝率";
    case "activeWinStreak":
      return "連勝";
    default:
      return m;
  }
}

export function periodLabel(
  p: CommunityPeriodType,
  lang: "ja" | "en"
): string {
  if (lang === "en") {
    switch (p) {
      case "all_time":
        return "All time";
      case "calendar_month":
        return "This month (JST)";
      case "rolling_30d":
        return "Last 30 days (JST)";
      default:
        return p;
    }
  }
  switch (p) {
    case "all_time":
      return "累計";
    case "calendar_month":
      return "今月（JST）";
    case "rolling_30d":
      return "直近30日（JST）";
    default:
      return p;
  }
}
