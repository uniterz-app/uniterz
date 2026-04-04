"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  fetchTrendHitPostsToday,
  type TrendHitPost,
} from "@/lib/trend";

/** 本日の的中投稿キャッシュ（trend_cache/hit_posts_today）の一覧 */
export default function TrendHitPostsSection() {
  const pathname = usePathname();
  const basePath: "/web" | "/mobile" =
    pathname?.startsWith("/mobile") ? "/mobile" : "/web";

  const [posts, setPosts] = useState<TrendHitPost[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const cache = await fetchTrendHitPostsToday();
        if (!mounted) return;
        setPosts(cache?.posts ?? []);
      } catch (e: unknown) {
        if (mounted) {
          setErr(e instanceof Error ? e.message : "読み込みに失敗しました");
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  if (err) {
    return <p className="text-sm text-red-400">{err}</p>;
  }

  if (posts === null) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-16 animate-pulse rounded-xl bg-white/5"
          />
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <p className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/60">
        本日の的中投稿はまだありません。
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {posts.map((p) => {
        const profileHref = p.authorHandle
          ? `${basePath}/u/${encodeURIComponent(p.authorHandle)}`
          : `${basePath}/u/guest`;
        const gameHref = `${basePath}/games/${encodeURIComponent(p.gameId)}/predictions`;
        const errVal = p.stats?.scoreError;
        const errLabel =
          typeof errVal === "number" ? `誤差 ${errVal.toFixed(1)}` : null;

        return (
          <li
            key={p.id}
            className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3"
          >
            <Link
              href={profileHref}
              className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-white/15 bg-black"
            >
              {p.author?.avatarUrl ? (
                <Image
                  src={p.author.avatarUrl}
                  alt=""
                  fill
                  sizes="40px"
                  className="object-cover"
                />
              ) : (
                <span className="grid h-full w-full place-items-center text-xs text-white/50">
                  {(p.author?.name ?? "?").charAt(0)}
                </span>
              )}
            </Link>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-white">
                {p.author?.name ?? "ユーザー"}
              </div>
              <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-white/55">
                {errLabel ? <span>{errLabel}</span> : null}
                <Link href={gameHref} className="text-cyan-300 hover:underline">
                  試合を見る
                </Link>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
