import { useMemo } from "react";
import { resolvePostListLeague } from "../../../../../lib/leagues";
import {
  isWcGoalScorerPickValidForPredictedScore,
  normalizeWcGoalScorerPick,
} from "../../../../../lib/wc/goalScorer";
import { getWcSquadPlayer } from "../../../../../lib/wc/squads";

/** WC 得点者予想用 — PredictionPostV2 相当の最小フィールド */
export type WcGoalScorerPostLike = {
  league?: unknown;
  gameId?: unknown;
  status?: unknown;
  home?: { teamId?: string | null } | null;
  away?: { teamId?: string | null } | null;
  game?: { status?: unknown } | null;
  result?: { home?: number; away?: number } | null;
  prediction?: {
    goalScorer?: unknown;
    score?: { home?: number; away?: number } | null;
  } | null;
  stats?: unknown;
};

export type WcGoalScorerResultInfo = {
  playerName: string;
  teamId: string;
  /** 試合確定前は null（一覧では選手名のみ表示） */
  hit: boolean | null;
};

/** Web `useWcGoalScorerResult` 相当（フック外でも利用可） */
export function resolveWcGoalScorerResultNative(
  post: WcGoalScorerPostLike
): WcGoalScorerResultInfo | null {
  if (resolvePostListLeague(post) !== "wc") return null;

  const pick = normalizeWcGoalScorerPick(post.prediction?.goalScorer);
  if (!pick) return null;

  const score = post.prediction?.score;
  if (
    !score ||
    typeof score.home !== "number" ||
    typeof score.away !== "number" ||
    !isWcGoalScorerPickValidForPredictedScore(
      pick,
      { home: score.home, away: score.away },
      post.home?.teamId,
      post.away?.teamId
    )
  ) {
    return null;
  }

  const playerName =
    getWcSquadPlayer(pick.teamId, pick.playerId)?.name ?? pick.playerId;

  const isFinal =
    post.status === "final" ||
    post.game?.status === "final" ||
    (typeof post.result === "object" &&
      post.result != null &&
      typeof (post.result as { home?: unknown }).home === "number" &&
      typeof (post.result as { away?: unknown }).away === "number");

  if (!isFinal) {
    return { playerName, teamId: pick.teamId, hit: null };
  }

  const stats = post.stats as
    | {
        goalScorerBonus?: number;
        pointsV3Detail?: { goalScorerBonus?: number };
      }
    | null
    | undefined;
  const bonus = Number(
    stats?.goalScorerBonus ?? stats?.pointsV3Detail?.goalScorerBonus ?? 0
  );

  return {
    playerName,
    teamId: pick.teamId,
    hit: Number.isFinite(bonus) && bonus > 1e-6,
  };
}

export function useWcGoalScorerResultNative(
  post: WcGoalScorerPostLike
): WcGoalScorerResultInfo | null {
  return useMemo(() => resolveWcGoalScorerResultNative(post), [post]);
}
