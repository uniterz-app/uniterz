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
import { resolveGameStatus } from "../../shared/gameRow";
import { GAME_SCHEDULE_SEASON } from "../../shared/gameSchedule";
import {
  TIMEZONE_JST,
  getDayRangeInTimeZone,
  getPlusMinusDaysRangeInTimeZone,
  parseDateKeyInTimeZone,
  toDateKeyInTimeZone,
} from "../../../../../lib/time/zonedTime";
import { getWcGamesPageQueryRange } from "../../../../../lib/wc/wcGamesPageScheduleWindow";

export type SupportedLeague = "nba" | "bj" | "j1" | "pl" | "wc";

const WC_GAMES_PAGE_WINDOW_LIMIT = 500;

export type NativeGameRow = {
  id: string;
  [key: string]: unknown;
};

/** 選択日の JST 暦日から前後この日数をまとめて取得（Web `useGameDays` と同じ ±10） */
const GAME_DAYS_PLUS_MINUS = 10;
const GAME_DAYS_WINDOW_QUERY_LIMIT = 500;

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
  if (!gameDays.length) return null;
  const todayKey = toDateKeyInTimeZone(new Date(), TIMEZONE_JST);
  const initial =
    findInitialGameDay({
      gameDays,
      stateSelected: preferred,
      todayKey,
      timeZone: TIMEZONE_JST,
    }) ?? gameDays[0]!;
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
  const [selectedDate, setSelectedDateState] = useState<Date>(() => new Date());
  const [selectedLeague, setSelectedLeagueState] = useState<SupportedLeague>("nba");
  const [refreshNonce, setRefreshNonce] = useState(0);

  const windowBoundsRef = useRef<{ min: string; max: string } | null>(null);
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

  const games = useMemo(
    () => filterGamesForDay(windowRows, selectedDate),
    [windowRows, selectedDate]
  );

  const dateKeysWithGames = useMemo(
    () => sortedUniqueDateKeysFromRows(windowRows),
    [windowRows]
  );

  /** シリーズ推定用（窓内の全行＝従来の peer と同じデータ源） */
  const peerGamesForSeries = windowRows;

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
    }

    const dayKey = toDateKeyInTimeZone(selectedDate, TIMEZONE_JST);
    const b = windowBoundsRef.current;
    const insideWindow =
      b != null &&
      dayKey >= b.min &&
      dayKey <= b.max &&
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
          : getPlusMinusDaysRangeInTimeZone(
              selectedDate,
              TIMEZONE_JST,
              GAME_DAYS_PLUS_MINUS
            );

        const q = query(
          collection(db, "games"),
          where("league", "==", selectedLeague),
          where("season", "==", GAME_SCHEDULE_SEASON),
          where("startAtJst", ">=", Timestamp.fromDate(start)),
          where("startAtJst", "<", Timestamp.fromDate(end)),
          orderBy("startAtJst", "asc"),
          limit(isWc ? WC_GAMES_PAGE_WINDOW_LIMIT : GAME_DAYS_WINDOW_QUERY_LIMIT)
        );
        const snap = await getDocs(q);
        if (!alive) return;

        const rows = snap.docs.map((row) => ({
          id: row.id,
          ...(row.data() as Omit<NativeGameRow, "id">),
        }));

        const minKey = toDateKeyInTimeZone(start, TIMEZONE_JST);
        const maxKey = toDateKeyInTimeZone(new Date(end.getTime() - 1), TIMEZONE_JST);

        windowBoundsRef.current = { min: minKey, max: maxKey };
        if (isWc) wcWindowLoadedRef.current = true;
        lastSuccessfulRefreshNonceRef.current = refreshNonce;
        setWindowRows(rows);

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
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [selectedDate, selectedLeague, refreshNonce]);

  /** 月送りなどで試合のない暦日に寄ったとき、ストリップ上の試合日へ補正 */
  useEffect(() => {
    if (loading) return;
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
