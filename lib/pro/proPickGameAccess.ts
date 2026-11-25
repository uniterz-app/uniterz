/**
 * PRO PICK の「この試合だけ」解除（Free 向け・サーバー判定）。
 *
 * - 初回: 新ビルド以降、Free の最初の PRO PICK は広告なしで解除（アカウントで 1 回だけ。`proPickLaunchFreeUsedAt` で判定）
 * - 2 試合目以降: 試合ごとに広告 1 本で、その試合だけ解除
 * - 本番の広告は AdMob SSV（`/api/ads/admob-ssv`）が先に書けばそれを使う。
 *   SSV が届かない実機でも、SDK が見終わったあとの `adWatched: true` でその試合だけ解除する。
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

export type ProPickUnlockVia = "first_free" | "ad_sdk" | "ad_mock" | "ad_watched";

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
 * SSV で検証済みのリワードを、その試合の解除としてすぐ書く（トレード Buzz と同じ）。
 * 同じ transaction_id は 2 回目以降無視する。
 */
export async function grantProPickUnlockFromAd(
  db: AdminDb,
  input: { transactionId: string; uid: string; gameId: string }
): Promise<void> {
  const gameId = input.gameId.trim();
  try {
    await db.collection(PRO_PICK_AD_REWARDS_COLLECTION).doc(input.transactionId).create({
      uid: input.uid,
      gameId,
      claimed: gameId.length > 0,
      createdAt: FieldValue.serverTimestamp(),
      ...(gameId ? { claimedAt: FieldValue.serverTimestamp() } : {}),
    });
  } catch (e) {
    const code = (e as { code?: unknown })?.code;
    if (code !== 6 && code !== "already-exists") throw e;
    // 報酬は記録済み。解除 doc が欠けていたときのために下の set は続ける
  }
  if (!gameId) return;
  await db
    .collection(PRO_PICK_UNLOCK_COLLECTION)
    .doc(proPickUnlockDocId(input.uid, gameId))
    .set(
      {
        uid: input.uid,
        gameId,
        via: "ad_sdk" satisfies ProPickUnlockVia,
        transactionId: input.transactionId,
        createdAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
}

/**
 * SSV で検証済みのリワードが 1 件あれば消費して、この試合を解除する。
 * 二重に使わないよう、トランザクションで `claimed` を立てる。
 * gameId が空の報酬（custom_data が届かなかったとき）も、この uid の未使用分として使う。
 */
export async function claimProPickAdReward(
  db: AdminDb,
  uid: string,
  gameId: string
): Promise<boolean> {
  const q = await db
    .collection(PRO_PICK_AD_REWARDS_COLLECTION)
    .where("uid", "==", uid)
    .where("claimed", "==", false)
    .limit(8)
    .get();
  const hit = q.docs.find((d) => {
    const g = String(d.get("gameId") ?? "").trim();
    return g === "" || g === gameId;
  });
  if (!hit) return false;
  const rewardRef = hit.ref;
  const unlockRef = db
    .collection(PRO_PICK_UNLOCK_COLLECTION)
    .doc(proPickUnlockDocId(uid, gameId));
  return db.runTransaction(async (tx) => {
    const snap = await tx.get(rewardRef);
    if (!snap.exists || snap.get("claimed") === true) return false;
    tx.update(rewardRef, {
      claimed: true,
      claimedAt: FieldValue.serverTimestamp(),
      gameId,
    });
    tx.set(
      unlockRef,
      { uid, gameId, via: "ad_sdk" satisfies ProPickUnlockVia, createdAt: FieldValue.serverTimestamp() },
      { merge: true }
    );
    return true;
  });
}

/** 広告を見終わったあとの確認で、この試合だけ解除する */
export async function grantProPickAdUnlock(
  db: AdminDb,
  uid: string,
  gameId: string,
  via: Extract<ProPickUnlockVia, "ad_mock" | "ad_watched"> = "ad_watched"
): Promise<void> {
  await db
    .collection(PRO_PICK_UNLOCK_COLLECTION)
    .doc(proPickUnlockDocId(uid, gameId))
    .set(
      { uid, gameId, via, createdAt: FieldValue.serverTimestamp() },
      { merge: true }
    );
}
