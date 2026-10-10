/**
 * プレシーズン参加ボーナスの付与（Admin SDK）。台帳キーで 1 アカウント 1 回。
 * 開幕前にアプリを開いた / 登録したユーザーへ自動付与（/api/me/preseason-bonus ほか）と、
 * 一括スクリプト（scripts/grant-preseason-participation-units.ts）で共用する。
 */
import { FieldValue, type Firestore } from "firebase-admin/firestore";
import {
  PRESEASON_BONUS_EXCLUDED_UIDS,
  PRESEASON_BONUS_SEASON,
  PRESEASON_BONUS_UNITS,
  PRESEASON_BONUS_WINDOW_END_MS,
  PRESEASON_BONUS_WINDOW_START_MS,
  preseasonBonusIdempotencyKey,
} from "@/lib/units/preseasonBonus";

export type PreseasonBonusEligibility = "signup" | "active" | "auto";

/**
 * 付与したら true。付与済み・表示名なし（初期設定未完了）は false。
 * 期間・除外 UID の判定は呼び出し側（自動付与は isPreseasonBonusAutoGrantOpen）。
 */
export async function grantPreseasonBonus(
  db: Firestore,
  uid: string,
  eligibility: PreseasonBonusEligibility
): Promise<boolean> {
  if (PRESEASON_BONUS_EXCLUDED_UIDS.has(uid)) return false;
  const key = preseasonBonusIdempotencyKey(uid);
  const ledgerRef = db.collection("unit_ledger").doc(key);
  const userRef = db.collection("users").doc(uid);
  const pendingRef = userRef.collection("pending_unit_earns").doc(key);
  return db.runTransaction(async (tx) => {
    const [existing, userSnap] = await Promise.all([
      tx.get(ledgerRef),
      tx.get(userRef),
    ]);
    if (existing.exists) return false;
    const name = userSnap.get("displayName");
    if (!userSnap.exists || typeof name !== "string" || name.trim() === "") {
      return false;
    }
    tx.set(ledgerRef, {
      uid,
      amount: PRESEASON_BONUS_UNITS,
      reason: "preseason_bonus",
      idempotencyKey: key,
      label: PRESEASON_BONUS_SEASON,
      eligibility,
      createdAt: FieldValue.serverTimestamp(),
    });
    tx.set(
      userRef,
      {
        unitBalance: FieldValue.increment(PRESEASON_BONUS_UNITS),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    tx.set(pendingRef, {
      amount: PRESEASON_BONUS_UNITS,
      reason: "preseason_bonus",
      titleJa: "プレシーズン参加ボーナス",
      titleEn: "Preseason bonus",
      subtitleJa: `${PRESEASON_BONUS_SEASON} シーズン · NBA`,
      subtitleEn: `${PRESEASON_BONUS_SEASON} season · NBA`,
      claimedAt: null,
      createdAt: FieldValue.serverTimestamp(),
      createdAtMs: Date.now(),
    });
    return true;
  });
}

export function isPreseasonBonusAutoGrantOpen(nowMs = Date.now()): boolean {
  return (
    nowMs >= PRESEASON_BONUS_WINDOW_START_MS &&
    nowMs < PRESEASON_BONUS_WINDOW_END_MS
  );
}

/** 期間中だけ自動付与。失敗しても呼び出し元の処理は止めない */
export async function autoGrantPreseasonBonus(
  db: Firestore,
  uid: string
): Promise<boolean> {
  if (!isPreseasonBonusAutoGrantOpen()) return false;
  try {
    return await grantPreseasonBonus(db, uid, "auto");
  } catch (e) {
    console.error("autoGrantPreseasonBonus:", e);
    return false;
  }
}
