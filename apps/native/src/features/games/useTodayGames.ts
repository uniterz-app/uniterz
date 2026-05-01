import { useEffect, useMemo, useState } from "react";
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
import { GAME_SCHEDULE_SEASON } from "../../shared/gameSchedule";
import {
  TIMEZONE_JST,
  getDayRangeInTimeZone,
  toDateKeyInTimeZone,
} from "../../utils/date";

export type SupportedLeague = "nba" | "bj" | "j1" | "pl";

export type NativeGameRow = {
  id: string;
  [key: string]: unknown;
};

export function useTodayGames() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [games, setGames] = useState<NativeGameRow[]>([]);
  /** ±21 日クエリの全行（プレーオフのシリーズ勝敗推定に使用） */
  const [peerGamesForSeries, setPeerGamesForSeries] = useState<NativeGameRow[]>([]);
  const [dateKeysWithGames, setDateKeysWithGames] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [selectedLeague, setSelectedLeague] = useState<SupportedLeague>("nba");
  const [refreshNonce, setRefreshNonce] = useState(0);

  const dateKey = useMemo(
    () => toDateKeyInTimeZone(selectedDate, TIMEZONE_JST),
    [selectedDate]
  );

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

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const { start, end } = getDayRangeInTimeZone(selectedDate, TIMEZONE_JST);

        const q = query(
          collection(db, "games"),
          where("league", "==", selectedLeague),
          where("season", "==", GAME_SCHEDULE_SEASON),
          where("startAtJst", ">=", Timestamp.fromDate(start)),
          where("startAtJst", "<", Timestamp.fromDate(end)),
          orderBy("startAtJst", "asc"),
          limit(30)
        );
        const snap = await getDocs(q);
        if (!alive) return;
        setGames(
          snap.docs.map((row) => ({
            id: row.id,
            ...(row.data() as Omit<NativeGameRow, "id">),
          }))
        );
      } catch (e: any) {
        if (!alive) return;
        setError(e?.message ?? "unknown error");
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    }

    void load();
    return () => {
      alive = false;
    };
  }, [selectedDate, refreshNonce, selectedLeague]);

  useEffect(() => {
    let alive = true;

    async function loadDateKeysWithGames() {
      try {
        const fromDate = new Date(selectedDate);
        fromDate.setDate(fromDate.getDate() - 21);
        const toDate = new Date(selectedDate);
        toDate.setDate(toDate.getDate() + 21);
        const { start } = getDayRangeInTimeZone(fromDate, TIMEZONE_JST);
        const { end } = getDayRangeInTimeZone(toDate, TIMEZONE_JST);

        const q = query(
          collection(db, "games"),
          where("league", "==", selectedLeague),
          where("season", "==", GAME_SCHEDULE_SEASON),
          where("startAtJst", ">=", Timestamp.fromDate(start)),
          where("startAtJst", "<", Timestamp.fromDate(end)),
          orderBy("startAtJst", "asc"),
          limit(500)
        );
        const snap = await getDocs(q);
        if (!alive) return;
        const keys = new Set<string>();
        const peerRows: NativeGameRow[] = [];
        for (const row of snap.docs) {
          const data = row.data() as Omit<NativeGameRow, "id">;
          peerRows.push({ id: row.id, ...data });
          const raw = data?.startAtJst as Timestamp | undefined;
          const date = raw?.toDate?.();
          if (!date) continue;
          keys.add(toDateKeyInTimeZone(date, TIMEZONE_JST));
        }
        setDateKeysWithGames(Array.from(keys));
        setPeerGamesForSeries(peerRows);
      } catch {
        if (!alive) return;
        setDateKeysWithGames([]);
        setPeerGamesForSeries([]);
      }
    }

    void loadDateKeysWithGames();
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
