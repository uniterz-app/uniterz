/**
 * `/api/nba/matchup-insight` の試合共通部分（games doc 由来）を unstable_cache で共有する。
 * 書き込みは nba-pro-brief-ingest のみ → そこで tag を捨てる。Pro 判定はキャッシュしない。
 */
import { revalidateTag } from "next/cache";

export const MATCHUP_INSIGHT_CACHE_TAG = "matchup-insight";
export const MATCHUP_INSIGHT_CACHE_REVALIDATE_SEC = 300;

export function revalidateMatchupInsightCache(): void {
  revalidateTag(MATCHUP_INSIGHT_CACHE_TAG, {});
}
