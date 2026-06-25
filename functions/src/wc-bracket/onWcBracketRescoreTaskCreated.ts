import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { FieldValue } from "firebase-admin/firestore";
import { db } from "../firebase";
import {
  WC_BRACKET_RESCORE_TASKS,
  processWcBracketRescorePage,
} from "./wcBracketRescoreChunked";

export const onWcBracketRescoreTaskCreated = onDocumentCreated(
  {
    document: `${WC_BRACKET_RESCORE_TASKS}/{taskId}`,
    region: "asia-northeast1",
  },
  async (event) => {
    const snap = event.data;
    if (!snap) return;

    const season = String(snap.get("season") ?? "").trim();
    const startRaw = snap.get("startAfterDocId");
    const startAfterDocId =
      typeof startRaw === "string" && startRaw.trim() ? startRaw.trim() : null;

    if (!season) {
      await snap.ref.delete().catch(() => {});
      return;
    }

    try {
      const { nextStartAfterDocId } = await processWcBracketRescorePage(
        db,
        season,
        startAfterDocId
      );

      if (nextStartAfterDocId) {
        await db.collection(WC_BRACKET_RESCORE_TASKS).add({
          season,
          startAfterDocId: nextStartAfterDocId,
          enqueuedAt: FieldValue.serverTimestamp(),
        });
      }
    } catch (e) {
      console.error(
        `[onWcBracketRescoreTaskCreated] season=${season} startAfter=${startAfterDocId ?? "null"}`,
        e
      );
      return;
    }

    await snap.ref.delete().catch(() => {});
  }
);
