/**
 * プロフィール Result Drop。posts は Admin `.select()` API。
 */
import type { ProfileStatsStreakContext } from "../../../../../lib/profile/profileStreakScope";
import type { PostWithMillis } from "../results/nativeResultModel";
import { fetchSettledTodayPostsNative } from "../../lib/myPostsApiNative";

export async function loadProfileSettledTodayResultPostsNative(
  uid: string,
  ctx: ProfileStatsStreakContext,
  slateDateKey: string
): Promise<PostWithMillis[]> {
  const safeUid = uid.trim();
  if (!safeUid) return [];
  const wcStage = typeof ctx.wcStage === "string" ? ctx.wcStage : undefined;
  return fetchSettledTodayPostsNative({
    slate: slateDateKey,
    wcStage,
  }) as Promise<PostWithMillis[]>;
}
