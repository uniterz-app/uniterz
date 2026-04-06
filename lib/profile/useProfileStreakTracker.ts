"use client";

import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

/** Last20 Tracker 用の取得件数（確定済み・settledAt 降順で最大 N） */
export const STREAK_TRACKER_LAST_N = 20;

export type StreakTrackerPoint = {
  postId: string;
  settledAtMs: number;
  isWin: boolean;
  /** 表示ウィンドウ内のみで再計算した連勝（正）／連敗（負） */
  streakAfter: number;
};

function settledAtToMs(v: unknown): number | null {
  if (v == null) return null;
  if (typeof v === "object" && v !== null && "toMillis" in v) {
    const m = (v as { toMillis: () => number }).toMillis();
    return Number.isFinite(m) ? m : null;
  }
  return null;
}

/**
 * 確定済み投稿を settledAt 降順で最大 STREAK_TRACKER_LAST_N 件取得し、古い順に並べ替えて
 * ウィンドウ内ローカルの連勝／連敗（符号付き）を各投稿直後に付与する。
 */
export function useProfileStreakTracker(uid: string | null | undefined) {
  const [points, setPoints] = useState<StreakTrackerPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      setPoints([]);
      setLoading(false);
      return;
    }

    let alive = true;

    async function run() {
      setLoading(true);
      try {
        const q = query(
          collection(db, "posts"),
          where("authorUid", "==", uid),
          where("schemaVersion", "==", 2),
          orderBy("settledAt", "desc"),
          limit(STREAK_TRACKER_LAST_N)
        );
        const snap = await getDocs(q);

        type Row = {
          postId: string;
          settledAtMs: number;
          isWin: boolean;
        };

        const rows: Row[] = [];
        for (const d of snap.docs) {
          const data = d.data() as Record<string, unknown>;
          const ms = settledAtToMs(data.settledAt);
          if (ms == null) continue;

          const stats = data.stats as Record<string, unknown> | undefined;
          const iw = stats?.isWin;
          if (typeof iw !== "boolean") continue;

          rows.push({ postId: d.id, settledAtMs: ms, isWin: iw });
        }

        rows.sort((a, b) => a.settledAtMs - b.settledAtMs);

        let streak = 0;
        const out: StreakTrackerPoint[] = [];
        for (const r of rows) {
          if (r.isWin) {
            streak = streak > 0 ? streak + 1 : 1;
          } else {
            streak = streak < 0 ? streak - 1 : -1;
          }
          out.push({
            postId: r.postId,
            settledAtMs: r.settledAtMs,
            isWin: r.isWin,
            streakAfter: streak,
          });
        }

        if (alive) setPoints(out);
      } catch (e) {
        console.error("[useProfileStreakTracker]", e);
        if (alive) setPoints([]);
      } finally {
        if (alive) setLoading(false);
      }
    }

    void run();
    return () => {
      alive = false;
    };
  }, [uid]);

  return { points, loading };
}
