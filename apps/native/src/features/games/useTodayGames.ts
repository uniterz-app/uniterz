import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { resolveGameStatus } from "@uniterz/shared";
import {
  TIMEZONE_JST,
  getDayRangeInTimeZone,
  getPlusMinusDaysRangeInTimeZone,
  parseDateKeyInTimeZone,
  toDateKeyInTimeZone,
} from "../../../../../lib/time/zonedTime";
import { fetchGamesWindowShared } from "../../../../../lib/games/fetchGamesWindowShared";
import {
  GAMES_WINDOW_EDGE_EXTEND_DAYS,
  GAMES_WINDOW_PLUS_MINUS_DEFAULT,
} from "../../../../../lib/games/gamesWindowConstants";
import {
  mergeGameRowsById,
  needsBackwardWindowExtend,
  needsForwardWindowExtend,
  shiftDateKeyInTimeZone,
} from "../../../../../lib/games/gamesWindowRange";
import { toDateOrNull } from "../../../../../lib/games/transform";
import { sortGamesByKickoffAsc } from "../../../../../lib/games/sortGamesByKickoff";
import {
  mergeNbaOpeningNightPreviewGames,
  NBA_OPENING_NIGHT_PREVIEW_DATE_KEY,
} from "../../../../../lib/games/nbaOpeningNightPreviewGames";
import { getUniterzApiBaseUrl } from "./submitPredictionApi";

export type SupportedLeague = "nba" | "bj" | "j1" | "pl" | "wc";

/** Web `useGameDays` 相当: アンカー±5日（計11暦日）。端で +2 延長 */
const GAME_DAYS_PLUS_MINUS = GAMES_WINDOW_PLUS_MINUS_DEFAULT;

/** Web `useGameDays` の gameDaysRowsCache と同趣旨 */
const GAMES_WINDOW_CACHE_TTL_MS = 5 * 60 * 1000;

type GamesWindowCacheEntry = {
  rows: NativeGameRow[];
  peerRows: NativeGameRow[];
  /** 非 WC: アンカー日キー / WC: 固定窓キー */
  windowKey: string;
  startKey: string;
  endKey: string;
  savedAt: number;
};

const gamesWindowCache = new Map<string, GamesWindowCacheEntry>();

function gamesWindowCacheKey(league: SupportedLeague, windowKey: string): string {
  return league === "wc"
    ? `${league}|wc-page-window-v1`
    : `${league}|${windowKey}|pm${GAME_DAYS_PLUS_MINUS}`;
}

/** アンカー日の ±N 日窓が selectedDateKey を覆うか（end は半開区間） */
function anchorWindowCoversDateKey(
  entry: Pick<GamesWindowCacheEntry, "windowKey" | "startKey" | "endKey">,
  selectedDateKey: string
): boolean {
  if (entry.startKey && entry.endKey) {
    return selectedDateKey >= entry.startKey && selectedDateKey < entry.endKey;
  }
  const anchor = parseDateKeyInTimeZone(entry.windowKey, TIMEZONE_JST);
  if (!anchor) return false;
  const { start, end } = getPlusMinusDaysRangeInTimeZone(
    anchor,
    TIMEZONE_JST,
    GAME_DAYS_PLUS_MINUS
  );
  const startKey = toDateKeyInTimeZone(start, TIMEZONE_JST);
  const endKey = toDateKeyInTimeZone(end, TIMEZONE_JST);
  return selectedDateKey >= startKey && selectedDateKey < endKey;
}

/** 同一リーグで selectedDate を覆う新鮮なキャッシュを探す（日付チップ移動の再取得を抑える） */
function findCoveringGamesCache(
  league: SupportedLeague,
  selectedDateKey: string
): GamesWindowCacheEntry | null {
  const now = Date.now();
  for (const [key, entry] of gamesWindowCache.entries()) {
    if (!key.startsWith(`${league}|`)) continue;
    if (now - entry.savedAt >= GAMES_WINDOW_CACHE_TTL_MS) continue;
    if (!anchorWindowCoversDateKey(entry, selectedDateKey)) continue;
    return entry;
  }
  return null;
}

