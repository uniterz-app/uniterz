// rankings/useRanking.ts

"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";

export type RankingMetric =
  | "winRate"
  | "totalPoints"
  | "totalPrecision"
  | "totalUpset"
  | "activeWinStreak";

export type RankingRow = {
  uid: string;
  displayName: string;
  handle: string | null;
  photoURL: string | null;
  plan?: "free" | "pro";

  totalPosts: number;
  totalWins: number;
  winRate: number;

  totalPoints: number;
  totalPrecision: number;
  /** WC 完全的中（API totalExactHits） */
  totalExactHits?: number;
  totalUpset: number;
  totalGoalScorerHits?: number;
  currentStreak: number;
  activeWinStreak: number;

  rank: number;
};

export function useRanking(metric: RankingMetric) {
  const [authReady, setAuthReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<RankingRow[]>([]);
  const [myUid, setMyUid] = useState<string | null>(null);
  const [myRank, setMyRank] = useState<number | null>(null);
  const [myRow, setMyRow] = useState<RankingRow | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setMyUid(user?.uid ?? null);
      setAuthReady(true);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!authReady) return;

    let cancelled = false;

    async function run() {
      setLoading(true);

      try {
        const url = myUid
          ? `/api/cumulative-ranking?metric=${metric}&uid=${encodeURIComponent(myUid)}`
          : `/api/cumulative-ranking?metric=${metric}`;

        const res = await fetch(url);

        const json = await res.json();

        if (!cancelled) {
          const raw = (json?.rows ?? []) as RankingRow[];
          setRows(raw);
          setMyRank(json?.myRank ?? null);
          setMyRow(json?.myRow ?? null);
        }
      } catch {
        if (!cancelled) {
          setRows([]);
          setMyRank(null);
          setMyRow(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void run();

    return () => {
      cancelled = true;
    };
  }, [metric, myUid, authReady]);

  return {
    loading,
    rows,
    myRank,
    myUid,
    myRow,
  };
}