"use client";

import { useEffect, useRef, useState, useMemo } from "react";

import type { League } from "@/lib/leagues";
import { normalizeLeague } from "@/lib/leagues";
import {
  parseDateKeyInTimeZone,
  toDateKeyInTimeZone,
  getPlusMinusDaysRangeInTimeZone,
} from "@/lib/time/zonedTime";
import { toDateOrNull } from "@/lib/games/transform";
import { fetchGamesWindowShared } from "@/lib/games/fetchGamesWindowShared";
import {
  GAMES_WINDOW_EDGE_EXTEND_DAYS,
  GAMES_WINDOW_PLUS_MINUS_DEFAULT,
} from "@/lib/games/gamesWindowConstants";
import {
  mergeGameRowsById,
  needsBackwardWindowExtend,
  needsForwardWindowExtend,
  shiftDateKeyInTimeZone,
} from "@/lib/games/gamesWindowRange";
import { mergeNbaOpeningNightPreviewGames } from "@/lib/games/nbaOpeningNightPreviewGames";

/** 日付ストリップ用：アンカーの前後に含める暦日数（前後5日＝計11日）。端で +2 延長 */
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

function parseAnchorFromCacheKey(cacheKey: string): string | null {
  const m = cacheKey.match(/\|(\d{4}-\d{2}-\d{2})\|pm/);
  return m?.[1] ?? null;
}

function rangeKeysForAnchor(
  anchorKey: string,
  timeZone: string
): { startKey: string; endKey: string } | null {
  const anchor = parseDateKeyInTimeZone(anchorKey, timeZone);
  if (!anchor) return null;
  const { start, end } = getPlusMinusDaysRangeInTimeZone(
    anchor,
    timeZone,
    GAME_DAYS_PLUS_MINUS
  );
  return {
    startKey: toDateKeyInTimeZone(start, timeZone),
    endKey: toDateKeyInTimeZone(end, timeZone),
  };
}

/** 同一セッション内の取得回数削減（リーグ＋アンカー日＋TTL 内は再取得しない） */
const GAME_DAYS_ROWS_CACHE_TTL_MS = 5 * 60 * 1000;
const gameDaysRowsCache = new Map<
  string,
  {
    rows: any[];
    peerRowsForSeriesInference: any[];
    startKey: string;
    endKey: string;
    windowKey: string;
    savedAt: number;
  }
>();