export type NativeGameRow = {
  id: string;
  [key: string]: unknown;
};

function filterGamesForDay(rows: NativeGameRow[], day: Date): NativeGameRow[] {
  const { start, end } = getDayRangeInTimeZone(day, TIMEZONE_JST);
  const startTs = start.getTime();
  const endTs = end.getTime();
  return rows.filter((g) => {
    const d = toDateOrNull(g.startAtJst);
    if (!d) return false;
    const t = d.getTime();
    return t >= startTs && t < endTs;
  });
}

function startOfLocalDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function isSameLocalDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function addDaysLocal(base: Date, offset: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + offset);
  return d;
}

/**
 * ローカル暦で「今日」を見ているとき、その日の試合がすべて終了なら翌日へ寄せる。
 * フェッチ完了と同一バッチで適用し、画面が一度「今日」で描画されてから翌日へ跳ぶガタつきを防ぐ。
 */
function pickLandingDateAfterFetch(selectedBefore: Date, rows: NativeGameRow[]): Date {
  const todayStart = startOfLocalDay(new Date());
  const selStart = startOfLocalDay(selectedBefore);
  if (!isSameLocalDay(selStart, todayStart)) return selectedBefore;
  const dayGames = filterGamesForDay(rows, selectedBefore);
  if (dayGames.length === 0) return selectedBefore;
  const allFinal = dayGames.every(
    (g) => resolveGameStatus(g as Record<string, unknown>) === "final"
  );
  if (!allFinal) return selectedBefore;
  return addDaysLocal(selectedBefore, 1);
}

/** Web `GamesPage.findInitialGameDay` 相当 */
function findInitialGameDay(params: {
  gameDays: Date[];
  stateSelected: Date | null;
  todayKey: string;
  timeZone: string;
}): Date | null {
  const { gameDays, stateSelected, todayKey, timeZone } = params;
  if (!gameDays.length) return null;

  if (stateSelected) {
    const wantedKey = toDateKeyInTimeZone(stateSelected, timeZone);
    const hit = gameDays.find(
      (d) => toDateKeyInTimeZone(d, timeZone) === wantedKey
    );
    if (hit) return hit;
    const monthPrefix = wantedKey.slice(0, 7);
    const inMonth = gameDays
      .filter((d) => toDateKeyInTimeZone(d, timeZone).startsWith(monthPrefix))
      .sort((a, b) => a.getTime() - b.getTime());
    if (inMonth.length) return inMonth[0] ?? null;
    return null;
  }

  const sorted = [...gameDays].sort((a, b) => a.getTime() - b.getTime());
  return (
    sorted.find((d) => toDateKeyInTimeZone(d, timeZone) >= todayKey) ??
    sorted[sorted.length - 1] ??
    null
  );
}

function gameDaysFromRows(rows: NativeGameRow[]): Date[] {
  return sortedUniqueDateKeysFromRows(rows)
    .map((key) => parseDateKeyInTimeZone(key, TIMEZONE_JST))
    .filter((d): d is Date => d != null);
}

function resolveLandingDate(
  rows: NativeGameRow[],
  preferred: Date | null
): Date | null {
  const gameDays = gameDaysFromRows(rows);
  if (!gameDays.length) return preferred;
  const todayKey = toDateKeyInTimeZone(new Date(), TIMEZONE_JST);
  const initial = findInitialGameDay({
    gameDays,
    stateSelected: preferred,
    todayKey,
    timeZone: TIMEZONE_JST,
  });
  if (!initial) return preferred;
  return pickLandingDateAfterFetch(initial, rows);
}

export function sortedUniqueDateKeysFromRows(rows: NativeGameRow[]): string[] {
  const keys = new Set<string>();
  for (const g of rows) {
    const d = toDateOrNull(g.startAtJst);
    if (!d) continue;
    keys.add(toDateKeyInTimeZone(d, TIMEZONE_JST));
  }
  return Array.from(keys).sort();
}

