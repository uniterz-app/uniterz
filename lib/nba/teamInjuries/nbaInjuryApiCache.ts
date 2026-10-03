/**
 * `/api/nba/team-injuries` と `/api/nba/matchup-detail` の unstable_cache 共有 tag。
 * injury / rosters / daily ingest の書き込み後に捨てる（Route Handler 内から呼ぶ）。
 */
import { revalidateTag } from "next/cache";

export const NBA_INJURY_API_CACHE_TAG = "nba-injury-api";
export const NBA_INJURY_API_CACHE_REVALIDATE_SEC = 300;

export function revalidateNbaInjuryApiCache(): void {
  revalidateTag(NBA_INJURY_API_CACHE_TAG, {});
}
