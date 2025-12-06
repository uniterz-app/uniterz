"use client";

import { useEffect, useMemo, useState } from "react";
import { db, auth } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";

// --- SummaryCardsV2 が期待するデータ型 ---
export type SummaryForCardsV2 = {
  posts: number;
  winRate: number;
  avgPrecision: number; // 0〜15
  avgBrier: number;     // 0〜1
  avgUpset: number;     // 0〜10
};

/** Firestore の 1 期間分のデータを SummaryForCardsV2 に整形 */
function toSummaryV2(src: any | undefined): SummaryForCardsV2 | undefined {
  if (!src) return undefined;

  return {
    posts: Number(src.posts ?? 0),
    winRate: Number(src.winRate ?? 0),
    avgPrecision: Number(src.avgPrecision ?? 0),
    avgBrier: Number(src.avgBrier ?? 0),
    avgUpset: Number(src.avgUpset ?? 0), // ← upsetRate は使わず avgUpset に統一
  };
}

/** user_stats_v2/{uid} を購読 */
export function useUserStatsV2(uid?: string | null) {
  const [loading, setLoading] = useState<boolean>(true);
  const [raw, setRaw] = useState<any | undefined>(undefined);

  useEffect(() => {
    if (!uid || !auth.currentUser) {
      setRaw(undefined);
      setLoading(false);
      return;
    }

    setLoading(true);
    const ref = doc(db, "user_stats_v2", uid);

    const unsub = onSnapshot(
      ref,
      (snap) => {
        setRaw(snap.data());
        setLoading(false);
      },
      () => {
        setRaw(undefined);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [uid, auth.currentUser]);

  /** 7d / 30d / all をまとめて返す */
  const summaries = useMemo(() => {
    if (!raw) return undefined;

    return {
      "7d": toSummaryV2(raw["7d"]),
      "30d": toSummaryV2(raw["30d"]),
      "all": toSummaryV2(raw["all"]),
    };
  }, [raw]);

  return { loading, raw, summaries };
}
