import { onDocumentWritten } from "firebase-functions/v2/firestore";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { aggregateUsersTrend } from "./users.aggregate";

export const rebuildUsersTrend = onDocumentWritten(
  {
    document: "trend_jobs/users",
    region: "asia-northeast1",
  },
  async (event) => {
    const db = getFirestore(); // ★ ここで取得

    const afterSnap = event.data?.after;
    if (!afterSnap) return;

    const after = afterSnap.data();
    if (!after?.needsRebuild) return;

    try {
      const cacheRef = db.doc("trend_cache/users");
      const cacheSnap = await cacheRef.get();

      const lastUpdated =
        cacheSnap.exists && cacheSnap.get("updatedAt")
          ? cacheSnap.get("updatedAt").toMillis()
          : 0;

      if (Date.now() - lastUpdated < 60_000) {
        await afterSnap.ref.set(
          {
            needsRebuild: false,
            skippedAt: Timestamp.now(),
          },
          { merge: true }
        );
        return;
      }

      await aggregateUsersTrend();

      await afterSnap.ref.set(
        {
          needsRebuild: false,
          rebuiltAt: Timestamp.now(),
          lastGameId: after.gameId ?? null,
        },
        { merge: true }
      );
    } catch (err) {
      console.error("[rebuildUsersTrend] failed:", err);

      await afterSnap.ref.set(
        {
          error: String(err),
          erroredAt: Timestamp.now(),
        },
        { merge: true }
      );
    }
  }
);
