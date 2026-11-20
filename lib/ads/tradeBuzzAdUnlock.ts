/**
 * トレード Buzz の「広告を見て開く」解除（1 日 1 回・日本時間 0 時で切り替わる）。
 *
 * - 広告の報酬は AdMob の SSV（`/api/ads/admob-ssv`）が署名つきで届いたときだけ記録する
 * - 解除の判定は `GET /api/nba/trade-buzz-unlock`（サーバーだけが見る）
 * - 同じ transaction_id は 1 回だけ数える（再送に強くする）
 */
import type { Firestore } from "firebase-admin/firestore";
import { FieldValue } from "firebase-admin/firestore";
import { getTodayKeyInTimeZone, TIMEZONE_JST } from "@/lib/time/zonedTime";

export const TRADE_BUZZ_AD_REWARDS_COLLECTION = "tradeBuzzAdRewards";
export const TRADE_BUZZ_UNLOCKS_COLLECTION = "tradeBuzzUnlocks";

/** 解除の単位となる日付（日本時間の YYYY-MM-DD） */
export function tradeBuzzDayKey(now: Date = new Date()): string {
  return getTodayKeyInTimeZone(TIMEZONE_JST, now);
}

export function tradeBuzzUnlockDocId(uid: string, dayKey: string): string {
  return `${uid}_${dayKey}`;
}

/** 今日（日本時間）の広告解除があるか */
export async function hasTradeBuzzUnlockToday(
  db: Firestore,
  uid: string,
  now: Date = new Date()
): Promise<boolean> {
  const snap = await db
    .collection(TRADE_BUZZ_UNLOCKS_COLLECTION)
    .doc(tradeBuzzUnlockDocId(uid, tradeBuzzDayKey(now)))
    .get();
  return snap.exists;
}

/**
 * SSV で検証済みの広告報酬を、今日の解除として記録する。
 * 同じ transaction_id が来ても 2 回目以降は何もしない。
 */
export async function grantTradeBuzzUnlockFromAd(
  db: Firestore,
  input: { transactionId: string; uid: string },
  now: Date = new Date()
): Promise<void> {
  const dayKey = tradeBuzzDayKey(now);
  try {
    await db.collection(TRADE_BUZZ_AD_REWARDS_COLLECTION).doc(input.transactionId).create({
      uid: input.uid,
      dayKey,
      createdAt: FieldValue.serverTimestamp(),
    });
  } catch (e) {
    // 既に記録済み（ALREADY_EXISTS = 6）なら成功扱い
    const code = (e as { code?: unknown })?.code;
    if (code === 6 || code === "already-exists") return;
    throw e;
  }
  await db
    .collection(TRADE_BUZZ_UNLOCKS_COLLECTION)
    .doc(tradeBuzzUnlockDocId(input.uid, dayKey))
    .set(
      {
        uid: input.uid,
        dayKey,
        transactionId: input.transactionId,
        createdAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
}
