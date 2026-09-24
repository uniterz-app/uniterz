/**
 * リーグ表の年切替ナブ（◀ 25-26 ▶）。
 * CyberSlantedTab 本体は触らない。
 */
import {
  CURRENT_NBA_SEASON_KEY,
  nbaLeagueStatsSeasonKeys,
  nbaSeasonShortLabel,
} from "@/lib/rankings/nbaSeason";

export function nbaLeagueStatsSeasonOptions(
  from: string = CURRENT_NBA_SEASON_KEY
): readonly string[] {
  return nbaLeagueStatsSeasonKeys(from);
}

/** リーグ表の初期表示シーズン（カレンダー今季） */
export function nbaLeagueStatsDefaultSeasonKey(
  calendarSeasonKey: string = CURRENT_NBA_SEASON_KEY
): string {
  return calendarSeasonKey;
}

export function nbaLeagueStatsSeasonNavState(seasonKey: string): {
  seasonKey: string;
  label: string;
  index: number;
  canGoNewer: boolean;
  canGoOlder: boolean;
  newerKey: string | null;
  olderKey: string | null;
} {
  const options = nbaLeagueStatsSeasonOptions();
  const idx = Math.max(0, options.indexOf(seasonKey));
  const key = options[idx] ?? options[0]!;
  return {
    seasonKey: key,
    label: nbaSeasonShortLabel(key),
    index: idx,
    canGoNewer: idx > 0,
    canGoOlder: idx < options.length - 1,
    newerKey: idx > 0 ? options[idx - 1]! : null,
    olderKey: idx < options.length - 1 ? options[idx + 1]! : null,
  };
}
