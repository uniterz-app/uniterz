import type { Language } from "@/lib/i18n/language";
import type { MobileMetric } from "@/app/component/rankings/_data/mockRows";

export function metricLabel(metric: MobileMetric, lang: Language): string {
  if (lang === "en") {
    if (metric === "totalScore") return "Total Score";
    if (metric === "winRate") return "Win Rate";
    if (metric === "marginPrecision") return "Score Precision";
    if (metric === "upsetScore") return "Upset Score";
    if (metric === "streak") return "Win Streak";
  }
  if (metric === "totalScore") return "総合スコア";
  if (metric === "winRate") return "勝率";
  if (metric === "marginPrecision") return "スコア精度";
  if (metric === "upsetScore") return "アップセットスコア";
  if (metric === "streak") return "連勝";

  return "";
}

export function upsetShortLabel(lang: Language): string {
  if (lang === "en") return "Upset";
  return "アップセット";
}

export function streakShortLabel(lang: Language): string {
  if (lang === "en") return "Win Streak";
  return "連勝中";
}

export function postsLabel(lang: Language): string {
  if (lang === "en") return "Posts";
  return "投稿";
}
