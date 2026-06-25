import { FieldPath, FieldValue } from "firebase-admin/firestore";
import type { Firestore } from "firebase-admin/firestore";
import {
  scoreWcBracketSurvival,
  wcSurvivalRankKey,
  type WcBracketState,
  type WcOfficialWinners,
} from "./scoreWcBracketSurvival";

export const WC_BRACKET_RESCORE_PAGE_SIZE = 250;
export const WC_BRACKET_RESCORE_TASKS = "wcBracketRescoreTasks";
const BATCH_COMMIT_MAX = 400;

export async function enqueueWcBracketRescoreChain(
  db: Firestore,
  season: string
): Promise<void> {
  const s = season.trim();
  if (!s) return;
  await db.collection(WC_BRACKET_RESCORE_TASKS).add({
    season: s,
    startAfterDocId: null,
    enqueuedAt: FieldValue.serverTimestamp(),
  });
}

type ChunkResult = {
  processed: number;
  nextStartAfterDocId: string | null;
};

export async function processWcBracketRescorePage(
  db: Firestore,
  season: string,
  startAfterDocId: string | null
): Promise<ChunkResult> {
  const s = season.trim();
  if (!s) return { processed: 0, nextStartAfterDocId: null };

  const resultsSnap = await db.collection("wcBracketResults").doc(s).get();
  if (!resultsSnap.exists) {
    return { processed: 0, nextStartAfterDocId: null };
  }

  const officialWinners = (resultsSnap.data()?.winners ?? {}) as WcOfficialWinners;

  let q = db
    .collection("wcBrackets")
    .where("season", "==", s)
    .where("isSubmitted", "==", true)
    .orderBy(FieldPath.documentId())
    .limit(WC_BRACKET_RESCORE_PAGE_SIZE);

  if (startAfterDocId) {
    const cursorSnap = await db.collection("wcBrackets").doc(startAfterDocId).get();
    if (cursorSnap.exists) {
      q = q.startAfter(cursorSnap);
    }
  }

  const bracketsSnap = await q.get();
  if (bracketsSnap.empty) {
    return { processed: 0, nextStartAfterDocId: null };
  }

  let batch = db.batch();
  let opCount = 0;

  for (const bracketDoc of bracketsSnap.docs) {
    const data = bracketDoc.data();
    const prediction = (data.bracket ?? {}) as WcBracketState;
    const scored = scoreWcBracketSurvival(prediction, officialWinners);

    batch.set(
      bracketDoc.ref,
      {
        alive: scored.alive,
        firstMissMatchId: scored.firstMissMatchId,
        survivedRounds: scored.survivedRounds,
        hitByMatch: scored.hitByMatch,
        survivalRankKey: wcSurvivalRankKey(scored),
        scoredAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    opCount += 1;
    if (opCount >= BATCH_COMMIT_MAX) {
      await batch.commit();
      batch = db.batch();
      opCount = 0;
    }
  }

  if (opCount > 0) {
    await batch.commit();
  }

  const lastDoc = bracketsSnap.docs[bracketsSnap.docs.length - 1];
  const fullPage = bracketsSnap.size >= WC_BRACKET_RESCORE_PAGE_SIZE;

  return {
    processed: bracketsSnap.size,
    nextStartAfterDocId: fullPage ? lastDoc.id : null,
  };
}
