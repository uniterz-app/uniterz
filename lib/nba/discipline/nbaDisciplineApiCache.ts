/**
 * 規律スナップショット更新後に、規律を含む公開 API のキャッシュを捨てる。
 * Route Handler 内から呼ぶ。
 *
 * - `nba-league-team-stats`: league-team-stats の unstable_cache
 * - `nba-discipline`: league-team/player-stats・team/player-detail の CDN（`Vercel-Cache-Tag`）
 */
import { revalidateTag } from "next/cache";

export const NBA_DISCIPLINE_CDN_TAG = "nba-discipline";

/** 規律を含むレスポンスに付ける（Vercel CDN が読んで剥がす） */
export const NBA_DISCIPLINE_CDN_TAG_HEADER = {
  "Vercel-Cache-Tag": NBA_DISCIPLINE_CDN_TAG,
} as const;

export function revalidateNbaDisciplineApiCache(): void {
  try {
    revalidateTag("nba-league-team-stats", {});
    revalidateTag(NBA_DISCIPLINE_CDN_TAG, "max");
  } catch {
    // スクリプト（Next 外）から呼ばれたときは無視
  }
}
