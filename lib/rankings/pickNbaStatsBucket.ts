/**
 * プロフィール NBA スタッツ用バケット選択。
 * 明示 scope（season / playoffs）・デフォルトスライスとも現行シーズンキーのみ。
 */
import {
  CURRENT_NBA_SEASON_KEY,
} from "@/lib/rankings/nbaSeason";

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
 * 現行シーズンキーのみ（前シーズンへ落として 25-26 を見せない）。
 */
export function pickNbaCumulativeRankingSlice(
  cumulative: Record<string, unknown> | null | undefined
): Record<string, unknown> {
  if (!cumulative) return {};
  const bySeason = (cumulative.rankingBySeason ?? {}) as Record<
    string,
    unknown
  >;
  return asBucket(bySeason[CURRENT_NBA_SEASON_KEY]) ?? {};
}

/**
 * user_stats_v2_daily から NBA 日次バケットを選ぶ。
 * 現行シーズンキーのみ。
 */
export function pickNbaDailyIncBucket(
  daily: Record<string, unknown> | null | undefined
): Record<string, unknown> {
  if (!daily) return {};
  const bySeason = (daily.rankingBySeason ?? {}) as Record<string, unknown>;
  return asBucket(bySeason[CURRENT_NBA_SEASON_KEY]) ?? {};
}
