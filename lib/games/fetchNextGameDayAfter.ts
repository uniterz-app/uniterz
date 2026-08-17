import type { League } from "@/lib/leagues";
import { normalizeLeague } from "@/lib/leagues";
import {
  getDayRangeInTimeZone,
  parseDateKeyInTimeZone,
  toDateKeyInTimeZone,
} from "@/lib/time/zonedTime";
import { fetchGamesWindowShared } from "@/lib/games/fetchGamesWindowShared";
import { GAMES_NEAREST_DAY_LOOKAHEAD_DAYS } from "@/lib/games/gamesWindowConstants";
import { shiftDateKeyInTimeZone } from "@/lib/games/gamesWindowRange";
import { toDateOrNull } from "@/lib/games/transform";

/** window 1本あたりの探索日数（games/window の limit 200 を超えない幅） */
const CHUNK_DAYS = 14;

function earliestDateKeyFromRows(
  rows: Record<string, unknown>[],
  timeZone: string
): string | null {
  let best: string | null = null;
  for (const row of rows) {
    const d = toDateOrNull(row.startAtJst);
    if (!d) continue;
    const key = toDateKeyInTimeZone(d, timeZone);
    if (!best || key < best) best = key;
  }
  return best;
}

function latestDateKeyFromRows(
  rows: Record<string, unknown>[],
  timeZone: string
): string | null {
  let best: string | null = null;
  for (const row of rows) {
    const d = toDateOrNull(row.startAtJst);
    if (!d) continue;
    const key = toDateKeyInTimeZone(d, timeZone);
    if (!best || key > best) best = key;
  }
  return best;
}

/**
 * 指定暦日の終端（翌日0時排他）より後に始まる最初の試合の「暦日0時」（timeZone 基準）。
 * 日付ストリップが ±数日のみのとき、次の試合日ジャンプ用。
 */
export async function fetchNextGameDayAfterLocalDay(params: {
  league: League;
  timeZone: string;
  /** この日を終えたあと（翌0時以降）の試合を探す */
  day: Date;
  apiBaseUrl?: string | null;
  signal?: AbortSignal;
}): Promise<Date | null> {
  const league = normalizeLeague(params.league);
  const { end } = getDayRangeInTimeZone(params.day, params.timeZone);
  let fromDateKey = toDateKeyInTimeZone(end, params.timeZone);
  const horizon = shiftDateKeyInTimeZone(
    fromDateKey,
    params.timeZone,
    GAMES_NEAREST_DAY_LOOKAHEAD_DAYS
  );
  if (!horizon || horizon <= fromDateKey) return null;

  while (fromDateKey < horizon) {
    const toDateKey =
      shiftDateKeyInTimeZone(fromDateKey, params.timeZone, CHUNK_DAYS) ??
      horizon;
    const sliceEnd = toDateKey < horizon ? toDateKey : horizon;
    if (sliceEnd <= fromDateKey) break;

    const payload = await fetchGamesWindowShared({
      league,
      timeZone: params.timeZone,
      fromDateKey,
      toDateKey: sliceEnd,
      apiBaseUrl: params.apiBaseUrl,
      signal: params.signal,
      includePeers: false,
    });
    const key = earliestDateKeyFromRows(payload.rows, params.timeZone);
    if (key) return parseDateKeyInTimeZone(key, params.timeZone);
    fromDateKey = sliceEnd;
  }
  return null;
}

/**
 * 指定暦日の始端（当日0時）より前に始まる最後の試合の「暦日0時」（timeZone 基準）。
 * 直近の次試合が無い場合に、最後の試合日へフォールバックするために使う。
 */
export async function fetchPreviousGameDayBeforeLocalDay(params: {
  league: League;
  timeZone: string;
  /** この日の前（当日0時より前）の試合を探す */
  day: Date;
  apiBaseUrl?: string | null;
  signal?: AbortSignal;
}): Promise<Date | null> {
  const league = normalizeLeague(params.league);
  const { start } = getDayRangeInTimeZone(params.day, params.timeZone);
  let toDateKey = toDateKeyInTimeZone(start, params.timeZone);
  const horizon = shiftDateKeyInTimeZone(
    toDateKey,
    params.timeZone,
    -GAMES_NEAREST_DAY_LOOKAHEAD_DAYS
  );
  if (!horizon || horizon >= toDateKey) return null;

  while (toDateKey > horizon) {
    const fromDateKey =
      shiftDateKeyInTimeZone(toDateKey, params.timeZone, -CHUNK_DAYS) ??
      horizon;
    const sliceStart = fromDateKey > horizon ? fromDateKey : horizon;
    if (sliceStart >= toDateKey) break;

    const payload = await fetchGamesWindowShared({
      league,
      timeZone: params.timeZone,
      fromDateKey: sliceStart,
      toDateKey,
      apiBaseUrl: params.apiBaseUrl,
      signal: params.signal,
      includePeers: false,
    });
    const key = latestDateKeyFromRows(payload.rows, params.timeZone);
    if (key) return parseDateKeyInTimeZone(key, params.timeZone);
    toDateKey = sliceStart;
  }
  return null;
}

/**
 * アンカー日に一番近い試合日キー。同距離なら未来側。
 * チュートリアルは専用試合を持たず、開始日の最寄りカードで案内する。
 */
export function pickNearestDateKey(
  anchorKey: string,
  keys: readonly string[]
): string | null {
  const unique = [...new Set(keys.filter(Boolean))].sort();
  if (unique.length === 0) return null;
  if (unique.includes(anchorKey)) return anchorKey;

  const anchor = parseDateKeyInTimeZone(anchorKey, "UTC");
  if (!anchor) return unique[0] ?? null;
  const anchorTs = anchor.getTime();

  let best: string | null = null;
  let bestAbs = Number.POSITIVE_INFINITY;
  for (const key of unique) {
    const d = parseDateKeyInTimeZone(key, "UTC");
    if (!d) continue;
    const abs = Math.abs(d.getTime() - anchorTs);
    if (abs < bestAbs) {
      best = key;
      bestAbs = abs;
      continue;
    }
    if (abs === bestAbs && best && key >= anchorKey) {
      best = key;
    }
  }
  return best;
}

/** 指定暦日の前後を探し、一番近い試合日を返す（当日は含まない） */
export async function fetchNearestGameDayToLocalDay(params: {
  league: League;
  timeZone: string;
  day: Date;
  apiBaseUrl?: string | null;
  signal?: AbortSignal;
}): Promise<Date | null> {
  const [next, prev] = await Promise.all([
    fetchNextGameDayAfterLocalDay(params),
    fetchPreviousGameDayBeforeLocalDay(params),
  ]);
  const keys: string[] = [];
  if (next) keys.push(toDateKeyInTimeZone(next, params.timeZone));
  if (prev) keys.push(toDateKeyInTimeZone(prev, params.timeZone));
  const nearest = pickNearestDateKey(
    toDateKeyInTimeZone(params.day, params.timeZone),
    keys
  );
  return nearest ? parseDateKeyInTimeZone(nearest, params.timeZone) : null;
}
