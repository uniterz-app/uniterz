// rankings/useRanking.ts

"use client";

import { useEffect, useState } from "react";
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

  totalPosts: number;
  totalWins: number;
  winRate: number;

  totalPoints: number;
  totalPrecision: number;
  totalUpset: number;
  currentStreak: number;
  activeWinStreak: number;

  rank: number;
};

export function useRanking(metric: RankingMetric) {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<RankingRow[]>([]);
  const [myUid, setMyUid] = useState<string | null>(
    auth.currentUser?.uid ?? null
  );
  const [myRank, setMyRank] = useState<number | null>(null);
  const [myRow, setMyRow] = useState<RankingRow | null>(null);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((user) => {
      setMyUid(user?.uid ?? null);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);

      try {
        const url = myUid
          ? `/api/cumulative-ranking?metric=${metric}&uid=${myUid}`
          : `/api/cumulative-ranking?metric=${metric}`;

        const res = await fetch(url, {
          cache: "no-store",
        });

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

    run();

    return () => {
      cancelled = true;
    };
  }, [metric, myUid]);

  return {
    loading,
    rows,
    myRank,
    myUid,
    myRow,
  };
}