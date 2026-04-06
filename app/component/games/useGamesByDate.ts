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
import { getDayRangeInTimeZone, toDateKeyInTimeZone } from "@/lib/time/zonedTime";
import { GAME_SCHEDULE_SEASON } from "@/lib/games/gameScheduleSeason";

const GAMES_BY_DAY_CACHE_TTL_MS = 5 * 60 * 1000;
const gamesByDayCache = new Map<
  string,
  { games: any[]; savedAt: number }
>();

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