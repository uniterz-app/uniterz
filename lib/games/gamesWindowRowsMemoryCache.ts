/**
 * Games 窓の「選択日を覆う TTL キャッシュ」（Web useGameDays / Native useTodayGames 共用）。
 * ネット取得自体の dedupe は fetchGamesWindowShared 側。
 */

import {
  getPlusMinusDaysRangeInTimeZone,
  parseDateKeyInTimeZone,
  toDateKeyInTimeZone,
} from "@/lib/time/zonedTime";
import { GAMES_WINDOW_PLUS_MINUS_DEFAULT } from "@/lib/games/gamesWindowConstants";

export const GAMES_WINDOW_ROWS_CACHE_TTL_MS = 5 * 60 * 1000;

export type GamesWindowRowsCacheEntry = {
  rows: Record<string, unknown>[];
  peerRows: Record<string, unknown>[];
  /** 初回取得時のアンカー日キー（WC は固定窓キー） */
  windowKey: string;
  startKey: string;
  endKey: string;
  savedAt: number;
};

const rowsCache = new Map<string, GamesWindowRowsCacheEntry>();

export function buildGamesWindowRowsCacheKey(opts: {
  league: string;
  timeZone: string;
  /** WC: 固定。それ以外: アンカー日 */
  windowKey: string;
  plusMinus?: number;
  isWc?: boolean;
}): string {
  if (opts.isWc || opts.league === "wc") {
    return `${opts.league}|${opts.timeZone}|wc-page-window-v1`;
  }
  const pm = opts.plusMinus ?? GAMES_WINDOW_PLUS_MINUS_DEFAULT;
  return `${opts.league}|${opts.timeZone}|${opts.windowKey}|pm${pm}`;
}

export function writeGamesWindowRowsCache(
  key: string,
  entry: Omit<GamesWindowRowsCacheEntry, "savedAt"> & { savedAt?: number }
): void {
  rowsCache.set(key, {
    ...entry,
    savedAt: entry.savedAt ?? Date.now(),
  });
}

export function readGamesWindowRowsCache(
  key: string
): GamesWindowRowsCacheEntry | null {
  const hit = rowsCache.get(key);
  if (!hit) return null;
  if (Date.now() - hit.savedAt >= GAMES_WINDOW_ROWS_CACHE_TTL_MS) return null;
  return hit;
}

function rangeKeysForAnchor(
  anchorKey: string,
  timeZone: string,
  plusMinus: number
): { startKey: string; endKey: string } | null {
  const anchor = parseDateKeyInTimeZone(anchorKey, timeZone);
  if (!anchor) return null;
  const { start, end } = getPlusMinusDaysRangeInTimeZone(
    anchor,
    timeZone,
    plusMinus
  );
  return {
    startKey: toDateKeyInTimeZone(start, timeZone),
    endKey: toDateKeyInTimeZone(end, timeZone),
  };
}

function entryCoversDateKey(
  entry: GamesWindowRowsCacheEntry,
  dateKey: string,
  timeZone: string,
  plusMinus: number
): boolean {
  if (entry.startKey && entry.endKey) {
    return dateKey >= entry.startKey && dateKey < entry.endKey;
  }
  const derived = rangeKeysForAnchor(entry.windowKey, timeZone, plusMinus);
  if (!derived) return false;
  return dateKey >= derived.startKey && dateKey < derived.endKey;
}

/** 同一リーグで selectedDate を覆う新鮮な窓を探す（日付チップ移動の再取得抑制） */
export function findCoveringGamesWindowRows(opts: {
  league: string;
  timeZone: string;
  selectedDateKey: string;
  plusMinus?: number;
}): GamesWindowRowsCacheEntry | null {
  const plusMinus = opts.plusMinus ?? GAMES_WINDOW_PLUS_MINUS_DEFAULT;
  const prefix = `${opts.league}|${opts.timeZone}|`;
  const now = Date.now();
  for (const [key, entry] of rowsCache.entries()) {
    if (!key.startsWith(prefix)) continue;
    if (now - entry.savedAt >= GAMES_WINDOW_ROWS_CACHE_TTL_MS) continue;
    const rowsHaveId =
      entry.rows.length === 0 ||
      typeof (entry.rows[0] as { id?: string } | undefined)?.id === "string";
    if (!rowsHaveId) continue;
    if (
      !entryCoversDateKey(
        entry,
        opts.selectedDateKey,
        opts.timeZone,
        plusMinus
      )
    ) {
      continue;
    }
    return entry;
  }
  return null;
}

/** 延長マージ後に同じキーへ上書き */
export function patchGamesWindowRowsCache(
  key: string,
  patch: Partial<
    Pick<
      GamesWindowRowsCacheEntry,
      "rows" | "peerRows" | "startKey" | "endKey" | "windowKey"
    >
  >
): void {
  const prev = rowsCache.get(key);
  if (!prev) return;
  rowsCache.set(key, {
    ...prev,
    ...patch,
    savedAt: Date.now(),
  });
}
