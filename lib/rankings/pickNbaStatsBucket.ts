/**
 * プロフィール NBA スタッツ用バケット選択。
 * 明示 scope（season / playoffs）は現行シーズンキーのみ（legacy rankingByPhase 非参照）。
 * フォールバック付きヘルパーは非 scope パス向け。
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

/** 現行シーズンキーのプレーオフ累計（rankingByNbaPlayoffs.<key>）。フォールバックなし */
export function pickNbaPlayoffsCumulativeSlice(
  cumulative: Record<string, unknown> | null | undefined,
  seasonKey: string = CURRENT_NBA_SEASON_KEY
): Record<string, unknown> {
  if (!cumulative) return {};
  const byPlayoffs = (cumulative.rankingByNbaPlayoffs ?? {}) as Record<
    string,
    unknown
  >;
  return asBucket(byPlayoffs[seasonKey]) ?? {};
}

/** 指定シーズンキーのみ（例: 2026-27）。フォールバックなし */
export function pickNbaSeasonKeyCumulativeSlice(
  cumulative: Record<string, unknown> | null | undefined,
  seasonKey: string = CURRENT_NBA_SEASON_KEY
): Record<string, unknown> {
  if (!cumulative) return {};
  const bySeason = (cumulative.rankingBySeason ?? {}) as Record<
    string,
    unknown
  >;
  return asBucket(bySeason[seasonKey]) ?? {};
}

/** 日次: 現行シーズンキーのプレーオフのみ */
export function pickNbaPlayoffsDailyIncBucket(
  daily: Record<string, unknown> | null | undefined,
  seasonKey: string = CURRENT_NBA_SEASON_KEY
): Record<string, unknown> {
  if (!daily) return {};
  const byPlayoffs = (daily.rankingByNbaPlayoffs ?? {}) as Record<
    string,
    unknown
  >;
  return asBucket(byPlayoffs[seasonKey]) ?? {};
}

/** 日次: 指定シーズンキーのみ */
export function pickNbaSeasonKeyDailyIncBucket(
  daily: Record<string, unknown> | null | undefined,
  seasonKey: string = CURRENT_NBA_SEASON_KEY
): Record<string, unknown> {
  if (!daily) return {};
  const bySeason = (daily.rankingBySeason ?? {}) as Record<string, unknown>;
  return asBucket(bySeason[seasonKey]) ?? {};
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
