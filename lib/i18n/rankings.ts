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

  // ja
  if (metric === "totalScore") return "総合スコア";
  if (metric === "winRate") return "勝率";
  if (metric === "marginPrecision") return "スコア精度";
  if (metric === "upsetScore") return "アップセットスコア";
  if (metric === "streak") return "連勝";

  return "";
}

export function upsetShortLabel(lang: Language): string {
  // UIが横幅小さめなので短縮形にする
  return lang === "en" ? "Upset" : "アップセット";
}

export function streakShortLabel(lang: Language): string {
  return lang === "en" ? "Win Streak" : "連勝中";
}

export function postsLabel(lang: Language): string {
  return lang === "en" ? "Posts" : "投稿";
}

