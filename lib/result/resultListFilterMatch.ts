/**
 * Web `ResultListWithOverlay` の一覧フィルター判定（ネイティブ / Web 共通）
 */
import { resolvePostListLeague, type League } from "../leagues";
import { isFinalResultPost, type PostWithMillis } from "./result-page-data";
import { isWcResultLeague } from "./wcResultUi";

export type ResultListFilters = {
  outcome: "all" | "win" | "loss";
  /** 未確定＝試合前〜未確定、確定＝得点確定済み */
  settlement: "all" | "pending" | "final";
  league: "all" | League;
  /** Upset スコア（加点あり） */
  specialty: "none" | "upsetBonus";
  scorePrecisionTier: "all" | "high" | "mid" | "low";
  pointsTier: "all" | "high" | "mid" | "low";
};

export const DEFAULT_RESULT_LIST_FILTERS: ResultListFilters = {
  outcome: "all",
  settlement: "all",
  league: "all",
  specialty: "none",
  scorePrecisionTier: "all",
  pointsTier: "all",
};

export function isDefaultResultListFilters(filters: ResultListFilters): boolean {
  return (
    filters.outcome === DEFAULT_RESULT_LIST_FILTERS.outcome &&
    filters.settlement === DEFAULT_RESULT_LIST_FILTERS.settlement &&
    filters.league === DEFAULT_RESULT_LIST_FILTERS.league &&
    filters.specialty === DEFAULT_RESULT_LIST_FILTERS.specialty &&
    filters.scorePrecisionTier === DEFAULT_RESULT_LIST_FILTERS.scorePrecisionTier &&
    filters.pointsTier === DEFAULT_RESULT_LIST_FILTERS.pointsTier
  );
}

function predictionWinState(post: PostWithMillis): boolean | null {
  const stats = post.stats as Record<string, unknown> | undefined;
  const iw = stats?.isWin;
  if (iw === true) return true;
  if (iw === false) return false;
  const detail = stats?.pointsV3Detail as { winnerCorrect?: boolean } | undefined;
  if (detail?.winnerCorrect === true) return true;
  if (detail?.winnerCorrect === false) return false;
  return null;
}

function pointsV3Of(post: PostWithMillis): number | null {
  const stats = post.stats as Record<string, unknown> | undefined;
  const v =
    stats?.pointsV3 ??
    (stats?.pointsV3Detail as { totalPoints?: number } | undefined)?.totalPoints;
  if (typeof v !== "number" || !Number.isFinite(v)) return null;
  return v;
}

function scorePrecisionOf(post: PostWithMillis): number | null {
  const stats = post.stats as Record<string, unknown> | undefined;
  const v = stats?.scorePrecision;
  if (typeof v !== "number" || !Number.isFinite(v)) return null;
  return v;
}

function postMatchesOutcome(
  post: PostWithMillis,
  outcome: ResultListFilters["outcome"]
): boolean {
  if (outcome === "all") return true;
  if (!isFinalResultPost(post)) return false;
  const w = predictionWinState(post);
  if (outcome === "win") return w === true;
  if (outcome === "loss") return w === false;
  return true;
}

function postMatchesPointsTier(
  post: PostWithMillis,
  tier: ResultListFilters["pointsTier"]
): boolean {
  if (tier === "all") return true;
  if (!isFinalResultPost(post)) return false;
  const v = pointsV3Of(post);
  if (v === null) return false;
  if (tier === "high") return v >= 7;
  if (tier === "mid") return v >= 4 && v < 7;
  if (tier === "low") return v < 4;
  return true;
}

function postMatchesScorePrecisionTier(
  post: PostWithMillis,
  tier: ResultListFilters["scorePrecisionTier"]
): boolean {
  if (tier === "all") return true;
  if (isWcResultLeague(post.league)) return true;
  if (!isFinalResultPost(post)) return false;
  const v = scorePrecisionOf(post);
  if (v === null) return false;
  if (tier === "high") return v >= 7;
  if (tier === "mid") return v >= 4 && v < 7;
  if (tier === "low") return v < 4;
  return true;
}

function postMatchesSpecialty(
  post: PostWithMillis,
  sp: ResultListFilters["specialty"]
): boolean {
  if (sp === "none") return true;
  if (!isFinalResultPost(post)) return false;
  const stats = post.stats as Record<string, unknown> | undefined;
  const pts = stats?.upsetPoints ?? 0;
  const hit = stats?.upsetHit === true;
  return (typeof pts === "number" && pts > 0) || hit;
}

/** 一覧投稿がフィルター条件を満たすか */
export function postMatchesResultListFilters(
  post: PostWithMillis,
  filters: ResultListFilters
): boolean {
  if (filters.settlement === "pending" && isFinalResultPost(post)) return false;
  if (filters.settlement === "final" && !isFinalResultPost(post)) return false;
  if (filters.league !== "all" && resolvePostListLeague(post) !== filters.league) {
    return false;
  }
  if (!postMatchesOutcome(post, filters.outcome)) return false;
  if (!postMatchesPointsTier(post, filters.pointsTier)) return false;
  if (!postMatchesScorePrecisionTier(post, filters.scorePrecisionTier)) return false;
  if (!postMatchesSpecialty(post, filters.specialty)) return false;
  return true;
}
