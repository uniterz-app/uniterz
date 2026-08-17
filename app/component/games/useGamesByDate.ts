"use client";

import { useEffect, useMemo, useState } from "react";
import type { League } from "@/lib/leagues";
import { normalizeLeague } from "@/lib/leagues";
import {
  getCalendarMonthRangeInTimeZone,
  getZonedYMD,
  toDateKeyInTimeZone,
} from "@/lib/time/zonedTime";
import { fetchGamesWindowShared } from "@/lib/games/fetchGamesWindowShared";

const GAMES_BY_DAY_CACHE_TTL_MS = 5 * 60 * 1000;
const GAMES_BY_MONTH_CACHE_TTL_MS = 5 * 60 * 1000;
const gamesByDayCache = new Map<
  string,
  { games: any[]; savedAt: number }
>();

const gamesByMonthCache = new Map<
  string,
  { games: any[]; savedAt: number }
>();

export function writeGamesByMonthCacheEntry(cacheKey: string, games: any[]) {
  gamesByMonthCache.set(cacheKey, { games, savedAt: Date.now() });
}

/** games 行の開始日（指定タイムゾーンの暦日キー） */
export function gameRowStartDateKeyInTimeZone(
  game: { startAtJst?: unknown },
  timeZone: string,
): string | null {
  const t = game?.startAtJst;
  if (!t) return null;
  let d: Date | null = null;
  if (t instanceof Date) d = t;
  else if (typeof (t as { toDate?: () => Date }).toDate === "function")
    d = (t as { toDate: () => Date }).toDate();
  else if (
    typeof t === "object" &&
    t !== null &&
    typeof (t as { __ts?: unknown }).__ts === "number"
  ) {
    d = new Date((t as { __ts: number }).__ts);
  }
  if (!d || Number.isNaN(+d)) return null;
  return toDateKeyInTimeZone(d, timeZone);
}

/** アンカー日の属する暦月の全試合を1回で取得（日付切替はクライアント側で絞り込み） */
export function useGamesByCalendarMonth(
  rawLeague: League,
  monthAnchor: Date,
  timeZone: string,
) {
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setErr] = useState<string | null>(null);

  const league = useMemo(() => normalizeLeague(rawLeague), [rawLeague]);

  const monthWindowKey = useMemo(() => {
    const { year, month } = getZonedYMD(monthAnchor, timeZone);
    return `${year}-${String(month).padStart(2, "0")}`;
  }, [monthAnchor, timeZone]);

  const rangeKeys = useMemo(() => {
    const { start, end } = getCalendarMonthRangeInTimeZone(
      monthAnchor,
      timeZone,
    );
    return {
      fromDateKey: toDateKeyInTimeZone(start, timeZone),
      toDateKey: toDateKeyInTimeZone(end, timeZone),
    };
  }, [monthAnchor, timeZone]);

  useEffect(() => {
    let alive = true;
    const ac = new AbortController();

    async function load() {
      setErr(null);

      const cacheKey = `${league}|${timeZone}|${monthWindowKey}`;
      const hit = gamesByMonthCache.get(cacheKey);
      const fresh =
        hit && Date.now() - hit.savedAt < GAMES_BY_MONTH_CACHE_TTL_MS;
      if (fresh) {
        if (!alive) return;
        setGames(hit.games);
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const payload = await fetchGamesWindowShared({
          league,
          timeZone,
          fromDateKey: rangeKeys.fromDateKey,
          toDateKey: rangeKeys.toDateKey,
          signal: ac.signal,
        });

        if (!alive) return;

        gamesByMonthCache.set(cacheKey, {
          games: payload.rows,
          savedAt: Date.now(),
        });
        setGames(payload.rows);
        setLoading(false);
      } catch (e: unknown) {
        if (!alive || ac.signal.aborted) return;
        setErr(e instanceof Error ? e.message : "unknown error");
        setLoading(false);
      }
    }

    load();

    return () => {
      alive = false;
      ac.abort();
    };
  }, [league, monthWindowKey, rangeKeys, timeZone]);

  return { loading, error, games };
}

export function useGamesByDate(
  rawLeague: League,
  dayDate: Date | null,
  timeZone: string,
  enabled = true,
) {
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setErr] = useState<string | null>(null);

  const league = useMemo(() => normalizeLeague(rawLeague), [rawLeague]);

  useEffect(() => {
    let alive = true;
    const ac = new AbortController();

    async function load() {
      if (!enabled || !dayDate) {
        if (!alive) return;
        setErr(null);
        setGames([]);
        setLoading(false);
        return;
      }

      setErr(null);

      const dayKey = toDateKeyInTimeZone(dayDate, timeZone);
      const cacheKey = `${league}|${timeZone}|${dayKey}`;
      const hit = gamesByDayCache.get(cacheKey);
      const cacheFresh =
        hit && Date.now() - hit.savedAt < GAMES_BY_DAY_CACHE_TTL_MS;
      if (cacheFresh) {
        if (!alive) return;
        setGames(hit.games);
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const payload = await fetchGamesWindowShared({
          league,
          timeZone,
          anchorDateKey: dayKey,
          plusMinus: 0,
          signal: ac.signal,
        });

        if (!alive) return;

        gamesByDayCache.set(cacheKey, {
          games: payload.rows,
          savedAt: Date.now(),
        });
        setGames(payload.rows);
        setLoading(false);
      } catch (e: unknown) {
        if (!alive || ac.signal.aborted) return;
        setErr(e instanceof Error ? e.message : "unknown error");
        setLoading(false);
      }
    }

    load();

    return () => {
      alive = false;
      ac.abort();
    };
  }, [enabled, league, dayDate, timeZone]);

  return { loading, error, games };
}
