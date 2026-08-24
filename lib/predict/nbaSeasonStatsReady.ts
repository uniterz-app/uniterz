/**
 * 26-27 など、開幕前はシーズン表スタッツを出さない判定。
 * Roster / Team Stats / Injury のプレビュー経路で共有する。
 */

import { GAME_SCHEDULE_SEASON } from "@/lib/games/gameScheduleSeason";
import { NBA_OPENING_NIGHT_DATE_KEY } from "@/lib/games/nbaOpeningNightPreviewGames";

/** Opening Night（JST 暦日）以降ならシーズン表スタッツを出してよい */
export function nbaSeasonStatsReady(now = new Date()): boolean {
  if (GAME_SCHEDULE_SEASON !== "2026-27") return true;
  const openMs = Date.parse(`${NBA_OPENING_NIGHT_DATE_KEY}T00:00:00+09:00`);
  return Number.isFinite(openMs) && now.getTime() >= openMs;
}
