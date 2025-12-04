import { onCall } from "firebase-functions/v2/https";
import { getFirestore } from "firebase-admin/firestore";

export const logUserActive = onCall(async (req) => {
  const uid = req.auth?.uid;
  if (!uid) return { ok: false, error: "unauthenticated" };

  const db = getFirestore();

  const today = new Date();
  const dateKey = today.toISOString().slice(0, 10); // 例: "2025-12-04"

  // /activityLogs/{uid}_{date}
  await db
    .collection("activityLogs")
    .doc(`${uid}_${dateKey}`)
    .set(
      {
        uid,
        date: dateKey,
        lastActiveAt: Date.now(),
      },
      { merge: true }
    );

  return { ok: true };
});
