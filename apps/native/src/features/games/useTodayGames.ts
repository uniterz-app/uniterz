import { useEffect, useMemo, useRef, useState } from "react";
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
  toDateKeyInTimeZone,
} from "../../../../../lib/time/zonedTime";

export type SupportedLeague = "nba" | "bj" | "j1" | "pl";

export type NativeGameRow = {
  id: string;
  [key: string]: unknown;
};

/** 選択日の JST 暦日から前後この日数をまとめて取得し、日付変更では再クエリしない */
const GAME_DAYS_PLUS_MINUS = 20;
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

function sortedUniqueDateKeysFromRows(rows: NativeGameRow[]): string[] {
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
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [selectedLeague, setSelectedLeague] = useState<SupportedLeague>("nba");
  const [refreshNonce, setRefreshNonce] = useState(0);

  const windowBoundsRef = useRef<{ min: string; max: string } | null>(null);
  const prevLeagueRef = useRef(selectedLeague);
  const lastSuccessfulRefreshNonceRef = useRef<number | null>(null);

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
    if (leagueChanged) {
      prevLeagueRef.current = selectedLeague;
      windowBoundsRef.current = null;
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

    if (!leagueChanged && insideWindow) {
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    void (async () => {
      try {
        const { start, end } = getPlusMinusDaysRangeInTimeZone(
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
          limit(GAME_DAYS_WINDOW_QUERY_LIMIT)
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
        lastSuccessfulRefreshNonceRef.current = refreshNonce;
        setWindowRows(rows);
        setSelectedDate((prev) => pickLandingDateAfterFetch(prev, rows));
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
