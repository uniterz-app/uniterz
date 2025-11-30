// app/component/profile/useUserStats.ts
"use client";

import { useEffect, useMemo, useState } from "react";
import { db, auth } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";

// Firestore の生データ
export type StatsBucket = {
  posts?: number;        // 確定投稿数
  postsTotal?: number;   // 総投稿数（確定＋未確定）
  createdPosts?: number; // Daily から吸い上げた総投稿数
  hit?: number;
  units?: number;
  oddsSum?: number;
  oddsCnt?: number;
};

// SummaryCards に渡すデータ構造
export type SummaryForCards = {
  posts: number;       // 確定投稿数
  postsTotal: number;  // 総投稿数
  winRate: number;
  units: number;
  avgOdds: number;
};

function toSummary(b?: StatsBucket): SummaryForCards | undefined {
  if (!b) return undefined;

  // ★ 総投稿数（両対応）
  const postsTotal = Number(
    b.postsTotal ??
      b.createdPosts ??
      0
  );

  // ★ 確定投稿数
  const posts = Number(b.posts ?? 0);

  const hit     = Number(b.hit ?? 0);
  const units   = Number(b.units ?? 0);
  const oddsSum = Number(b.oddsSum ?? 0);
  const oddsCnt = Number(b.oddsCnt ?? 0);

  // ★ 勝率は確定投稿のみ
  const winRate = posts > 0 ? hit / posts : 0;

  // ★ 平均オッズ
  const avgOdds = oddsCnt > 0 ? oddsSum / oddsCnt : 0;

  return { posts, postsTotal, winRate, units, avgOdds };
}

/** user_stats/{uid} を購読 */
export function useUserStats(uid?: string | null) {
  const [loading, setLoading] = useState<boolean>(true);
  const [byRange, setByRange] = useState<any | undefined>(undefined);

  useEffect(() => {
    if (!uid) {
      setByRange(undefined);
      setLoading(false);
      return;
    }

    const me = auth.currentUser;
    if (!me) {
      setByRange(undefined);
      setLoading(false);
      return;
    }

    setLoading(true);

    const ref = doc(db, "user_stats", uid);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        const d = snap.data() as any | undefined;
        const next = {
          "7d": d?.["7d"],
          "30d": d?.["30d"],
          "all": d?.["all"],
        };
        setByRange(next);
        setLoading(false);
      },
      () => {
        setByRange(undefined);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [uid, auth.currentUser]);

  const summaries = useMemo(() => {
    if (!byRange) return undefined;
    return {
      "7d": toSummary(byRange["7d"]),
      "30d": toSummary(byRange["30d"]),
      "all": toSummary(byRange["all"]),
    };
  }, [byRange]);

  return { loading, byRange, summaries };
}
