import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { WC_BRACKET_RESCORE_TASKS } from "./wcBracketRescoreChunked";

/**
 * ユーザー WC ブラケット survivor 再採点 — 廃止（2026-07）。
 * キューに残ったタスクは削除するだけ（読み取りなし）。
 */
export const onWcBracketRescoreTaskCreated = onDocumentCreated(
  {
    document: `${WC_BRACKET_RESCORE_TASKS}/{taskId}`,
    region: "asia-northeast1",
  },
  async (event) => {
    const snap = event.data;
    if (!snap) return;
    console.log(
      `[onWcBracketRescoreTaskCreated] discarded legacy task ${snap.id} (bracket rescore disabled)`
    );
    await snap.ref.delete().catch(() => {});
  }
);
