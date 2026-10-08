/**
 * 最新の NBA 試合日（米国東部の暦日）。閲覧者の TZ に関係なく全員同じ日になる。
 * 試合日インデックス（`/api/games/days`）の開始済み最新試合から決める。
 */

import { GAME_SCHEDULE_SEASON } from "@/lib/games/gameScheduleSeason";
import {
  fetchGameDayIndexShared,
  peekGameDayIndexShared,
} from "@/lib/games/fetchGameDayIndexShared";
import {
  parseDateKeyInTimeZone,
  TIMEZONE_ET,
  toDateKeyInTimeZone,
} from "@/lib/time/zonedTime";
import { shiftDateKeyInTimeZone } from "@/lib/games/gamesWindowRange";

/** インデックス未取得時: NBA の試合はほぼ東部の昼以降に始まる */
const FALLBACK_SLATE_LAG_MS = 12 * 60 * 60 * 1000;

export function resolveLatestNbaSlateDateKey(
  startMs: readonly number[] | null,
  nowMs: number = Date.now()
): string {
  let latest: number | null = null;
  for (const ms of startMs ?? []) {
    if (ms <= nowMs && (latest == null || ms > latest)) latest = ms;
  }
  return toDateKeyInTimeZone(
    new Date(latest ?? nowMs - FALLBACK_SLATE_LAG_MS),
    TIMEZONE_ET
  );
}

/** 試合日の [start, end)（米国東部 0:00 区切り） */
export function nbaSlateDayRange(
  dateKey: string
): { start: Date; end: Date } | null {
  const start = parseDateKeyInTimeZone(dateKey, TIMEZONE_ET);
  const nextKey = shiftDateKeyInTimeZone(dateKey, TIMEZONE_ET, 1);
  const end = nextKey ? parseDateKeyInTimeZone(nextKey, TIMEZONE_ET) : null;
  if (!start || !end) return null;
  return { start, end };
}

/** リザルト一覧の日付帯と同じ `2026.10.6` 形式 */
export function formatNbaSlateDateLabel(dateKey: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey);
  if (!m) return dateKey;
  return `${m[1]}.${Number(m[2])}.${Number(m[3])}`;
}

export function peekLatestNbaSlateDateKey(apiBaseUrl?: string | null): string {
  return resolveLatestNbaSlateDateKey(
    peekGameDayIndexShared({
      league: "nba",
      season: GAME_SCHEDULE_SEASON,
      apiBaseUrl,
    })
  );
}

export async function fetchLatestNbaSlateDateKey(
  apiBaseUrl?: string | null
): Promise<string> {
  try {
    const startMs = await fetchGameDayIndexShared({
      league: "nba",
      season: GAME_SCHEDULE_SEASON,
      apiBaseUrl,
    });
    return resolveLatestNbaSlateDateKey(startMs);
  } catch {
    return resolveLatestNbaSlateDateKey(null);
  }
}
