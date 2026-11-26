import type { DocumentReference, Firestore } from "firebase-admin/firestore";
import { FieldValue } from "firebase-admin/firestore";

/**
 * onGameFinalV2 の起動口。`games/{id}` のライブ書き込みでは起こさない。
 * 確定する 1 回（と手動 retrigger）だけここへ書く。
 */
export const GAME_FINAL_TRIGGER_COLLECTION = "gameFinalTriggers";

export function gameFinalTriggerRef(
  db: Firestore,
  gameId: string
): DocumentReference {
  return db.collection(GAME_FINAL_TRIGGER_COLLECTION).doc(gameId);
}

export function gameFinalTriggerPayload(gameId: string): Record<string, unknown> {
  return {
    gameId,
    queuedAt: FieldValue.serverTimestamp(),
  };
}

export async function writeGameFinalTrigger(
  db: Firestore,
  gameId: string
): Promise<void> {
  await gameFinalTriggerRef(db, gameId).set(gameFinalTriggerPayload(gameId), {
    merge: true,
  });
}
