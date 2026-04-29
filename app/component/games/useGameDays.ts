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
  getPlusMinusDaysRangeInTimeZone,
} from "@/lib/time/zonedTime";
import { GAME_SCHEDULE_SEASON } from "@/lib/games/gameScheduleSeason";
import { mergePlayoffSeriesPeersForWindowGames } from "@/lib/games/fetchPlayoffSeriesPeerGames";

/** アンカー±3日（計7暦日）分の取得上限 */
const GAME_DAYS_WINDOW_QUERY_LIMIT = 200;

/** 日付ストリップ用：アンカーの前後に含める暦日数（今日含め前後3日＝計7日） */
const GAME_DAYS_PLUS_MINUS = 3;

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
  { rows: any[]; peerRowsForSeriesInference: any[]; savedAt: number }
>();

/**
 * 試合がある日の一覧（日付ストリップ用）。
 * アンカー日をタイムゾーンの暦日として ±GAME_DAYS_PLUS_MINUS 日の窓だけ Firestore から取得する。
 */
export function useGameDays(
  rawLeague: League,
  timeZone: string,
  windowAnchor: Date
) {
  const league = normalizeLeague(rawLeague);

  const anchorDateKey = useMemo(
    () => toDateKeyInTimeZone(windowAnchor, timeZone),
    [windowAnchor, timeZone]
  );

  const [rows, setRows] = useState<any[]>([]);
  const [peerRowsForSeriesInference, setPeerRowsForSeriesInference] = useState<
    any[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setErr] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    async function load() {
      setErr(null);

      const cacheKey = `${league}|${timeZone}|${anchorDateKey}|pm${GAME_DAYS_PLUS_MINUS}`;
      const cached = gameDaysRowsCache.get(cacheKey);
      const fresh =
        cached && Date.now() - cached.savedAt < GAME_DAYS_ROWS_CACHE_TTL_MS;
      const rowsHaveId =
        !!cached?.rows?.length &&
        typeof (cached.rows[0] as { id?: string })?.id === "string";
      if (fresh && rowsHaveId) {
        if (!alive) return;
        setRows(cached.rows);
        setPeerRowsForSeriesInference(
          cached.peerRowsForSeriesInference?.length
            ? cached.peerRowsForSeriesInference
            : cached.rows
        );
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const ref = collection(db, "games");
        const { start, end } = getPlusMinusDaysRangeInTimeZone(
          windowAnchor,
          timeZone,
          GAME_DAYS_PLUS_MINUS
        );

        const q = query(
          ref,
          where("league", "==", league),
          where("season", "==", GAME_SCHEDULE_SEASON),
          where("startAtJst", ">=", Timestamp.fromDate(start)),
          where("startAtJst", "<", Timestamp.fromDate(end)),
          orderBy("startAtJst", "asc"),
          limit(GAME_DAYS_WINDOW_QUERY_LIMIT)
        );

        const snap = await getDocs(q);

        if (!alive) return;

        const list = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));

        const peerRows = await mergePlayoffSeriesPeersForWindowGames(list);

        const savedAt = Date.now();
        gameDaysRowsCache.set(cacheKey, {
          rows: list,
          peerRowsForSeriesInference: peerRows,
          savedAt,
        });
        setRows(list);
        setPeerRowsForSeriesInference(peerRows);
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
  }, [league, timeZone, anchorDateKey]);

  const gameDays = useMemo(
    () => monthRowsToSortedGameDays(rows, timeZone),
    [rows, timeZone],
  );

  return {
    gameDays,
    monthRows: rows,
    peerRowsForSeriesInference,
    loading,
    error,
  };
}
