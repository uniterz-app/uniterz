/**
 * プロフィール NBA スタッツ用バケット選択。
 * 現行シーズン（例: 2026-27）が空のオフシーズンは、前シーズン → 旧 playoffs へ落とす。
 */
import {
  CURRENT_NBA_SEASON_KEY,
  previousNbaSeasonKey,
} from "@/lib/rankings/nbaSeason";

function safePosts(bucket: Record<string, unknown> | null | undefined): number {
  if (!bucket || typeof bucket !== "object") return 0;
  const n = Number(bucket.totalPosts ?? bucket.posts ?? 0);
  return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
}

function asBucket(v: unknown): Record<string, unknown> | null {
  if (!v || typeof v !== "object") return null;
  return v as Record<string, unknown>;
}

/**
 * cumulative_stats から NBA 表示用スライスを選ぶ。
 * 優先: 現行シーズン → 前シーズン → rankingByPhase.playoffs → ranking
 */
export function pickNbaCumulativeRankingSlice(
  cumulative: Record<string, unknown> | null | undefined
): Record<string, unknown> {
  if (!cumulative) return {};
  const bySeason = (cumulative.rankingBySeason ?? {}) as Record<
    string,
    unknown
  >;
  const current = asBucket(bySeason[CURRENT_NBA_SEASON_KEY]);
  if (safePosts(current) > 0) return current!;

  const prevKey = previousNbaSeasonKey(CURRENT_NBA_SEASON_KEY);
  const prev = asBucket(bySeason[prevKey]);
  if (safePosts(prev) > 0) return prev!;

  const byPhase = (cumulative.rankingByPhase ?? {}) as Record<string, unknown>;
  const playoffs = asBucket(byPhase.playoffs);
  if (safePosts(playoffs) > 0) return playoffs!;

  const ranking = asBucket(cumulative.ranking);
  if (safePosts(ranking) > 0) return ranking!;

  return current ?? prev ?? playoffs ?? ranking ?? {};
}

/**
 * user_stats_v2_daily から NBA 日次バケットを選ぶ。
 * 優先: 現行シーズン → 前シーズン → rankingByPhase.playoffs → leagues.nba
 */
export function pickNbaDailyIncBucket(
  daily: Record<string, unknown> | null | undefined
): Record<string, unknown> {
  if (!daily) return {};
  const bySeason = (daily.rankingBySeason ?? {}) as Record<string, unknown>;
  const current = asBucket(bySeason[CURRENT_NBA_SEASON_KEY]);
  if (safePosts(current) > 0) return current!;

  const prevKey = previousNbaSeasonKey(CURRENT_NBA_SEASON_KEY);
  const prev = asBucket(bySeason[prevKey]);
  if (safePosts(prev) > 0) return prev!;

  const byPhase = (daily.rankingByPhase ?? {}) as Record<string, unknown>;
  const playoffs = asBucket(byPhase.playoffs);
  if (safePosts(playoffs) > 0) return playoffs!;

  const leagues = (daily.leagues ?? {}) as Record<string, unknown>;
  const nba = asBucket(leagues.nba);
  if (safePosts(nba) > 0) return nba!;

  return current ?? prev ?? playoffs ?? nba ?? {};
}
