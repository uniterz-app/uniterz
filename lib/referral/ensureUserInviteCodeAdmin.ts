/**
 * Admin: 招待コードを確保（一意マップ inviteCodes/{code} + secure/referral）。
 * 公開 users ルートには書かない。
 */
import { FieldValue, type Firestore } from "firebase-admin/firestore";
import {
  generateReferralInviteCode,
  normalizeReferralInviteCode,
} from "./referralInviteCode";
import {
  readUserInviteCodeSecure,
  writeUserInviteCodeSecure,
} from "./userReferralSecure";

const CODES = "inviteCodes";

export async function ensureUserInviteCodeAdmin(
  db: Firestore,
  uid: string
): Promise<string> {
  const fromSecure = await readUserInviteCodeSecure(db, uid);
  if (fromSecure) {
    const mapRef = db.collection(CODES).doc(fromSecure);
    const mapSnap = await mapRef.get();
    if (!mapSnap.exists) {
      await mapRef.set(
        { uid, createdAt: FieldValue.serverTimestamp() },
        { merge: true }
      );
    }
    return fromSecure;
  }

  const userRef = db.collection("users").doc(uid);
  const snap = await userRef.get();
  const legacy = normalizeReferralInviteCode(
    String(snap.data()?.inviteCode ?? "")
  );
  if (legacy) {
    await writeUserInviteCodeSecure(db, uid, legacy);
    const mapRef = db.collection(CODES).doc(legacy);
    const mapSnap = await mapRef.get();
    if (!mapSnap.exists) {
      await mapRef.set(
        { uid, createdAt: FieldValue.serverTimestamp() },
        { merge: true }
      );
    }
    return legacy;
  }

  for (let i = 0; i < 8; i++) {
    const code = generateReferralInviteCode();
    const mapRef = db.collection(CODES).doc(code);
    try {
      const created = await db.runTransaction(async (tx) => {
        const mapSnap = await tx.get(mapRef);
        if (mapSnap.exists) return null;
        const secureRef = db
          .collection("users")
          .doc(uid)
          .collection("secure")
          .doc("referral");
        const secureSnap = await tx.get(secureRef);
        const again = normalizeReferralInviteCode(
          String(secureSnap.data()?.inviteCode ?? "")
        );
        if (again) return again;
        tx.set(mapRef, {
          uid,
          createdAt: FieldValue.serverTimestamp(),
        });
        tx.set(
          secureRef,
          { inviteCode: code, updatedAt: FieldValue.serverTimestamp() },
          { merge: true }
        );
        // ルートに残っていたら消す
        tx.set(
          userRef,
          {
            inviteCode: FieldValue.delete(),
            updatedAt: FieldValue.serverTimestamp(),
          },
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
    await writeUserInviteCodeSecure(db, uid, code);
  }
  return uid;
}
