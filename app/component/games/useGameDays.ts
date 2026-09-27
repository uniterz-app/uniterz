"use client";

import { useEffect, useState, useMemo } from "react";

import type { League } from "@/lib/leagues";
import { normalizeLeague } from "@/lib/leagues";
import {
  parseDateKeyInTimeZone,
  toDateKeyInTimeZone,
} from "@/lib/time/zonedTime";
import { toDateOrNull } from "@/lib/games/transform";
import { fetchGamesWindowShared } from "@/lib/games/fetchGamesWindowShared";
import { GAMES_WINDOW_PLUS_MINUS_DEFAULT } from "@/lib/games/gamesWindowConstants";
import { GAME_SCHEDULE_SEASON } from "@/lib/games/gameScheduleSeason";
import { snapGamesWindowAnchorKey } from "@/lib/games/gamesWindowRange";
import {
  GAMES_WINDOW_LIVE_REFRESH_MS,
  planGamesWindowLiveRefresh,
} from "@/lib/games/gamesWindowLiveRefresh";
import {
  buildGamesWindowRowsCacheKey,
  findCoveringGamesWindowRows,
  readGamesWindowRowsCache,
  writeGamesWindowRowsCache,
} from "@/lib/games/gamesWindowRowsMemoryCache";

/** カード用：アンカーの前後に含める暦日数（前後5日＝計11日）。窓外の日を選んだらその日を基準に取り直す */
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
 * 選択日まわりの試合行（カード用）と、その窓内の試合日。
 * 共通データは `/api/games/window`（CDN 共有）。予想・Pro は別。
 * ストリップの全試合日は `useGameDayIndex`（窓内の試合日はその取得前フォールバック）。
 */
export function useGameDays(
  rawLeague: League,
  timeZone: string,
  windowAnchor: Date
) {
  const league = normalizeLeague(rawLeague);

  const selectedDateKey = useMemo(
    () => toDateKeyInTimeZone(windowAnchor, timeZone),
    [windowAnchor, timeZone],
  );
  const anchorDateKey = useMemo(
    () => snapGamesWindowAnchorKey(selectedDateKey),
    [selectedDateKey],
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
          selectedDateKey,
          plusMinus: GAME_DAYS_PLUS_MINUS,
        });
        if (covering) {
          if (!alive) return;
          setRows(covering.rows);
          setPeerRowsForSeriesInference(
            covering.peerRows?.length ? covering.peerRows : covering.rows
          );
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
          season: GAME_SCHEDULE_SEASON,
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

  /** 開始済み・未終了の試合がある間だけ 60 秒ごとに窓を取り直す（タブ裏では止める） */
  const [liveWakeTick, setLiveWakeTick] = useState(0);
  useEffect(() => {
    if (league === "wc" || rows.length === 0) return;
    const plan = planGamesWindowLiveRefresh(rows, Date.now());
    if (!plan.active) {
      if (plan.wakeAtMs == null) return;
      const wake = setTimeout(
        () => setLiveWakeTick((n) => n + 1),
        Math.max(1_000, plan.wakeAtMs - Date.now() + 30_000)
      );
      return () => clearTimeout(wake);
    }

    let alive = true;

    const cacheKey = buildGamesWindowRowsCacheKey({
      league,
      timeZone,
      windowKey: anchorDateKey,
      plusMinus: GAME_DAYS_PLUS_MINUS,
    });

    const refetch = async () => {
      if (typeof document !== "undefined" && document.hidden) return;
      try {
        const payload = await fetchGamesWindowShared({
          league,
          anchorDateKey,
          timeZone,
          plusMinus: GAME_DAYS_PLUS_MINUS,
          season: GAME_SCHEDULE_SEASON,
          force: true,
        });
        if (!alive) return;
        const peerRows = payload.peerRows.length ? payload.peerRows : payload.rows;
        writeGamesWindowRowsCache(cacheKey, {
          rows: payload.rows,
          peerRows,
          startKey: payload.range.startKey,
          endKey: payload.range.endKey,
          windowKey: anchorDateKey,
        });
        setRows(payload.rows);
        setPeerRowsForSeriesInference(peerRows);
      } catch {
        /* 次の周期で再試行 */
      }
    };

    const interval = setInterval(
      () => void refetch(),
      GAMES_WINDOW_LIVE_REFRESH_MS
    );
    const onVisible = () => {
      if (!document.hidden) void refetch();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      alive = false;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [rows, league, timeZone, anchorDateKey, liveWakeTick]);

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
