/**
 * UID 単位の簡易レート制限（Firestore transaction）。
 * お問い合わせと同型。予想投稿など書き込み API 向け。
 */
import type { Firestore } from "firebase-admin/firestore";
import { FieldValue } from "firebase-admin/firestore";

function dateKeyUtc(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export type UidActionRateLimitResult =
  | { ok: true }
  | { ok: false; error: "rate_limited" };

/**
 * @param actionKey 例: `posts_v2`
 * @param limitPerDay UTC 日あたり上限
 */
export async function consumeUidActionRateLimit(
  db: Firestore,
  uid: string,
  actionKey: string,
  limitPerDay: number
): Promise<UidActionRateLimitResult> {
  const dayKey = dateKeyUtc(new Date());
  const rateRef = db
    .collection("users")
    .doc(uid)
    .collection("secure")
    .doc(`rate_${actionKey}_${dayKey}`);

  try {
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(rateRef);
      const count = Math.max(0, Math.floor(Number(snap.data()?.count ?? 0)));
      if (count >= limitPerDay) {
        const err = new Error("rate_limited");
        (err as { code?: string }).code = "rate_limited";
        throw err;
      }
      tx.set(
        rateRef,
        {
          count: count + 1,
          actionKey,
          dayKey,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    });
    return { ok: true };
  } catch (e: unknown) {
    if (
      e instanceof Error &&
      (e.message === "rate_limited" ||
        (e as { code?: string }).code === "rate_limited")
    ) {
      return { ok: false, error: "rate_limited" };
    }
    throw e;
  }
}
