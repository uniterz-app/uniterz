import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";
import { nbaSeasonStatsReady } from "@/lib/predict/nbaSeasonStatsReady";

/** standings と同じラベル — リーグ表スナップショット未作成時 */
export function preseasonLeagueStatsAsOfLabel(seasonKey: string): string {
  return `PRESEASON · ${seasonKey}`;
}

/** 当季レギュラー開幕前（シーズン表は BDL 空 · Last 10 も未集計） */
export function isNbaLeagueStatsPreseason(
  seasonKey: string = CURRENT_NBA_SEASON_KEY
): boolean {
  return seasonKey === CURRENT_NBA_SEASON_KEY && !nbaSeasonStatsReady();
}
