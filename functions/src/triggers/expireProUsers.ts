import { onSchedule } from "firebase-functions/v2/scheduler";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { admin } from "../firebase";

const db = admin.firestore();

/**
 * Pro期限切れユーザーを Free に戻す Cron
 * - 毎日 03:00 JST
 */
export const expireProUsers = onSchedule(
  {
    schedule: "every day 03:00",
    timeZone: "Asia/Tokyo",
  },
  async () => {
    const now = Timestamp.now();

    const snap = await db
      .collection("users")
      .where("plan", "==", "pro")
      .where("cancelAtPeriodEnd", "==", true)
      .where("proUntil", "<=", now)
      .get();

    if (snap.empty) return;

    const batch = db.batch();

    snap.docs.forEach(doc => {
      batch.update(doc.ref, {
        plan: "free",
        planType: null,
        proUntil: null,
        cancelAtPeriodEnd: false,
        updatedAt: FieldValue.serverTimestamp(),
      });
    });

    await batch.commit();
  }
);
