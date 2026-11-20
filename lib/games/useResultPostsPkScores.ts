"use client";

import { useEffect, useMemo, useState } from "react";
import { db } from "@/lib/firebase";
import { fetchGamePkScores } from "@/lib/games/fetchGamePkScores";
import {
  resolvePkScoreFromResultPost,
  type PkScore,
} from "@/lib/games/pkScore";

type PostLike = {
  gameId?: string | null;
  league?: unknown;
  result?: { home?: unknown; away?: unknown } | null;
};

/** PK 戦が無い競技。games doc を丸ごと読みに行かない */
const NO_PK_LEAGUES = new Set(["nba", "bj"]);

/** 投稿に pkScore が無い確定試合向けに games から補完 */
export function useResultPostsPkScores(
  posts: readonly PostLike[]
): Record<string, PkScore> {
  const missingGameIds = useMemo(() => {
    const ids = new Set<string>();
    for (const post of posts) {
      const gameId =
        typeof post.gameId === "string" && post.gameId.trim()
          ? post.gameId.trim()
          : "";
      if (!gameId) continue;
      if (typeof post.league === "string" && NO_PK_LEAGUES.has(post.league)) continue;
      const hasFinal =
        typeof post.result?.home === "number" &&
        typeof post.result?.away === "number";
      if (!hasFinal) continue;
      if (resolvePkScoreFromResultPost(post as Record<string, unknown>)) continue;
      ids.add(gameId);
    }
    return [...ids];
  }, [posts]);

  const missingKey = missingGameIds.join("|");
  const [fromGames, setFromGames] = useState<Record<string, PkScore>>({});

  useEffect(() => {
    if (missingGameIds.length === 0) return;
    let alive = true;
    void fetchGamePkScores(db, missingGameIds).then((map) => {
      if (!alive) return;
      setFromGames((prev) => ({ ...prev, ...map }));
    });
    return () => {
      alive = false;
    };
  }, [missingKey]);

  return fromGames;
}

export function resolveResultPostPkScore(
  post: PostLike,
  fromGames: Record<string, PkScore>
): PkScore | null {
  return (
    resolvePkScoreFromResultPost(post as Record<string, unknown>) ??
    (post.gameId ? fromGames[post.gameId] ?? null : null)
  );
}
