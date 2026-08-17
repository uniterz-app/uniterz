"use client";

import { useEffect, useMemo, useState } from "react";
import { db } from "@/lib/firebase";
import { fetchGameMarkets, type GameMarketRates } from "@/lib/games/fetchGameMarkets";

type PostLike = {
  gameId?: string | null;
  result?: { home?: unknown; away?: unknown } | null;
  marketMeta?: unknown;
};

function hasEmbeddedMarketPct(marketMeta: unknown): boolean {
  if (marketMeta === null || typeof marketMeta !== "object") return false;
  const meta = marketMeta as Record<string, unknown>;
  return (
    (typeof meta.homePct === "number" && Number.isFinite(meta.homePct)) ||
    (typeof meta.homeRate === "number" && Number.isFinite(meta.homeRate)) ||
    (typeof meta.awayPct === "number" && Number.isFinite(meta.awayPct)) ||
    (typeof meta.awayRate === "number" && Number.isFinite(meta.awayRate))
  );
}

/** 投稿に marketMeta.homePct が無い確定試合向けに games.market を補完 */
export function useResultPostsGameMarkets(
  posts: readonly PostLike[]
): Record<string, GameMarketRates> {
  const missingGameIds = useMemo(() => {
    const ids = new Set<string>();
    for (const post of posts) {
      const gameId =
        typeof post.gameId === "string" && post.gameId.trim()
          ? post.gameId.trim()
          : "";
      if (!gameId) continue;
      const hasFinal =
        typeof post.result?.home === "number" &&
        typeof post.result?.away === "number";
      if (!hasFinal) continue;
      if (hasEmbeddedMarketPct(post.marketMeta)) continue;
      ids.add(gameId);
    }
    return [...ids];
  }, [posts]);

  const missingKey = missingGameIds.join("|");
  const [fromGames, setFromGames] = useState<Record<string, GameMarketRates>>(
    {}
  );

  useEffect(() => {
    if (missingGameIds.length === 0) {
      setFromGames({});
      return;
    }
    let alive = true;
    void fetchGameMarkets(db, missingGameIds).then((map) => {
      if (alive) setFromGames(map);
    });
    return () => {
      alive = false;
    };
  }, [missingKey]);

  return fromGames;
}

export function resolveResultPostGameMarket(
  post: PostLike,
  fromGames: Record<string, GameMarketRates>
): GameMarketRates | null {
  const gameId =
    typeof post.gameId === "string" && post.gameId.trim()
      ? post.gameId.trim()
      : "";
  if (!gameId) return null;
  return fromGames[gameId] ?? null;
}
