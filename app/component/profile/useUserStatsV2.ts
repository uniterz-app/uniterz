"use client";

import { useEffect, useMemo, useState } from "react";
import { db } from "@/lib/firebase";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getCountFromServer,
  Timestamp,
} from "firebase/firestore";

export type SummaryForCardsV2 = {
  posts: number;
  fullPosts: number;
  winRate: number;
  avgPrecision: number;
  avgBrier: number;
  avgUpset: number;
  calibrationError: number;
};

/** Firestore の 1 期間分のデータを変換 */
function toSummaryV2(src: any | undefined): Omit<SummaryForCardsV2, "fullPosts"> {
  if (!src) {
    return {
      posts: 0,
      winRate: 0,
      avgPrecision: NaN,
      avgBrier: NaN,
      avgUpset: NaN,
      calibrationError: NaN, 
    };
  }
  const safe = (v: any) =>
    typeof v === "number" && Number.isFinite(v) ? v : NaN;

  return {
    posts: Number(src.posts ?? 0),
    winRate: safe(src.winRate),
    avgPrecision: safe(src.avgPrecision),
    avgBrier: safe(src.avgBrier),
    avgUpset: safe(src.avgUpset),
    calibrationError: safe(src.calibrationError), // ← null/undefined は NaNになる
  };
}

export function useUserStatsV2(uid?: string | null) {
  const [loading, setLoading] = useState(true);
  const [raw, setRaw] = useState<any | null>(null);

  // ================================
  // Firestore を一回だけ読み込む
  // ================================
  useEffect(() => {
    if (!uid) {
      setRaw(null);
      setLoading(false);
      return;
    }

    async function fetchStats() {
      setLoading(true);
      const ref = doc(db, "user_stats_v2", uid!);

      try {
        const snap = await getDoc(ref);

        if (snap.exists()) {
          console.log("📄 user_stats_v2 fetched:", snap.data());
          setRaw(snap.data());
        } else {
          console.log("📄 user_stats_v2 not found");
          setRaw({});
        }
      } catch (e) {
        console.error("❌ Failed to fetch user_stats_v2:", e);
        setRaw({});
      }

      setLoading(false);
    }

    fetchStats();
  }, [uid]);

  // ================================
  // 投稿数（fullPosts）
  // ================================
  const [full, setFull] = useState({
    "7d": 0,
    "30d": 0,
    "all": 0,
  });

  useEffect(() => {
    if (!uid) return;

    async function fetchFullCounts() {
      const now = new Date();

      // --- 7 days ---
      const d7 = new Date(now);
      d7.setDate(d7.getDate() - 6);

      const count7 = await getCountFromServer(
        query(
          collection(db, "posts"),
          where("authorUid", "==", uid),
          where("schemaVersion", "==", 2),
          where("createdAt", ">=", Timestamp.fromDate(d7))
        )
      ).then((r) => r.data().count);

      // --- 30 days ---
      const d30 = new Date(now);
      d30.setDate(d30.getDate() - 29);

      const count30 = await getCountFromServer(
        query(
          collection(db, "posts"),
          where("authorUid", "==", uid),
          where("schemaVersion", "==", 2),
          where("createdAt", ">=", Timestamp.fromDate(d30))
        )
      ).then((r) => r.data().count);

      // --- all posts ---
      const countAll = await getCountFromServer(
        query(
          collection(db, "posts"),
          where("authorUid", "==", uid),
          where("schemaVersion", "==", 2)
        )
      ).then((r) => r.data().count);

      setFull({
        "7d": count7,
        "30d": count30,
        "all": countAll,
      });
    }

    fetchFullCounts();
  }, [uid]);

  // ================================
  // UI に渡す summaries を生成
  // ================================
  const summaries = useMemo(() => {
    if (!raw) return undefined;

    return {
      "7d": {
        fullPosts: full["7d"],
        ...toSummaryV2(raw["7d"]?.all),
      },
      "30d": {
        fullPosts: full["30d"],
        ...toSummaryV2(raw["30d"]?.all),
      },
      "all": {
        fullPosts: full["all"],
        ...toSummaryV2(raw["all"]?.all),
      },
    };
  }, [raw, full]);

  return { loading, raw, summaries };
}
