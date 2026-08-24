"use client";

import { useEffect, useRef, useState, useMemo } from "react";

import type { League } from "@/lib/leagues";
import { normalizeLeague } from "@/lib/leagues";
import {
  parseDateKeyInTimeZone,
  toDateKeyInTimeZone,
} from "@/lib/time/zonedTime";
import { toDateOrNull } from "@/lib/games/transform";
import { fetchGamesWindowShared } from "@/lib/games/fetchGamesWindowShared";
import {
  GAMES_WINDOW_EDGE_EXTEND_DAYS,
  GAMES_WINDOW_PLUS_MINUS_DEFAULT,
} from "@/lib/games/gamesWindowConstants";
import {
  buildGamesWindowRowsCacheKey,
  findCoveringGamesWindowRows,
  patchGamesWindowRowsCache,
  readGamesWindowRowsCache,
  writeGamesWindowRowsCache,
} from "@/lib/games/gamesWindowRowsMemoryCache";
import {
  mergeGameRowsById,
  needsBackwardWindowExtend,
  needsForwardWindowExtend,
  shiftDateKeyInTimeZone,
} from "@/lib/games/gamesWindowRange";

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

  /** WC はアンカー日と無関係に固定窓の 1 クエリ。それ以外は ±5 日でアンカー依存 */
  const fetchDepsKey = useMemo(
    () =>
      buildGamesWindowRowsCacheKey({
        league,
        timeZone,
        windowKey: anchorDateKey,
        plusMinus: GAME_DAYS_PLUS_MINUS,
      }),
    [league, timeZone, anchorDateKey],
  );

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

      const cacheKey = buildGamesWindowRowsCacheKey({
        league,
        timeZone,
        windowKey: anchorDateKey,
        plusMinus: GAME_DAYS_PLUS_MINUS,
      });

      /** 選択日を覆う新鮮な窓があれば、アンカーが違っても再取得しない */
      if (league !== "wc") {
        const covering = findCoveringGamesWindowRows({
          league,
          timeZone,
          selectedDateKey: anchorDateKey,
          plusMinus: GAME_DAYS_PLUS_MINUS,
        });
        if (covering) {
          if (!alive) return;
          setRows(covering.rows);
          setPeerRowsForSeriesInference(
            covering.peerRows?.length ? covering.peerRows : covering.rows
          );
          rangeRef.current = {
            startKey: covering.startKey,
            endKey: covering.endKey,
            windowKey: covering.windowKey,
          };
          setLoading(false);
          return;
        }
      }

      const cached = readGamesWindowRowsCache(cacheKey);
      const rowsHaveId =
        !cached ||
        cached.rows.length === 0 ||
        typeof (cached.rows[0] as { id?: string })?.id === "string";
      if (cached && rowsHaveId) {
        if (!alive) return;
        setRows(cached.rows);
        setPeerRowsForSeriesInference(
          cached.peerRows?.length ? cached.peerRows : cached.rows
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

        writeGamesWindowRowsCache(cacheKey, {
          rows: list,
          peerRows,
          startKey,
          endKey,
          windowKey: anchorDateKey,
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

        const cacheKey = buildGamesWindowRowsCacheKey({
          league,
          timeZone,
          windowKey: range.windowKey,
          plusMinus: GAME_DAYS_PLUS_MINUS,
        });
        const prevCache = readGamesWindowRowsCache(cacheKey);
        patchGamesWindowRowsCache(cacheKey, {
          rows: mergeGameRowsById(prevCache?.rows ?? [], mergedExtra),
          peerRows: mergeGameRowsById(
            prevCache?.peerRows ?? prevCache?.rows ?? [],
            mergedExtraPeers.length ? mergedExtraPeers : mergedExtra
          ),
          startKey: nextStart,
          endKey: nextEnd,
          windowKey: range.windowKey,
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

  const displayRows = useMemo(() => rows, [rows]);
  const displayPeerRows = useMemo(
    () => peerRowsForSeriesInference,
    [peerRowsForSeriesInference]
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
