import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Timestamp,
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { db } from "../../lib/firebase";
import { resolveGameStatus, GAME_SCHEDULE_SEASON } from "@uniterz/shared";
import {
  TIMEZONE_JST,
  getCalendarMonthRangeInTimeZone,
  getDayRangeInTimeZone,
  parseDateKeyInTimeZone,
  toDateKeyInTimeZone,
} from "../../../../../lib/time/zonedTime";
import { getWcGamesPageQueryRange } from "../../../../../lib/wc/wcGamesPageScheduleWindow";
import { mergePlayoffSeriesPeersForWindowGames } from "../../../../../lib/games/fetchPlayoffSeriesPeerGames";
import { sortGamesByKickoffAsc } from "../../../../../lib/games/sortGamesByKickoff";

export type SupportedLeague = "nba" | "bj" | "j1" | "pl" | "wc";

const WC_GAMES_PAGE_WINDOW_LIMIT = 500;

export type NativeGameRow = {
  id: string;
  [key: string]: unknown;
};

/** 非 WC: 選択月の暦月全体を取得（月送りで月初に寄っても全試合日がストリップに出る） */
const CALENDAR_MONTH_QUERY_LIMIT = 500;

function filterGamesForDay(rows: NativeGameRow[], day: Date): NativeGameRow[] {
  const { start, end } = getDayRangeInTimeZone(day, TIMEZONE_JST);
  const startTs = start.getTime();
  const endTs = end.getTime();
  return rows.filter((g) => {
    const raw = g.startAtJst as Timestamp | undefined;
    const d = raw?.toDate?.();
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
    // 月送り直後は旧 window が残る — 今日以降の日付へ飛ばさない
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
    const raw = g.startAtJst as Timestamp | undefined;
    const d = raw?.toDate?.();
    if (!d) continue;
    keys.add(toDateKeyInTimeZone(d, TIMEZONE_JST));
  }
  return Array.from(keys).sort();
}

export function useTodayGames() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  /** 現在の窓に含まれる全試合（その日の一覧・シリーズ推定・日付チップはこれから派生） */
  const [windowRows, setWindowRows] = useState<NativeGameRow[]>([]);
  const [peerRowsForSeries, setPeerRowsForSeries] = useState<NativeGameRow[]>([]);
  const [selectedDate, setSelectedDateState] = useState<Date>(() => new Date());
  const [selectedLeague, setSelectedLeagueState] = useState<SupportedLeague>("wc");
  const [refreshNonce, setRefreshNonce] = useState(0);

  const windowBoundsRef = useRef<{ monthKey: string } | null>(null);
  const wcWindowLoadedRef = useRef(false);
  const prevLeagueRef = useRef(selectedLeague);
  const lastSuccessfulRefreshNonceRef = useRef<number | null>(null);
  /** Web `selectedByLeague`：リーグごとに最後に選んだ試合日を保持 */
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
      if (next === selectedLeague) return;
      selectedByLeagueRef.current[selectedLeague] = selectedDate;
      setSelectedLeagueState(next);
    },
    [selectedDate, selectedLeague]
  );

  const dateKey = useMemo(
    () => toDateKeyInTimeZone(selectedDate, TIMEZONE_JST),
    [selectedDate]
  );

  const monthKey = useMemo(() => dateKey.slice(0, 7), [dateKey]);

  const games = useMemo(
    () =>
      sortGamesByKickoffAsc(filterGamesForDay(windowRows, selectedDate)),
    [windowRows, selectedDate]
  );

  const dateKeysWithGames = useMemo(
    () => sortedUniqueDateKeysFromRows(windowRows),
    [windowRows]
  );

  /** シリーズ推定用（暦月窓＋プレーオフ兄弟試合） */
  const peerGamesForSeries = peerRowsForSeries;

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
    let alive = true;

    const leagueChanged = prevLeagueRef.current !== selectedLeague;
    const isWc = selectedLeague === "wc";
    if (leagueChanged) {
      prevLeagueRef.current = selectedLeague;
      windowBoundsRef.current = null;
      wcWindowLoadedRef.current = false;
      lastSuccessfulRefreshNonceRef.current = null;
      setWindowRows([]);
      setPeerRowsForSeries([]);
    }

    const b = windowBoundsRef.current;
    const insideWindow =
      b != null &&
      b.monthKey === monthKey &&
      lastSuccessfulRefreshNonceRef.current === refreshNonce;
    const wcCached =
      isWc &&
      wcWindowLoadedRef.current &&
      lastSuccessfulRefreshNonceRef.current === refreshNonce;

    if (!leagueChanged && (isWc ? wcCached : insideWindow)) {
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    void (async () => {
      try {
        const { start, end } = isWc
          ? getWcGamesPageQueryRange(TIMEZONE_JST)
          : getCalendarMonthRangeInTimeZone(selectedDate, TIMEZONE_JST);

        const q = query(
          collection(db, "games"),
          where("league", "==", selectedLeague),
          where("season", "==", GAME_SCHEDULE_SEASON),
          where("startAtJst", ">=", Timestamp.fromDate(start)),
          where("startAtJst", "<", Timestamp.fromDate(end)),
          orderBy("startAtJst", "asc"),
          limit(isWc ? WC_GAMES_PAGE_WINDOW_LIMIT : CALENDAR_MONTH_QUERY_LIMIT)
        );
        const snap = await getDocs(q);
        if (!alive) return;

        const rows = snap.docs.map((row) => ({
          id: row.id,
          ...(row.data() as Omit<NativeGameRow, "id">),
        }));

        const peerRows = (await mergePlayoffSeriesPeersForWindowGames(
          rows
        )) as NativeGameRow[];

        windowBoundsRef.current = { monthKey };
        if (isWc) wcWindowLoadedRef.current = true;
        lastSuccessfulRefreshNonceRef.current = refreshNonce;
        setWindowRows(rows);
        setPeerRowsForSeries(peerRows.length ? peerRows : rows);

        const preferred =
          leagueChanged
            ? (selectedByLeagueRef.current[selectedLeague] ?? null)
            : selectedDate;
        const landing = resolveLandingDate(rows, preferred);
        if (landing) {
          setSelectedDateState(landing);
          selectedByLeagueRef.current[selectedLeague] = landing;
        }
      } catch (e: unknown) {
        if (!alive) return;
        setError(e instanceof Error ? e.message : "unknown error");
        windowBoundsRef.current = null;
        lastSuccessfulRefreshNonceRef.current = null;
        setWindowRows([]);
        setPeerRowsForSeries([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [monthKey, selectedDate, selectedLeague, refreshNonce]);

  /** 月送りなどで試合のない暦日に寄ったとき、ストリップ上の試合日へ補正 */
  useEffect(() => {
    if (loading) return;
    const selectedMonthKey = dateKey.slice(0, 7);
    const windowHasSelectedMonth = dateKeysWithGames.some((key) =>
      key.startsWith(selectedMonthKey)
    );
    // 旧月の window が残っている間は補正しない（6月→5月で即座に6月へ戻るのを防ぐ）
    if (dateKeysWithGames.length > 0 && !windowHasSelectedMonth) return;
    if (dateKeysWithGames.length === 0) return;
    if (dateKeysWithGames.includes(dateKey)) return;

    const landing = resolveLandingDate(windowRows, selectedDate);
    if (!landing) return;
    const landingKey = toDateKeyInTimeZone(landing, TIMEZONE_JST);
    if (landingKey === dateKey) return;
    setSelectedDateState(landing);
    selectedByLeagueRef.current[selectedLeague] = landing;
  }, [loading, dateKeysWithGames, dateKey, windowRows, selectedDate, selectedLeague]);

  return {
    loading,
    error,
    games,
    peerGamesForSeries,
    dateKeysWithGames,
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