/**
 * 試合がある日の一覧（日付ストリップ用）。
 * 共通データは `/api/games/window`（CDN 共有）。予想・Pro は別。
 * 初期 ±5 日。選択日が端に近づいたら ±2 日ずつ追加取得してマージ。
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

  /** WC はアンカー日と無関係に固定窓の 1 クエリ。それ以外は ±5 日でアンカー依存 */
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
  const rangeRef = useRef<{
    startKey: string;
    endKey: string;
    /** 初回取得時のアンカー（キャッシュキー用。選択日移動後も固定） */
    windowKey: string;
  } | null>(null);
  const extendingRef = useRef(false);

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
          const windowKey =
            entry.windowKey || parseAnchorFromCacheKey(key) || "";
          const derived = windowKey
            ? rangeKeysForAnchor(windowKey, timeZone)
            : null;
          const startKey = entry.startKey || derived?.startKey || "";
          const endKey = entry.endKey || derived?.endKey || "";
          if (!startKey || !endKey || !windowKey) continue;
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
          rangeRef.current = { startKey, endKey, windowKey };
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
      if (fresh && rowsHaveId && cached) {
        if (!alive) return;
        setRows(cached.rows);
        setPeerRowsForSeriesInference(
          cached.peerRowsForSeriesInference?.length
            ? cached.peerRowsForSeriesInference
            : cached.rows
        );
        if (cached.startKey && cached.endKey) {
          rangeRef.current = {
            startKey: cached.startKey,
            endKey: cached.endKey,
            windowKey: cached.windowKey || anchorDateKey,
          };
        }
        setLoading(false);
        return;
      }

      setRows([]);
      setPeerRowsForSeriesInference([]);
      rangeRef.current = null;
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
        const startKey = payload.range.startKey;
        const endKey = payload.range.endKey;

        const savedAt = Date.now();
        gameDaysRowsCache.set(cacheKey, {
          rows: list,
          peerRowsForSeriesInference: peerRows,
          startKey,
          endKey,
          windowKey: anchorDateKey,
          savedAt,
        });
        setRows(list);
        setPeerRowsForSeriesInference(peerRows);
        rangeRef.current = {
          startKey,
          endKey,
          windowKey: anchorDateKey,
        };
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

  /** 端に近づいたら ±2 日だけ追加取得（ローディングなしでマージ） */
  useEffect(() => {
    if (loading || league === "wc") return;
    const range = rangeRef.current;
    if (!range?.startKey || !range?.endKey || !range.windowKey) return;
    if (extendingRef.current) return;

    const wantForward = needsForwardWindowExtend(
      anchorDateKey,
      range.endKey,
      timeZone
    );
    const wantBackward = needsBackwardWindowExtend(
      anchorDateKey,
      range.startKey,
      timeZone
    );
    if (!wantForward && !wantBackward) return;

    const slices: Array<{ fromKey: string; toKey: string }> = [];
    if (wantBackward) {
      const fromKey = shiftDateKeyInTimeZone(
        range.startKey,
        timeZone,
        -GAMES_WINDOW_EDGE_EXTEND_DAYS
      );
      if (fromKey && fromKey < range.startKey) {
        slices.push({ fromKey, toKey: range.startKey });
      }
    }
    if (wantForward) {
      const toKey = shiftDateKeyInTimeZone(
        range.endKey,
        timeZone,
        GAMES_WINDOW_EDGE_EXTEND_DAYS
      );
      if (toKey && range.endKey < toKey) {
        slices.push({ fromKey: range.endKey, toKey });
      }
    }
    if (!slices.length) return;

    let alive = true;
    extendingRef.current = true;

    void (async () => {
      try {
        let mergedExtra: any[] = [];
        let mergedExtraPeers: any[] = [];
        for (const slice of slices) {
          const payload = await fetchGamesWindowShared({
            league,
            timeZone,
            fromDateKey: slice.fromKey,
            toDateKey: slice.toKey,
          });
          if (!alive) return;
          mergedExtra = mergeGameRowsById(mergedExtra, payload.rows);
          mergedExtraPeers = mergeGameRowsById(
            mergedExtraPeers,
            payload.peerRows.length ? payload.peerRows : payload.rows
          );
        }

        const nextStart = wantBackward
          ? (slices.find((s) => s.toKey === range.startKey)?.fromKey ??
            range.startKey)
          : range.startKey;
        const nextEnd = wantForward
          ? (slices.find((s) => s.fromKey === range.endKey)?.toKey ??
            range.endKey)
          : range.endKey;

        setRows((prev) => mergeGameRowsById(prev, mergedExtra));
        setPeerRowsForSeriesInference((prev) =>
          mergeGameRowsById(
            prev.length ? prev : [],
            mergedExtraPeers.length ? mergedExtraPeers : mergedExtra
          )
        );
        rangeRef.current = {
          startKey: nextStart,
          endKey: nextEnd,
          windowKey: range.windowKey,
        };

        const cacheKey = `${league}|${timeZone}|${range.windowKey}|pm${GAME_DAYS_PLUS_MINUS}`;
        const prevCache = gameDaysRowsCache.get(cacheKey);
        gameDaysRowsCache.set(cacheKey, {
          rows: mergeGameRowsById(prevCache?.rows ?? [], mergedExtra),
          peerRowsForSeriesInference: mergeGameRowsById(
            prevCache?.peerRowsForSeriesInference ?? prevCache?.rows ?? [],
            mergedExtraPeers.length ? mergedExtraPeers : mergedExtra
          ),
          startKey: nextStart,
          endKey: nextEnd,
          windowKey: range.windowKey,
          savedAt: Date.now(),
        });
      } catch (e) {
        if (!alive) return;
        console.warn("[useGameDays] edge extend failed", e);
      } finally {
        extendingRef.current = false;
      }
    })();

    return () => {
      alive = false;
      extendingRef.current = false;
    };
  }, [loading, league, timeZone, anchorDateKey]);

  const displayRows = useMemo(
    () => mergeNbaOpeningNightPreviewGames(league, rows),
    [league, rows]
  );
  const displayPeerRows = useMemo(
    () => mergeNbaOpeningNightPreviewGames(league, peerRowsForSeriesInference),
    [league, peerRowsForSeriesInference]
  );

  const gameDays = useMemo(
    () => monthRowsToSortedGameDays(displayRows, timeZone),
    [displayRows, timeZone],
  );

  return {
    gameDays,
    monthRows: displayRows,
    peerRowsForSeriesInference: displayPeerRows,
    loading,
    error,
  };
}
