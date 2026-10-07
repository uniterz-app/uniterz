import { onSchedule } from "firebase-functions/v2/scheduler";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { db } from "../firebase";

/** 自動更新の webhook 遅延で一瞬 Free に落とさないための猶予 */
const RENEWAL_GRACE_MS = 3 * 24 * 60 * 60 * 1000;
const BATCH_SIZE = 400;

/**
 * Pro期限切れユーザーを Free に戻す Cron
 * - 毎日 03:00 JST
 * - 解約予約に限らず proUntil + 猶予を過ぎた plan=pro を戻す（更新通知の取りこぼし対策）
 */
export const expireProUsers = onSchedule(
  {
    schedule: "every day 03:00",
    timeZone: "Asia/Tokyo",
  },
  async () => {
    const now = Timestamp.now();
    const cutoff = Timestamp.fromMillis(now.toMillis() - RENEWAL_GRACE_MS);

    const [cancelled, lapsed] = await Promise.all([
      db
        .collection("users")
        .where("plan", "==", "pro")
        .where("cancelAtPeriodEnd", "==", true)
        .where("proUntil", "<=", now)
        .get(),
      db
        .collection("users")
        .where("plan", "==", "pro")
        .where("proUntil", "<=", cutoff)
        .get(),
    ]);
    const docs = [
      ...new Map(
        [...cancelled.docs, ...lapsed.docs].map((d) => [d.id, d])
      ).values(),
    ];
    if (docs.length === 0) return;

    for (let i = 0; i < docs.length; i += BATCH_SIZE) {
      const batch = db.batch();
      for (const doc of docs.slice(i, i + BATCH_SIZE)) {
        batch.update(doc.ref, {
          plan: "free",
          planType: null,
          proUntil: null,
          cancelAtPeriodEnd: false,
          updatedAt: FieldValue.serverTimestamp(),
        });
      }
      await batch.commit();
    }
    console.log(`[expireProUsers] expired=${docs.length}`);
  }
);
