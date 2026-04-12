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
  limit,
} from "firebase/firestore";

import type { League } from "@/lib/leagues";
import { normalizeLeague } from "@/lib/leagues";
import {
  parseDateKeyInTimeZone,
  toDateKeyInTimeZone,
  getCalendarMonthRangeInTimeZone,
  getZonedYMD,
} from "@/lib/time/zonedTime";
import { GAME_SCHEDULE_SEASON } from "@/lib/games/gameScheduleSeason";

/** 暦月1本分の試合取得でも足りる上限（多試合日・複数リーグ想定） */
const GAME_DAYS_MONTH_QUERY_LIMIT = 500;

/** 月内の games 行から、タイムゾーン基準の「試合がある日」を重複なく昇順で返す */
export function monthRowsToSortedGameDays(
  rows: any[],
  timeZone: string,
): Date[] {
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
}

/** 同一セッション内の getDocs 回数削減（リーグ＋アンカー日＋TTL 内は再取得しない） */
const GAME_DAYS_ROWS_CACHE_TTL_MS = 5 * 60 * 1000;
const gameDaysRowsCache = new Map<
  string,
  { rows: any[]; savedAt: number }
>();

/**
 * 試合がある日の一覧（日付ストリップ用）。
 * windowAnchor が属するタイムゾーンの暦月1ヶ月分だけ Firestore から取得する（同一月内の日付移動では再取得しない）。
 */
export function useGameDays(
  rawLeague: League,
  timeZone: string,
  windowAnchor: Date
) {
  const league = normalizeLeague(rawLeague);

  const windowKey = useMemo(() => {
    const { year, month } = getZonedYMD(windowAnchor, timeZone);
    return `${year}-${String(month).padStart(2, "0")}`;
  }, [windowAnchor, timeZone]);

  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setErr] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    async function load() {
      setErr(null);

      const cacheKey = `${league}|${timeZone}|${windowKey}`;
      const cached = gameDaysRowsCache.get(cacheKey);
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
        const { start, end } = getCalendarMonthRangeInTimeZone(
          windowAnchor,
          timeZone
        );

        const q = query(
          ref,
          where("league", "==", league),
          where("season", "==", GAME_SCHEDULE_SEASON),
          where("startAtJst", ">=", Timestamp.fromDate(start)),
          where("startAtJst", "<", Timestamp.fromDate(end)),
          orderBy("startAtJst", "asc"),
          limit(GAME_DAYS_MONTH_QUERY_LIMIT)
        );

        const snap = await getDocs(q);

        if (!alive) return;

        const list = snap.docs.map((d) => d.data());
        gameDaysRowsCache.set(cacheKey, { rows: list, savedAt: Date.now() });
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
  }, [league, timeZone, windowKey]);

  const gameDays = useMemo(
    () => monthRowsToSortedGameDays(rows, timeZone),
    [rows, timeZone],
  );

  return { gameDays, monthRows: rows, loading, error };
}
