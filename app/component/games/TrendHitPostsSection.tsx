"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PredictionPostCard from "@/app/component/post/PredictionPostCardV2";
import type { PredictionPostV2 } from "@/types/prediction-post-v2";
import { fetchTrendHitPosts } from "@/lib/trend";
import { usePrefix } from "@/app/PrefixContext";

const LIMIT = 20;

export default function TrendHitPostsSection() {
  const prefix = usePrefix();
  const router = useRouter();
  const [posts, setPosts] = useState<PredictionPostV2[] | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const cached = await fetchTrendHitPosts(LIMIT);
        setPosts(cached);
      } catch (e) {
        console.warn("TrendHitPostsSection: fetch failed", e);
        setPosts([]);
      }
    })();
  }, []);

  if (posts === null) {
    return <div className="mt-8 text-white/70">読み込み中…</div>;
  }

  return (
    <section className="mt-4 space-y-4">
      {posts.length === 0 && (
        <div className="text-white/60 text-sm">
          本日の的中投稿はまだありません。
        </div>
      )}

      <div className="space-y-6">
        {posts.map((post) => (
          <div
  key={post.id}
  onClickCapture={(e) => {
    if (e.defaultPrevented) return; // プロフィールクリック時は何もしない
    router.push(`${prefix}/post/${post.id}`);
  }}
>
            <PredictionPostCard
  post={post}
  profileHref={
    typeof post.author?.handle === "string" &&
    post.author.handle.trim() !== ""
      ? `${prefix}/u/${post.author.handle}`
      : undefined
  }
/>
          </div>
        ))}
      </div>
    </section>
  );
}