type UseTodayGamesOptions = {
  /** false の間はフェッチしない（優先リーグ確定待ち） */
  enabled?: boolean;
};

export function useTodayGames(options: UseTodayGamesOptions = {}) {
  const enabled = options.enabled ?? true;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [windowRows, setWindowRows] = useState<NativeGameRow[]>([]);
  const [peerRowsForSeries, setPeerRowsForSeries] = useState<NativeGameRow[]>([]);
  const [selectedDate, setSelectedDateState] = useState<Date>(
    () =>
      parseDateKeyInTimeZone(
        NBA_OPENING_NIGHT_PREVIEW_DATE_KEY,
        TIMEZONE_JST
      ) ?? new Date()
  );
  const [selectedLeague, setSelectedLeagueState] = useState<SupportedLeague>("nba");
  const [refreshNonce, setRefreshNonce] = useState(0);

  const windowBoundsRef = useRef<{
    /** 取得時のアンカー日キー（キャッシュキーと一致） */
    windowKey: string;
    startKey: string;
    endKey: string;
  } | null>(null);
  const extendingRef = useRef(false);
  const wcWindowLoadedRef = useRef(false);
  const prevLeagueRef = useRef(selectedLeague);
  const lastSuccessfulRefreshNonceRef = useRef<number | null>(null);
  const selectedByLeagueRef = useRef<Partial<Record<SupportedLeague, Date>>>({});

  const setSelectedDate = useCallback(
    (value: Date | ((prev: Date) => Date)) => {
      setSelectedDateState((prev) => {
        const next = typeof value === "function" ? value(prev) : value;
        selectedByLeagueRef.current[selectedLeague] = next;
        return next;
      });
    },
    [selectedLeague]
  );

  const setSelectedLeague = useCallback(
    (next: SupportedLeague) => {
      const normalized: SupportedLeague = next === "wc" ? "nba" : next;
      if (normalized === selectedLeague) return;
      selectedByLeagueRef.current[selectedLeague] = selectedDate;
      setSelectedLeagueState(normalized);
    },
    [selectedDate, selectedLeague]
  );

  const dateKey = useMemo(
    () => toDateKeyInTimeZone(selectedDate, TIMEZONE_JST),
    [selectedDate]
  );

  /** 非 WC: Web `useGameDays` と同じアンカー日キー。WC は固定窓 */
  const fetchWindowKey = useMemo(
    () => (selectedLeague === "wc" ? "wc-page-window-v1" : dateKey),
    [selectedLeague, dateKey]
  );

  const displayRows = useMemo(
    () =>
      mergeNbaOpeningNightPreviewGames(
        selectedLeague,
        windowRows
      ) as NativeGameRow[],
    [selectedLeague, windowRows]
  );

  const displayPeerRows = useMemo(
    () =>
      mergeNbaOpeningNightPreviewGames(
        selectedLeague,
        peerRowsForSeries
      ) as NativeGameRow[],
    [selectedLeague, peerRowsForSeries]
  );

  const games = useMemo(
    () =>
      sortGamesByKickoffAsc(filterGamesForDay(displayRows, selectedDate)),
    [displayRows, selectedDate]
  );

  /** 日付切替前に自分の予想キャッシュを温める用（表示中の日以外も含む） */
  const windowGameIds = useMemo(
    () => displayRows.map((g) => String(g.id ?? "")).filter(Boolean),
    [displayRows]
  );

  const dateKeysWithGames = useMemo(
    () => sortedUniqueDateKeysFromRows(displayRows),
    [displayRows]
  );

  const hasWindowData = displayRows.length > 0;
  const peerGamesForSeries = displayPeerRows;

  function moveDay(offset: number) {
    setSelectedDate((prev) => {
      const next = new Date(prev);
      next.setDate(next.getDate() + offset);
      return next;
    });
  }

  function refresh() {
    setRefreshNonce((prev) => prev + 1);
  }

  useEffect(() => {
    if (!enabled) {
      setLoading(true);
      return;
    }

    let alive = true;

    const leagueChanged = prevLeagueRef.current !== selectedLeague;
    const isWc = false;
    if (leagueChanged) {
      prevLeagueRef.current = selectedLeague;
      windowBoundsRef.current = null;
      wcWindowLoadedRef.current = false;
      lastSuccessfulRefreshNonceRef.current = null;
      setWindowRows([]);
      setPeerRowsForSeries([]);
    }

    const forceRefresh =
      lastSuccessfulRefreshNonceRef.current !== null &&
      lastSuccessfulRefreshNonceRef.current !== refreshNonce;

    /** すでにメモリ上の窓が選択日を覆っていれば再取得しない（日付チップ連打の主因を止める） */
    const loaded = windowBoundsRef.current;
    const memoryCovers =
      !forceRefresh &&
      !leagueChanged &&
      loaded != null &&
      lastSuccessfulRefreshNonceRef.current === refreshNonce &&
      (isWc
        ? wcWindowLoadedRef.current
        : windowBoundsRef.current != null &&
          anchorWindowCoversDateKey(windowBoundsRef.current, dateKey));

    if (memoryCovers) {
      setLoading(false);
      setError(null);
      return;
    }

    const covering = !forceRefresh
      ? findCoveringGamesCache(selectedLeague, dateKey)
      : null;
      if (covering) {
      setWindowRows(covering.rows);
      setPeerRowsForSeries(
        covering.peerRows.length ? covering.peerRows : covering.rows
      );
      windowBoundsRef.current = {
        windowKey: covering.windowKey,
        startKey: covering.startKey,
        endKey: covering.endKey,
      };
      if (isWc) wcWindowLoadedRef.current = true;
      lastSuccessfulRefreshNonceRef.current = refreshNonce;
      setError(null);
      setLoading(false);
      return;
    }

    const cacheKey = gamesWindowCacheKey(selectedLeague, fetchWindowKey);
    const cached = gamesWindowCache.get(cacheKey);
    const cacheFresh =
      !!cached && Date.now() - cached.savedAt < GAMES_WINDOW_CACHE_TTL_MS;

    /** Web `useGameDays` 相当: TTL 内ならネット再取得しない */
    if (cacheFresh && cached && !forceRefresh) {
      setWindowRows(cached.rows);
      setPeerRowsForSeries(
        cached.peerRows.length ? cached.peerRows : cached.rows
      );
      windowBoundsRef.current = {
        windowKey: cached.windowKey,
        startKey: cached.startKey,
        endKey: cached.endKey,
      };
      if (isWc) wcWindowLoadedRef.current = true;
      lastSuccessfulRefreshNonceRef.current = refreshNonce;
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const ac = new AbortController();

    void (async () => {
      try {
        const apiBase = getUniterzApiBaseUrl();
        if (!apiBase) {
          throw new Error("games_window_api_base_missing");
        }

        let rows: NativeGameRow[];
        let peerRows: NativeGameRow[];
        let rangeStartKey = "";
        let rangeEndKey = "";

        try {
          const payload = await fetchGamesWindowShared({
            league: selectedLeague,
            anchorDateKey: dateKey,
            timeZone: TIMEZONE_JST,
            plusMinus: GAME_DAYS_PLUS_MINUS,
            apiBaseUrl: apiBase,
            signal: ac.signal,
          });
          if (!alive) return;
          rows = payload.rows as NativeGameRow[];
          peerRows = (payload.peerRows.length
            ? payload.peerRows
            : payload.rows) as NativeGameRow[];
          rangeStartKey = payload.range.startKey;
          rangeEndKey = payload.range.endKey;
        } catch (apiErr) {
          if (
            !alive ||
            ac.signal.aborted ||
            (apiErr instanceof Error && apiErr.name === "AbortError")
          ) {
            return;
          }
          throw apiErr;
        }

        if (!rangeStartKey || !rangeEndKey) {
          const { start, end } = getPlusMinusDaysRangeInTimeZone(
            selectedDate,
            TIMEZONE_JST,
            GAME_DAYS_PLUS_MINUS
          );
          rangeStartKey = toDateKeyInTimeZone(start, TIMEZONE_JST);
          rangeEndKey = toDateKeyInTimeZone(end, TIMEZONE_JST);
        }

        windowBoundsRef.current = {
          windowKey: fetchWindowKey,
          startKey: rangeStartKey,
          endKey: rangeEndKey,
        };
        if (isWc) wcWindowLoadedRef.current = true;
        lastSuccessfulRefreshNonceRef.current = refreshNonce;
        setWindowRows(rows);
        setPeerRowsForSeries(peerRows);

        gamesWindowCache.set(cacheKey, {
          rows,
          peerRows,
          windowKey: fetchWindowKey,
          startKey: rangeStartKey,
          endKey: rangeEndKey,
          savedAt: Date.now(),
        });

        const preferred =
          leagueChanged
            ? (selectedByLeagueRef.current[selectedLeague] ?? null)
            : selectedDate;
        const landing = resolveLandingDate(
          mergeNbaOpeningNightPreviewGames(
            selectedLeague,
            rows
          ) as NativeGameRow[],
          preferred
        );
        if (landing) {
          setSelectedDateState(landing);
          selectedByLeagueRef.current[selectedLeague] = landing;
        }

        if (alive) setLoading(false);
      } catch (e: unknown) {
        if (!alive || ac.signal.aborted) return;
        setError(e instanceof Error ? e.message : "unknown error");
        windowBoundsRef.current = null;
        lastSuccessfulRefreshNonceRef.current = null;
        setWindowRows([]);
        setPeerRowsForSeries([]);
        /** NBA プレビュー試合があれば一覧は出す */
        if (selectedLeague === "nba") {
          setError(null);
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
      ac.abort();
    };
  }, [enabled, fetchWindowKey, selectedDate, selectedLeague, refreshNonce, dateKey]);

  /** 端に近づいたら ±2 日だけ追加取得（スケルトンなしでマージ） */
  useEffect(() => {
    if (!enabled || loading) return;
    const bounds = windowBoundsRef.current;
    if (!bounds?.startKey || !bounds?.endKey) return;
    if (extendingRef.current) return;

    const wantForward = needsForwardWindowExtend(
      dateKey,
      bounds.endKey,
      TIMEZONE_JST
    );
    const wantBackward = needsBackwardWindowExtend(
      dateKey,
      bounds.startKey,
      TIMEZONE_JST
    );
    if (!wantForward && !wantBackward) return;

    const slices: Array<{ fromKey: string; toKey: string }> = [];
    if (wantBackward) {
      const fromKey = shiftDateKeyInTimeZone(
        bounds.startKey,
        TIMEZONE_JST,
        -GAMES_WINDOW_EDGE_EXTEND_DAYS
      );
      if (fromKey && fromKey < bounds.startKey) {
        slices.push({ fromKey, toKey: bounds.startKey });
      }
    }
    if (wantForward) {
      const toKey = shiftDateKeyInTimeZone(
        bounds.endKey,
        TIMEZONE_JST,
        GAMES_WINDOW_EDGE_EXTEND_DAYS
      );
      if (toKey && bounds.endKey < toKey) {
        slices.push({ fromKey: bounds.endKey, toKey });
      }
    }
    if (!slices.length) return;

    let alive = true;
    extendingRef.current = true;
    const ac = new AbortController();

    void (async () => {
      try {
        const apiBase = getUniterzApiBaseUrl();
        const extras: NativeGameRow[][] = [];
        const extraPeers: NativeGameRow[][] = [];

        if (!apiBase) return;

        for (const slice of slices) {
          const payload = await fetchGamesWindowShared({
            league: selectedLeague,
            timeZone: TIMEZONE_JST,
            fromDateKey: slice.fromKey,
            toDateKey: slice.toKey,
            apiBaseUrl: apiBase,
            signal: ac.signal,
          });
          if (!alive) return;
          extras.push(payload.rows as NativeGameRow[]);
          extraPeers.push(
            (payload.peerRows.length
              ? payload.peerRows
              : payload.rows) as NativeGameRow[]
          );
        }

        let mergedExtra: NativeGameRow[] = [];
        let mergedExtraPeers: NativeGameRow[] = [];
        for (let i = 0; i < extras.length; i++) {
          mergedExtra = mergeGameRowsById(
            mergedExtra,
            extras[i]!
          ) as NativeGameRow[];
          mergedExtraPeers = mergeGameRowsById(
            mergedExtraPeers,
            extraPeers[i]!
          ) as NativeGameRow[];
        }

        const nextStart = wantBackward
          ? (slices.find((s) => s.toKey === bounds.startKey)?.fromKey ??
            bounds.startKey)
          : bounds.startKey;
        const nextEnd = wantForward
          ? (slices.find((s) => s.fromKey === bounds.endKey)?.toKey ??
            bounds.endKey)
          : bounds.endKey;

        setWindowRows(
          (prev) => mergeGameRowsById(prev, mergedExtra) as NativeGameRow[]
        );
        setPeerRowsForSeries(
          (prev) =>
            mergeGameRowsById(
              prev.length ? prev : [],
              mergedExtraPeers.length ? mergedExtraPeers : mergedExtra
            ) as NativeGameRow[]
        );

        windowBoundsRef.current = {
          windowKey: bounds.windowKey,
          startKey: nextStart,
          endKey: nextEnd,
        };

        const cacheKey = gamesWindowCacheKey(
          selectedLeague,
          bounds.windowKey
        );
        const prevCache = gamesWindowCache.get(cacheKey);
        gamesWindowCache.set(cacheKey, {
          rows: mergeGameRowsById(
            prevCache?.rows ?? [],
            mergedExtra
          ) as NativeGameRow[],
          peerRows: mergeGameRowsById(
            prevCache?.peerRows ?? prevCache?.rows ?? [],
            mergedExtraPeers.length ? mergedExtraPeers : mergedExtra
          ) as NativeGameRow[],
          windowKey: bounds.windowKey,
          startKey: nextStart,
          endKey: nextEnd,
          savedAt: Date.now(),
        });
      } catch (e) {
        if (!alive || ac.signal.aborted) return;
        if (e instanceof Error && e.name === "AbortError") return;
        console.warn("[useTodayGames] edge extend failed", e);
      } finally {
        extendingRef.current = false;
      }
    })();

    return () => {
      alive = false;
      ac.abort();
      extendingRef.current = false;
    };
  }, [enabled, loading, dateKey, selectedLeague]);

  useEffect(() => {
    if (loading) return;
    const selectedMonthKey = dateKey.slice(0, 7);
    const windowHasSelectedMonth = dateKeysWithGames.some((key) =>
      key.startsWith(selectedMonthKey)
    );
    if (dateKeysWithGames.length > 0 && !windowHasSelectedMonth) return;
    if (dateKeysWithGames.length === 0) return;
    if (dateKeysWithGames.includes(dateKey)) return;

    const landing = resolveLandingDate(displayRows, selectedDate);
    if (!landing) return;
    const landingKey = toDateKeyInTimeZone(landing, TIMEZONE_JST);
    if (landingKey === dateKey) return;
    setSelectedDateState(landing);
    selectedByLeagueRef.current[selectedLeague] = landing;
  }, [loading, dateKeysWithGames, dateKey, displayRows, selectedDate, selectedLeague]);

  return {
    loading,
    error,
    games,
    windowGameIds,
    peerGamesForSeries,
    dateKeysWithGames,
    hasWindowData,
    selectedDate,
    setSelectedDate,
    selectedLeague,
    dateKey,
    setSelectedLeague,
    goPrevDay: () => moveDay(-1),
    goNextDay: () => moveDay(1),
    goToday: () => setSelectedDate(new Date()),
    refresh,
  };
}
