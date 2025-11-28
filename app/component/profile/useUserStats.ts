// app/component/profile/useUserStats.ts
"use client";

import { useEffect, useMemo, useState } from "react";
import { db, auth } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";

// Firestore バケット
export type StatsBucket = {
  posts?: number;       // 確定投稿数
  postsTotal?: number;  // 総投稿数
  hit?: number;
  units?: number;
  oddsSum?: number;
  oddsCnt?: number;
};

export type ByRange = {
  "7d"?: StatsBucket;
  "30d"?: StatsBucket;
  "all"?: StatsBucket;
};

export type SummaryForCards = {
  posts: number;
  winRate: number;
  units: number;
  avgOdds: number;
};

export type SummaryMap = {
  "7d"?: SummaryForCards;
  "30d"?: SummaryForCards;
  "all"?: SummaryForCards;
};

function toSummary(b?: StatsBucket): SummaryForCards | undefined {
  if (!b) return undefined;

  const postsConfirmed = Number(b.posts ?? 0);
  const postsTotal     = Number(b.postsTotal ?? b.posts ?? 0);
  const hit            = Number(b.hit ?? 0);
  const units          = Number(b.units ?? 0);
  const oddsSum        = Number(b.oddsSum ?? 0);
  const oddsCnt        = Number(b.oddsCnt ?? 0);

  const winRate = postsConfirmed > 0 ? hit / postsConfirmed : 0;
  const avgOdds = oddsCnt > 0 ? oddsSum / oddsCnt : 0;

  return { posts: postsTotal, winRate, units, avgOdds };
}

/** user_stats/{uid} を購読 */
export function useUserStats(uid?: string | null) {
  const [loading, setLoading] = useState<boolean>(true);
  const [byRange, setByRange] = useState<ByRange | undefined>(undefined);

  useEffect(() => {
    // ★ uid が無い時 → 購読しない
    if (!uid) {
      setByRange(undefined);
      setLoading(false);
      return;
    }

    // ★ 未ログイン状態では購読を開始しない（ログアウト時のエラー防止）
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
        const next: ByRange = {
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

    // ★ auth.currentUser を依存に含めて、ログアウト時に再評価・購読解除
  }, [uid, auth.currentUser]);

  const summaries: SummaryMap | undefined = useMemo(() => {
    if (!byRange) return undefined;
    return {
      "7d": toSummary(byRange["7d"]),
      "30d": toSummary(byRange["30d"]),
      "all": toSummary(byRange["all"]),
    };
  }, [byRange]);

  return { loading, byRange, summaries };
}
