"use client";

import { useEffect, useState, useMemo } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  Timestamp,
} from "firebase/firestore";

import type { League } from "@/lib/leagues";
import { normalizeLeague } from "@/lib/leagues";
import {
  parseDateKeyInTimeZone,
  toDateKeyInTimeZone,
} from "@/lib/time/zonedTime";
import { GAME_SCHEDULE_SEASON } from "@/lib/games/gameScheduleSeason";

/** 同一セッション内の getDocs 回数削減（リーグ単位・TTL 内は再取得しない） */
const GAME_DAYS_ROWS_CACHE_TTL_MS = 5 * 60 * 1000;
const gameDaysRowsCache = new Map<
  string,
  { rows: any[]; savedAt: number }
>();

export function useGameDays(rawLeague: League, timeZone: string) {
  const league = normalizeLeague(rawLeague);

  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setErr] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    async function load() {
      setErr(null);

      const cached = gameDaysRowsCache.get(league);
      const fresh =
        cached && Date.now() - cached.savedAt < GAME_DAYS_ROWS_CACHE_TTL_MS;
      if (fresh) {
        if (!alive) return;
        setRows(cached.rows);
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
          orderBy("startAtJst", "asc")
        );

        const snap = await getDocs(q);

        if (!alive) return;

        const list = snap.docs.map((d) => d.data());
        gameDaysRowsCache.set(league, { rows: list, savedAt: Date.now() });
        setRows(list);
      } catch (e: any) {
        if (!alive) return;
        setErr(e?.message ?? "unknown error");
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();

    return () => {
      alive = false;
    };
  }, [league]);

  const gameDays = useMemo(() => {
    if (!rows.length) return [];

    const map = new Map<string, Date>();

    for (const g of rows) {
      const t = g.startAtJst;
      if (!t) continue;

      let d: Date | null = null;
      if (t instanceof Timestamp) d = t.toDate();
      else if (typeof t?.toDate === "function") d = t.toDate();
      else if (t instanceof Date) d = t;
      if (!d) continue;

      const key = toDateKeyInTimeZone(d, timeZone);
      if (!map.has(key)) {
        const dayStart = parseDateKeyInTimeZone(key, timeZone);
        if (dayStart) map.set(key, dayStart);
      }
    }

    return [...map.values()].sort((a, b) => a.getTime() - b.getTime());
  }, [rows, timeZone]);

  return { gameDays, loading, error };
}