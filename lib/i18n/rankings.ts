import type { Language } from "@/lib/i18n/language";
import { t } from "@/lib/i18n/t";
import type { MobileMetric } from "@/app/component/rankings/_data/mockRows";

export function metricLabel(metric: MobileMetric, lang: Language): string {
  const m = t(lang).rankings;
  if (metric === "totalScore") return m.totalScore;
  if (metric === "winRate") return m.winRate;
  if (metric === "marginPrecision") return m.scorePrecision;
  if (metric === "upsetScore") return m.upsetScore;
  if (metric === "streak") return m.winStreak;
  if (metric === "goalScorerHits") return m.goalScorerHits;
  return "";
}

export function upsetShortLabel(lang: Language): string {
  return t(lang).rankings.upset;
}

export function streakShortLabel(lang: Language): string {
  return t(lang).rankings.winStreak;
}

export function postsLabel(lang: Language): string {
  return t(lang).common.posts;
}
