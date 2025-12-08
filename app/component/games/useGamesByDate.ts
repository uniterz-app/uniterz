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

import type { League } from "@/lib/leagues";       // ← ★ 重要：共通 League を使う
import { normalizeLeague } from "@/lib/leagues";   // ← ★ Firestore の揺れ対策

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

export function useGamesByDate(rawLeague: League, jstDate: Date | null) {
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setErr] = useState<string | null>(null);

  // ★ Firestore 内 "B1" や "j1" などの揺れを吸収して League 型に正規化
  const league = normalizeLeague(rawLeague);

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
