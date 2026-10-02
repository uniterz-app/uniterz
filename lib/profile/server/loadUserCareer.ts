/**
 * Admin: user_career の読取 / 既存ソースからの ensure 書込。
 */

import type { Firestore } from "firebase-admin/firestore";
import { buildUserCareerFromSources } from "@/lib/profile/buildUserCareerFromSources";
import {
  parseUserCareerDoc,
  USER_CAREER_COLLECTION,
  type UserCareerDoc,
} from "@/lib/profile/userCareer";

export async function loadUserCareerDoc(
  db: Firestore,
  uid: string
): Promise<UserCareerDoc | null> {
  const snap = await db.collection(USER_CAREER_COLLECTION).doc(uid).get();
  if (!snap.exists) return null;
  return parseUserCareerDoc(uid, snap.data());
}

/**
 * 読み取り専用の career 解決。doc が無ければ既存ソースから組み立てて返すが、
 * **書き込まない**。未認証の公開 GET から呼ぶ用。
 */
export async function loadOrBuildUserCareer(
  db: Firestore,
  uid: string
): Promise<UserCareerDoc> {
  const existing = await loadUserCareerDoc(db, uid);
  if (existing) return existing;

  const [cumSnap, userSnap] = await Promise.all([
    db.collection("cumulative_stats").doc(uid).get(),
    db.collection("users").doc(uid).get(),
  ]);

  return buildUserCareerFromSources({
    uid,
    cumulative: cumSnap.exists
      ? (cumSnap.data() as Record<string, unknown>)
      : null,
    user: userSnap.exists ? (userSnap.data() as Record<string, unknown>) : null,
    existing: null,
    source: "ensure",
  });
}

export async function ensureUserCareerDoc(
  db: Firestore,
  uid: string,
  opts?: { forceRebuild?: boolean }
): Promise<UserCareerDoc> {
  const careerRef = db.collection(USER_CAREER_COLLECTION).doc(uid);
  const existingSnap = await careerRef.get();
  const existing = existingSnap.exists
    ? parseUserCareerDoc(uid, existingSnap.data())
    : null;

  if (existing && !opts?.forceRebuild) {
    return existing;
  }

  const [cumSnap, userSnap] = await Promise.all([
    db.collection("cumulative_stats").doc(uid).get(),
    db.collection("users").doc(uid).get(),
  ]);

  const built = buildUserCareerFromSources({
    uid,
    cumulative: cumSnap.exists
      ? (cumSnap.data() as Record<string, unknown>)
      : null,
    user: userSnap.exists ? (userSnap.data() as Record<string, unknown>) : null,
    existing,
    source: existing ? "ensure_rebuild" : "ensure",
  });

  await careerRef.set(built, { merge: true });
  return built;
}
