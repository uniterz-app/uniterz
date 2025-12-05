"use client";

import { useEffect, useState } from "react";
import {
  collectionGroup,
  query,
  where,
  orderBy,
  getDocs,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import PredictionPostCard, {
  type PredictionPost,
} from "@/app/component/post/PredictionPostCard";

const LIMIT = 15;
const MAX_DAYS_BACK = 7; // ← 最大7日遡る

export default function TrendHitPostsSection() {
  const [posts, setPosts] = useState<PredictionPost[] | null>(null);

  useEffect(() => {
    (async () => {
      let finalPosts: PredictionPost[] = [];

      // 今日 0:00（基準）
      const base = new Date();
      base.setHours(0, 0, 0, 0);

      for (let i = 1; i <= MAX_DAYS_BACK; i++) {
        const start = new Date(base);
        start.setDate(start.getDate() - i);

        const end = new Date(base);
        end.setDate(end.getDate() - (i - 1));

        // Firestore クエリ（settledAt の範囲だけ）
        const q = query(
          collectionGroup(db, "posts"),
          where("settledAt", ">=", Timestamp.fromDate(start)),
          where("settledAt", "<", Timestamp.fromDate(end)),
          orderBy("settledAt", "desc")
        );

        const snap = await getDocs(q);

        // ヒット投稿をフィルタ
        const filtered = snap.docs
          .map((d) => ({ id: d.id, ...(d.data() as any) } as PredictionPost))
          .filter((p) => {
            if (p.resultUnits == null || p.resultUnits <= 0) return false;
            return Array.isArray(p.legs) && p.legs.some((l) => l.outcome === "hit");
          });

        if (filtered.length > 0) {
          // 見つかったらソート → 上位15件 → 採用して終了
          finalPosts = filtered
            .sort((a, b) => (b.resultUnits ?? 0) - (a.resultUnits ?? 0))
            .slice(0, LIMIT);
          break;
        }

        // 見つからなかったら 次の日へ遡る → ループ続行
      }

      setPosts(finalPosts);
    })();
  }, []);

  if (posts === null) {
    return <div className="mt-8 text-white/70">読み込み中…</div>;
  }

  return (
    <section className="mt-4 space-y-4">
      {posts.length === 0 && (
        <div className="text-white/60 text-sm">
          最近の期間に的中した投稿がありません。
        </div>
      )}

      <div className="space-y-6">
        {posts.map((post) => (
          <PredictionPostCard key={post.id} post={post} />
        ))}
      </div>
    </section>
  );
}

