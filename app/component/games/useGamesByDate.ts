"use client";

import { useEffect, useMemo, useState } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  orderBy,
  query,
  where,
  limit,
  Timestamp,
} from "firebase/firestore";

import type { League } from "@/lib/leagues";
import { normalizeLeague } from "@/lib/leagues";
import {
  getCalendarMonthRangeInTimeZone,
  getDayRangeInTimeZone,
  getZonedYMD,
  toDateKeyInTimeZone,
} from "@/lib/time/zonedTime";
import { GAME_SCHEDULE_SEASON } from "@/lib/games/gameScheduleSeason";

const GAMES_BY_DAY_CACHE_TTL_MS = 5 * 60 * 1000;
const GAMES_BY_MONTH_CACHE_TTL_MS = 5 * 60 * 1000;
/** 暦月1本の games 取得上限（useGameDays と同程度） */
const GAMES_MONTH_QUERY_LIMIT = 500;
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
  if (t instanceof Timestamp) d = t.toDate();
  else if (typeof (t as { toDate?: () => Date }).toDate === "function")
    d = (t as Timestamp).toDate();
  else if (t instanceof Date) d = t;
  if (!d) return null;
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

  const range = useMemo(() => {
    const { start, end } = getCalendarMonthRangeInTimeZone(
      monthAnchor,
      timeZone,
    );
    return {
      startTs: Timestamp.fromDate(start),
      endTs: Timestamp.fromDate(end),
    };
  }, [monthAnchor, timeZone]);

  useEffect(() => {
    let alive = true;

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
        const ref = collection(db, "games");

        const q = query(
          ref,
          where("league", "==", league),
          where("season", "==", GAME_SCHEDULE_SEASON),
          where("startAtJst", ">=", range.startTs),
          where("startAtJst", "<", range.endTs),
          orderBy("startAtJst", "asc"),
          limit(GAMES_MONTH_QUERY_LIMIT),
        );

        const snap = await getDocs(q);

        if (!alive) return;

        const rows = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));

        gamesByMonthCache.set(cacheKey, { games: rows, savedAt: Date.now() });
        setGames(rows);
        setLoading(false);
      } catch (e: unknown) {
        if (!alive) return;
        setErr(e instanceof Error ? e.message : "unknown error");
        setLoading(false);
      }
    }

    load();

    return () => {
      alive = false;
    };
  }, [league, monthWindowKey, range, timeZone]);

  return { loading, error, games };
}

export function useGamesByDate(
  rawLeague: League,
  dayDate: Date | null,
  timeZone: string
) {
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setErr] = useState<string | null>(null);

  const league = useMemo(() => normalizeLeague(rawLeague), [rawLeague]);

  const range = useMemo(() => {
    if (!dayDate) return null;
    const { start, end } = getDayRangeInTimeZone(dayDate, timeZone);
    return {
      startTs: Timestamp.fromDate(start),
      endTs: Timestamp.fromDate(end),
    };
  }, [dayDate, timeZone]);

  useEffect(() => {
    let alive = true;

    async function load() {
      if (!dayDate || !range) {
        if (!alive) return;
        setErr(null);
        setGames([]);
        setLoading(false);
        return;
      }

      setErr(null);

      const dayKey = toDateKeyInTimeZone(dayDate, timeZone);
      const cacheKey = `${league}|${dayKey}`;
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
        const ref = collection(db, "games");

        const q = query(
          ref,
          where("league", "==", league),
          where("season", "==", GAME_SCHEDULE_SEASON),
          where("startAtJst", ">=", range.startTs),
          where("startAtJst", "<", range.endTs),
          orderBy("startAtJst", "asc"),
          limit(200)
        );

        const snap = await getDocs(q);

        if (!alive) return;

        const rows = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));

        gamesByDayCache.set(cacheKey, { games: rows, savedAt: Date.now() });
        setGames(rows);
        setLoading(false);
      } catch (e: any) {
        if (!alive) return;
        setErr(e?.message ?? "unknown error");
        setLoading(false);
      }
    }

    load();

    return () => {
      alive = false;
    };
  }, [league, dayDate, range, timeZone]);

  return { loading, error, games };
}