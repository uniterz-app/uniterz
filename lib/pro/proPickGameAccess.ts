/**
 * PRO PICK の「この試合だけ」解除（Free 向け・サーバー判定）。
 *
 * - 初回: 新ビルド以降、Free の最初の PRO PICK は広告なしで解除（アカウントで 1 回だけ。`proPickLaunchFreeUsedAt` で判定）
 * - 2 試合目以降: 試合ごとに広告 1 本で、その試合だけ解除
 * - 広告の検証はまだ無い（SDK 導入前）。`PRO_PICK_AD_MOCK=1` のときだけモックで解除できる。
 *   本番で広告を入れるときは、SDK のサーバー検証（SSV）の結果だけで解除する形に差し替える。
 *
 * 解除の有無は API の応答で出し分けるだけで、クライアントの判定は信用しない。
 */
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebaseAdmin";

type AdminDb = ReturnType<typeof getAdminDb>;

export const PRO_PICK_UNLOCK_COLLECTION = "proPickGameUnlocks";
/** AdMob の SSV で検証済みのリワード（サーバーだけが書く。1 件 = 1 回分） */
export const PRO_PICK_AD_REWARDS_COLLECTION = "proPickAdRewards";
/**
 * users/{uid} に入れる「新ビルド以降の初回の無料解除を使った」時刻。
 * 旧フィールド（proPickFirstFreeUsedAt）は見ない。新ビルドで初めて PRO PICK を開く Free が 1 回だけ無料。
 */
export const PRO_PICK_LAUNCH_FREE_FIELD = "proPickLaunchFreeUsedAt";

export type ProPickUnlockVia = "first_free" | "ad_sdk" | "ad_mock";

export function proPickUnlockDocId(uid: string, gameId: string): string {
  return `${uid}_${gameId}`;
}

export function isProPickAdMockEnabled(): boolean {
  return process.env.PRO_PICK_AD_MOCK === "1";
}

export async function hasProPickGameUnlock(
  db: AdminDb,
  uid: string,
  gameId: string
): Promise<boolean> {
  const snap = await db
    .collection(PRO_PICK_UNLOCK_COLLECTION)
    .doc(proPickUnlockDocId(uid, gameId))
    .get();
  return snap.exists;
}

/** 新ビルド以降の初回の無料解除がまだ使えるか（まだ使っていない） */
export async function proPickFirstFreeAvailable(
  db: AdminDb,
  uid: string
): Promise<boolean> {
  const [userSnap] = await db.getAll(db.doc(`users/${uid}`), {
    fieldMask: [PRO_PICK_LAUNCH_FREE_FIELD],
  });
  return !(userSnap.exists && userSnap.get(PRO_PICK_LAUNCH_FREE_FIELD));
}

/**
 * 初回の無料解除を 1 回だけ付与する（トランザクションで二重付与を防ぐ）。
 * 既に使っていたら false。
 */
export async function tryGrantProPickFirstFree(
  db: AdminDb,
  uid: string,
  gameId: string
): Promise<boolean> {
  const userRef = db.doc(`users/${uid}`);
  const unlockRef = db
    .collection(PRO_PICK_UNLOCK_COLLECTION)
    .doc(proPickUnlockDocId(uid, gameId));
  return db.runTransaction(async (tx) => {
    const userSnap = await tx.get(userRef);
    if (userSnap.exists && userSnap.get(PRO_PICK_LAUNCH_FREE_FIELD)) return false;
    tx.set(
      unlockRef,
      { uid, gameId, via: "first_free" satisfies ProPickUnlockVia, createdAt: FieldValue.serverTimestamp() },
      { merge: true }
    );
    tx.set(
      userRef,
      { [PRO_PICK_LAUNCH_FREE_FIELD]: FieldValue.serverTimestamp() },
      { merge: true }
    );
    return true;
  });
}

/**
 * SSV で検証済みのリワードが 1 件あれば消費して、この試合を解除する。
 * 二重に使わないよう、トランザクションで `claimed` を立てる。
 */
export async function claimProPickAdReward(
  db: AdminDb,
  uid: string,
  gameId: string
): Promise<boolean> {
  const q = await db
    .collection(PRO_PICK_AD_REWARDS_COLLECTION)
    .where("uid", "==", uid)
    .where("gameId", "==", gameId)
    .where("claimed", "==", false)
    .limit(1)
    .get();
  if (q.empty) return false;
  const rewardRef = q.docs[0]!.ref;
  const unlockRef = db
    .collection(PRO_PICK_UNLOCK_COLLECTION)
    .doc(proPickUnlockDocId(uid, gameId));
  return db.runTransaction(async (tx) => {
    const snap = await tx.get(rewardRef);
    if (!snap.exists || snap.get("claimed") === true) return false;
    tx.update(rewardRef, { claimed: true, claimedAt: FieldValue.serverTimestamp() });
    tx.set(
      unlockRef,
      { uid, gameId, via: "ad_sdk" satisfies ProPickUnlockVia, createdAt: FieldValue.serverTimestamp() },
      { merge: true }
    );
    return true;
  });
}

/** 広告（モック）で、この試合だけ解除する */
export async function grantProPickAdUnlock(
  db: AdminDb,
  uid: string,
  gameId: string
): Promise<void> {
  await db
    .collection(PRO_PICK_UNLOCK_COLLECTION)
    .doc(proPickUnlockDocId(uid, gameId))
    .set(
      { uid, gameId, via: "ad_mock" satisfies ProPickUnlockVia, createdAt: FieldValue.serverTimestamp() },
      { merge: true }
    );
}
