import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { FieldValue } from "firebase-admin/firestore";
import { db } from "../firebase";
import {
  PLAYOFF_BRACKET_RESCORE_TASKS,
  processPlayoffBracketRescorePage,
} from "./playoffBracketRescoreChunked";

/**
 * One task scores one page; enqueues the next task if more brackets remain.
 */
export const onPlayoffBracketRescoreTaskCreated = onDocumentCreated(
  {
    document: `${PLAYOFF_BRACKET_RESCORE_TASKS}/{taskId}`,
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
      const { nextStartAfterDocId } = await processPlayoffBracketRescorePage(
        db,
        season,
        startAfterDocId
      );

      if (nextStartAfterDocId) {
        await db.collection(PLAYOFF_BRACKET_RESCORE_TASKS).add({
          season,
          startAfterDocId: nextStartAfterDocId,
          enqueuedAt: FieldValue.serverTimestamp(),
        });
      }
    } catch (e) {
      console.error(
        `[onPlayoffBracketRescoreTaskCreated] season=${season} startAfter=${startAfterDocId ?? "null"}`,
        e
      );
      return;
    }

    await snap.ref.delete().catch(() => {});
  }
);
