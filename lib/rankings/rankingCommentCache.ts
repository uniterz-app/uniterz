/**
 * ランキングのひとこと保存後に、ひとことを載せる一覧のキャッシュを捨てる。
 * Route Handler 内から呼ぶ。
 *
 * - `DAILY_SCORE_LEADERS_PLANS_TAG`: TODAY の plan / ひとこと重ね合わせ（unstable_cache）
 * - `ranking-comment`: 累計・期間ランキング bulk の CDN（`Vercel-Cache-Tag`）
 */
import { revalidateTag } from "next/cache";
import { DAILY_SCORE_LEADERS_PLANS_TAG } from "@/lib/rankings/dailyScoreLeaders/dailyScoreLeadersCacheTags";

/** `mergeUserPlanIntoRankingPayload` の users 重ね合わせ（unstable_cache）の tag */
export const RANKING_USER_FIELDS_TAG = "ranking-user-fields";

/** 表示名・アイコン・国・プラン・スキンを保存したあとに呼ぶ。Next の外では何もしない */
export function revalidateRankingUserFields(): void {
  try {
    revalidateTag(RANKING_USER_FIELDS_TAG, { expire: 0 });
  } catch {
    // スクリプトや Next 外からの呼び出しは TTL で入れ替わる
  }
}

export const RANKING_COMMENT_CDN_TAG = "ranking-comment";

/** ひとことを含む公開レスポンスに付ける（Vercel CDN が読んで剥がす） */
export const RANKING_COMMENT_CDN_TAG_HEADER = {
  "Vercel-Cache-Tag": RANKING_COMMENT_CDN_TAG,
} as const;

export function revalidateRankingCommentCaches(): void {
  revalidateTag(DAILY_SCORE_LEADERS_PLANS_TAG, { expire: 0 });
  revalidateTag(RANKING_COMMENT_CDN_TAG, { expire: 0 });
  revalidateRankingUserFields();
}
