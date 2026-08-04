"use client";

import { useEffect, useState, useMemo } from "react";

import type { League } from "@/lib/leagues";
import { normalizeLeague } from "@/lib/leagues";
import {
  parseDateKeyInTimeZone,
  toDateKeyInTimeZone,
  getPlusMinusDaysRangeInTimeZone,
} from "@/lib/time/zonedTime";
import { toDateOrNull } from "@/lib/games/transform";
import { fetchGamesWindowShared } from "@/lib/games/fetchGamesWindowShared";
import { GAMES_WINDOW_PLUS_MINUS_DEFAULT } from "@/lib/games/gamesWindowConstants";

/** 日付ストリップ用：アンカーの前後に含める暦日数（前後10日＝計21日） */
const GAME_DAYS_PLUS_MINUS = GAMES_WINDOW_PLUS_MINUS_DEFAULT;

/** 月内の games 行から、タイムゾーン基準の「試合がある日」を重複なく昇順で返す */
export function monthRowsToSortedGameDays(
  rows: any[],
  timeZone: string,
): Date[] {
  if (!rows.length) return [];

  const map = new Map<string, Date>();

  for (const g of rows) {
    const d = toDateOrNull(g?.startAtJst);
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
 * 共通データは `/api/games/window`（CDN 共有）。予想・Pro は別。
 */
export function useGameDays(
  rawLeague: League,
  timeZone: string,
  windowAnchor: Date
) {
  const league = normalizeLeague(rawLeague);

  const anchorDateKey = useMemo(
    () => toDateKeyInTimeZone(windowAnchor, timeZone),
    [windowAnchor, timeZone],
  );

  const wcWindowCacheKey = useMemo(
    () => `${league}|${timeZone}|wc-page-window-v1`,
    [league, timeZone],
  );

  /** WC はアンカー日と無関係に固定窓の 1 クエリ。それ以外は ±10 日でアンカー依存 */
  const fetchDepsKey = useMemo(() => {
    if (league === "wc") return wcWindowCacheKey;
    return `${league}|${timeZone}|${anchorDateKey}|pm${GAME_DAYS_PLUS_MINUS}`;
  }, [league, timeZone, anchorDateKey, wcWindowCacheKey]);

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

      const cacheKey =
        league === "wc"
          ? wcWindowCacheKey
          : `${league}|${timeZone}|${anchorDateKey}|pm${GAME_DAYS_PLUS_MINUS}`;

      /** 選択日を覆う新鮮な窓があれば、アンカーが違っても再取得しない */
      if (league !== "wc") {
        const now = Date.now();
        for (const [key, entry] of gameDaysRowsCache.entries()) {
          if (!key.startsWith(`${league}|${timeZone}|`)) continue;
          if (now - entry.savedAt >= GAME_DAYS_ROWS_CACHE_TTL_MS) continue;
          const m = key.match(/\|(\d{4}-\d{2}-\d{2})\|pm/);
          const cachedAnchor = m?.[1];
          if (!cachedAnchor) continue;
          const anchor = parseDateKeyInTimeZone(cachedAnchor, timeZone);
          if (!anchor) continue;
          const { start, end } = getPlusMinusDaysRangeInTimeZone(
            anchor,
            timeZone,
            GAME_DAYS_PLUS_MINUS
          );
          const startKey = toDateKeyInTimeZone(start, timeZone);
          const endKey = toDateKeyInTimeZone(end, timeZone);
          if (anchorDateKey < startKey || anchorDateKey >= endKey) continue;
          const rowsHaveId =
            entry.rows.length === 0 ||
            typeof (entry.rows[0] as { id?: string })?.id === "string";
          if (!rowsHaveId) continue;
          if (!alive) return;
          setRows(entry.rows);
          setPeerRowsForSeriesInference(
            entry.peerRowsForSeriesInference?.length
              ? entry.peerRowsForSeriesInference
              : entry.rows
          );
          setLoading(false);
          return;
        }
      }

      const cached = gameDaysRowsCache.get(cacheKey);
      const fresh =
        cached && Date.now() - cached.savedAt < GAME_DAYS_ROWS_CACHE_TTL_MS;
      const rowsHaveId =
        !cached ||
        cached.rows.length === 0 ||
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

      setRows([]);
      setPeerRowsForSeriesInference([]);
      setLoading(true);

      try {
        const payload = await fetchGamesWindowShared({
          league,
          anchorDateKey,
          timeZone,
          plusMinus: GAME_DAYS_PLUS_MINUS,
        });

        if (!alive) return;

        const list = payload.rows;
        const peerRows = payload.peerRows.length ? payload.peerRows : list;

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
  }, [fetchDepsKey]);

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
