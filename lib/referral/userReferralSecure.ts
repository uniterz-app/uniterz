/**
 * users/{uid}/secure/referral — 公開ルートから外す招待コード・（将来）紹介メタ。
 * クライアントは本人 read のみ。書き込みは Admin SDK。
 */
import { FieldValue, type Firestore } from "firebase-admin/firestore";

export const USER_REFERRAL_SECURE_DOC = "referral";

export function userReferralSecureRef(db: Firestore, uid: string) {
  return db
    .collection("users")
    .doc(uid)
    .collection("secure")
    .doc(USER_REFERRAL_SECURE_DOC);
}

export async function readUserInviteCodeSecure(
  db: Firestore,
  uid: string
): Promise<string | null> {
  const snap = await userReferralSecureRef(db, uid).get();
  const code = String(snap.data()?.inviteCode ?? "").trim();
  return code || null;
}

export async function writeUserInviteCodeSecure(
  db: Firestore,
  uid: string,
  inviteCode: string
): Promise<void> {
  const code = String(inviteCode ?? "").trim();
  if (!code) return;
  await userReferralSecureRef(db, uid).set(
    {
      inviteCode: code,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
  // ルートにあった公開ルートのコードは消す
  await db.collection("users").doc(uid).set(
    {
      inviteCode: FieldValue.delete(),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
}
