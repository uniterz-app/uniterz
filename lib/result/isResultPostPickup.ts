/**
 * リザルト投稿がピックアップ試合かどうか。
 * 正: post.isPickup / post.pickupWeekKey（作成・finalize 埋め込み）
 * 互換: stats.countedForPickup（settle 済みランキング加算）
 * フォールバック: games 断片（一覧キャッシュ / 詳細）
 */
import { isNbaPickupGame } from "@/lib/nba/isPickupGame";

type PickupLike = {
  isPickup?: unknown;
  pickupWeekKey?: unknown;
  stats?: { countedForPickup?: unknown } | null;
};

export function isResultPostPickup(
  post: PickupLike | Record<string, unknown> | null | undefined,
  game?: PickupLike | Record<string, unknown> | null
): boolean {
  if (post && typeof post === "object") {
    if (isNbaPickupGame(post as PickupLike)) return true;
    const stats = (post as PickupLike).stats;
    if (
      stats &&
      typeof stats === "object" &&
      (stats as { countedForPickup?: unknown }).countedForPickup === true
    ) {
      return true;
    }
  }
  return isNbaPickupGame((game as PickupLike | null | undefined) ?? null);
}
