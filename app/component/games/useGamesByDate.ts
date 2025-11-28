// app/component/games/useGamesByDate.ts
"use client";

import { useEffect, useMemo, useState } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
  limit,
  Timestamp,
} from "firebase/firestore";

type League = "bj" | "j";
const SEASON = "2025-26";

// JST の 1 日境界
const jstDayRange = (d: Date) => {
  const start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
  const end   = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1, 0, 0, 0, 0);
  return {
    startTs: Timestamp.fromDate(start),
    endTs: Timestamp.fromDate(end),
  };
};

export function useGamesByDate(league: League, jstDate: Date | null) {
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setErr] = useState<string | null>(null);

  // ★ jstDate が null なら空データを返す
  if (!jstDate) {
    return { loading: true, error: null, games: [] };
  }

  const { startTs, endTs } = useMemo(() => jstDayRange(jstDate), [jstDate]);

  useEffect(() => {
    setLoading(true);
    setErr(null);

    const ref = collection(db, "games");

    const q = query(
      ref,
      where("league", "==", league),
      where("season", "==", SEASON),
      where("startAtJst", ">=", startTs),
      where("startAtJst", "<", endTs),
      orderBy("startAtJst", "asc"),
      limit(200)
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setGames(rows);
        setLoading(false);
      },
      (e) => {
        setErr(e?.message ?? "unknown error");
        setLoading(false);
      }
    );

    return () => unsub();
  }, [league, startTs, endTs]);

  return { loading, error, games };
}
