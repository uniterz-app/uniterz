/**
 * UID 単位・1 日あたりのレート制限。
 *
 * 実装は `lib/security/rateLimit.ts` に統合済み（窓幅を選べる汎用版）。
 * ここは既存呼び出し（予想投稿など）のための薄いラッパー。
 */
import type { Firestore } from "firebase-admin/firestore";
import { consumeRateLimit, DAY_MS } from "./rateLimit";

export type UidActionRateLimitResult =
  | { ok: true }
  | { ok: false; error: "rate_limited" };

/**
 * @param actionKey 例: `posts_v2`
 * @param limitPerDay 1 日あたり上限
 */
export async function consumeUidActionRateLimit(
  db: Firestore,
  uid: string,
  actionKey: string,
  limitPerDay: number
): Promise<UidActionRateLimitResult> {
  const verdict = await consumeRateLimit(
    db,
    { scope: actionKey, limit: limitPerDay, windowMs: DAY_MS },
    uid
  );
  return verdict.allowed ? { ok: true } : { ok: false, error: "rate_limited" };
}
