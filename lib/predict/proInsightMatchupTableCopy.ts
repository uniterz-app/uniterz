/**
 * Pro Insight MATCHUP 表の文言（Web / Native 共通）。
 */
import type { LocalizedLang } from "@/lib/i18n/localize";
import type { ProInsightMatchupStatTable } from "@/lib/predict/proInsightNarrativeTypes";
import { nbaSeasonShortLabel } from "@/lib/rankings/nbaSeason";

export function matchupRankText(rank: number, lang: LocalizedLang): string {
  return lang === "ja" ? `${rank}位` : `#${rank}`;
}

/** 表の下の注記（出典シーズン · 順位の母数 · 色の意味） */
export function matchupTableCaption(
  table: Pick<ProInsightMatchupStatTable, "seasonKey" | "teamCount">,
  lang: LocalizedLang
): string {
  if (lang === "ja") {
    const season = table.seasonKey
      ? `${nbaSeasonShortLabel(table.seasonKey)}シーズン · `
      : "";
    return `${season}順位はリーグ${table.teamCount}チーム中 · 色付きが有利な側`;
  }
  const season = table.seasonKey ? `${table.seasonKey} · ` : "";
  return `${season}Rank among ${table.teamCount} teams · Colored side has the edge`;
}
