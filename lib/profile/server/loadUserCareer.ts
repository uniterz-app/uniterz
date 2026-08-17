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
