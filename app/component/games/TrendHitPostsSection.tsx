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
import PredictionPostCard from "@/app/component/post/PredictionPostCardV2";
import type { PredictionPostV2 } from "@/types/prediction-post-v2";

const LIMIT = 20;          // ← 上位20件
const MAX_DAYS_BACK = 7;   // ← 最大7日遡る

export default function TrendHitPostsSection() {
  const [posts, setPosts] = useState<PredictionPostV2[] | null>(null);

  useEffect(() => {
    (async () => {
      let finalPosts: PredictionPostV2[] = [];

      // 今日 0:00（基準）
      const base = new Date();
      base.setHours(0, 0, 0, 0);

      for (let i = 1; i <= MAX_DAYS_BACK; i++) {
        const start = new Date(base);
        start.setDate(start.getDate() - i);

        const end = new Date(base);
        end.setDate(end.getDate() - (i - 1));

        // settledAt の範囲 → 1日分
        const q = query(
          collectionGroup(db, "posts"),
          where("settledAt", ">=", Timestamp.fromDate(start)),
          where("settledAt", "<", Timestamp.fromDate(end)),
          orderBy("settledAt", "desc")
        );

        const snap = await getDocs(q);

        // PredictionPostV2 として成形
        const filtered = snap.docs
          .map((d) => {
            const raw = d.data() as any;

const post: PredictionPostV2 = {
  id: d.id,

  // ---- Author ----
  author: {
    name: raw.author?.name ?? raw.authorDisplayName ?? "ユーザー",
    avatarUrl: raw.author?.avatarUrl ?? raw.authorPhotoURL ?? "",
  },
  authorUid: raw.authorUid ?? "",
  authorHandle: raw.authorHandle ?? null,

  createdAtText: raw.createdAtText ?? "",
  startAtMillis: typeof raw.startAtMillis === "number" ? raw.startAtMillis : null,

  // ---- 必須: league / status ----
  league: raw.league ?? raw.game?.league ?? "bj",
  status: raw.status ?? raw.game?.status ?? "final",

  // ---- 必須: home / away (V2仕様に整形) ----
  home: {
    name: raw.home?.name ?? raw.game?.home ?? "",
    teamId: raw.home?.teamId ?? "",
    number: raw.home?.number,
    record: raw.home?.record ?? null,
  },
  away: {
    name: raw.away?.name ?? raw.game?.away ?? "",
    teamId: raw.away?.teamId ?? "",
    number: raw.away?.number,
    record: raw.away?.record ?? null,
  },

  // ---- 旧 game ブロック（互換のため残す）----
  game: raw.game ?? null,

  gameId: raw.gameId ?? "",

  prediction: raw.prediction ?? {
    winner: "home",
    confidence: 50,
    score: { home: 0, away: 0 },
  },

  stats: raw.stats ?? null,
  note: raw.note ?? "",

  likeCount: raw.likeCount ?? 0,
  saveCount: raw.saveCount ?? 0,
};

            return post;
          })
          .filter((p) => {
            // 「的中している投稿」を抽出
            return p.stats?.isWin === true;
          });

        if (filtered.length > 0) {
          // ★ スコア精度（scorePrecision）が高い順
          finalPosts = filtered
            .sort(
              (a, b) =>
                (b.stats?.scorePrecision ?? 0) -
                (a.stats?.scorePrecision ?? 0)
            )
            .slice(0, LIMIT);

          break;
        }
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

