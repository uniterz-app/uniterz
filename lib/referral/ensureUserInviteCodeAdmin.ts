/**
 * Admin: users.inviteCode を確保（一意マップ inviteCodes/{code}）
 */
import { FieldValue, type Firestore } from "firebase-admin/firestore";
import {
  generateReferralInviteCode,
  normalizeReferralInviteCode,
} from "./referralInviteCode";

const CODES = "inviteCodes";

export async function ensureUserInviteCodeAdmin(
  db: Firestore,
  uid: string
): Promise<string> {
  const userRef = db.collection("users").doc(uid);
  const snap = await userRef.get();
  const existing = normalizeReferralInviteCode(
    String(snap.data()?.inviteCode ?? "")
  );
  if (existing) {
    // 旧データ互換: マップが無ければ埋める（衝突時はユーザーのコードを優先しないでマップを正とする）
    const mapRef = db.collection(CODES).doc(existing);
    const mapSnap = await mapRef.get();
    if (!mapSnap.exists) {
      await mapRef.set(
        { uid, createdAt: FieldValue.serverTimestamp() },
        { merge: true }
      );
    }
    return existing;
  }

  for (let i = 0; i < 8; i++) {
    const code = generateReferralInviteCode();
    const mapRef = db.collection(CODES).doc(code);
    try {
      const created = await db.runTransaction(async (tx) => {
        const mapSnap = await tx.get(mapRef);
        if (mapSnap.exists) return null;
        const userSnap = await tx.get(userRef);
        const again = normalizeReferralInviteCode(
          String(userSnap.data()?.inviteCode ?? "")
        );
        if (again) return again;
        tx.set(mapRef, {
          uid,
          createdAt: FieldValue.serverTimestamp(),
        });
        tx.set(
          userRef,
          { inviteCode: code, updatedAt: FieldValue.serverTimestamp() },
          { merge: true }
        );
        return code;
      });
      if (created) return created;
    } catch {
      /* retry */
    }
  }

  throw new Error("failed to allocate inviteCode");
}

/** コード → 紹介者 uid（マップ優先、旧 users.inviteCode へフォールバック） */
export async function findUidByInviteCodeAdmin(
  db: Firestore,
  inviteCodeRaw: string
): Promise<string | null> {
  const code = normalizeReferralInviteCode(inviteCodeRaw);
  if (!code) return null;

  const mapSnap = await db.collection(CODES).doc(code).get();
  if (mapSnap.exists) {
    const uid = String(mapSnap.data()?.uid ?? "").trim();
    return uid || null;
  }

  const snap = await db
    .collection("users")
    .where("inviteCode", "==", code)
    .limit(1)
    .get();
  if (snap.empty) return null;
  const uid = snap.docs[0]?.id ?? null;
  if (uid) {
    await db
      .collection(CODES)
      .doc(code)
      .set({ uid, createdAt: FieldValue.serverTimestamp() }, { merge: true });
  }
  return uid;
}
