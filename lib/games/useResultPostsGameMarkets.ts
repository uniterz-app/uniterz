"use client";

import { useEffect, useMemo, useState } from "react";
import { db } from "@/lib/firebase";
import {
  fetchGameMarkets,
  fetchGameRoundMeta,
  type GameMarketRates,
  type GameRoundMeta,
} from "@/lib/games/resultGameEnrichmentCache";
import { formatResultRoundLabel } from "@/lib/result/resultRoundLabel";

type PostLike = {
  gameId?: string | null;
  result?: { home?: unknown; away?: unknown } | null;
  marketMeta?: unknown;
  roundLabel?: unknown;
  playoffRound?: unknown;
  seasonRound?: unknown;
  seasonPhase?: unknown;
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

/** 投稿単体では MATCH / 略称のみになるとき games から補完する */
function postNeedsRoundMeta(post: PostLike): boolean {
  const gameId =
    typeof post.gameId === "string" && post.gameId.trim()
      ? post.gameId.trim()
      : "";
  if (!gameId) return false;
  const label = formatResultRoundLabel({
    roundLabel: post.roundLabel,
    playoffRound: post.playoffRound,
    seasonRound: post.seasonRound,
    seasonPhase: post.seasonPhase,
  });
  if (label === "MATCH") return true;
  // CF だけでは GAME 番号が足りない → roundLabel 未埋め込み
  const hasRoundLabel =
    typeof post.roundLabel === "string" && post.roundLabel.trim().length > 0;
  return !hasRoundLabel;
}

/** 投稿に marketMeta が無いとき games.marketBias / market を補完（判定前も含む） */
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
    if (missingGameIds.length === 0) return;
    let alive = true;
    void fetchGameMarkets(db, missingGameIds).then((map) => {
      if (!alive) return;
      // loadMore で ID が増えても既知分を捨てない
      setFromGames((prev) => ({ ...prev, ...map }));
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

/** 旧投稿の MATCH 落ち向け: games.roundLabel / playoffRound を補完 */
export function useResultPostsGameRoundMeta(
  posts: readonly PostLike[]
): Record<string, GameRoundMeta> {
  const missingGameIds = useMemo(() => {
    const ids = new Set<string>();
    for (const post of posts) {
      if (!postNeedsRoundMeta(post)) continue;
      const gameId = String(post.gameId).trim();
      ids.add(gameId);
    }
    return [...ids];
  }, [posts]);

  const missingKey = missingGameIds.join("|");
  const [fromGames, setFromGames] = useState<Record<string, GameRoundMeta>>(
    {}
  );

  useEffect(() => {
    if (missingGameIds.length === 0) return;
    let alive = true;
    void fetchGameRoundMeta(db, missingGameIds).then((map) => {
      if (!alive) return;
      setFromGames((prev) => ({ ...prev, ...map }));
    });
    return () => {
      alive = false;
    };
  }, [missingKey]);

  return fromGames;
}

export function resolveResultPostGameRoundMeta(
  post: PostLike,
  fromGames: Record<string, GameRoundMeta>
): GameRoundMeta | null {
  const gameId =
    typeof post.gameId === "string" && post.gameId.trim()
      ? post.gameId.trim()
      : "";
  if (!gameId) return null;
  return fromGames[gameId] ?? null;
}

export type { GameRoundMeta };
