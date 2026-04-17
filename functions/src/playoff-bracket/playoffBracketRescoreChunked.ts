// Chunked playoff bracket rescoring: avoid loading all playoffBrackets in one function run.

import { FieldPath, FieldValue } from "firebase-admin/firestore";
import type { Firestore } from "firebase-admin/firestore";
import { scorePlayoffBracket, type Bracket } from "./scorePlayoffBracket";

/** Bracket docs processed per task (tune for timeout / memory). */
export const PLAYOFF_BRACKET_RESCORE_PAGE_SIZE = 250;

const BATCH_COMMIT_MAX = 400;

export const PLAYOFF_BRACKET_RESCORE_TASKS = "playoffBracketRescoreTasks";

export async function enqueuePlayoffBracketRescoreChain(
  db: Firestore,
  season: string
): Promise<void> {
  const s = season.trim();
  if (!s) return;
  await db.collection(PLAYOFF_BRACKET_RESCORE_TASKS).add({
    season: s,
    startAfterDocId: null,
    enqueuedAt: FieldValue.serverTimestamp(),
  });
}

type ChunkResult = {
  processed: number;
  /** Last processed doc id when another page may exist; null when chain is done. */
  nextStartAfterDocId: string | null;
};

/**
 * Score one page of playoffBrackets. Always reads fresh playoffResults/{season}.
 */
export async function processPlayoffBracketRescorePage(
  db: Firestore,
  season: string,
  startAfterDocId: string | null
): Promise<ChunkResult> {
  const s = season.trim();
  if (!s) return { processed: 0, nextStartAfterDocId: null };

  const resultsSnap = await db.collection("playoffResults").doc(s).get();
  if (!resultsSnap.exists) {
    return { processed: 0, nextStartAfterDocId: null };
  }

  const results = (resultsSnap.data()?.results ?? {}) as Bracket;

  let q = db
    .collection("playoffBrackets")
    .where("season", "==", s)
    .orderBy(FieldPath.documentId())
    .limit(PLAYOFF_BRACKET_RESCORE_PAGE_SIZE);

  if (startAfterDocId) {
    const cursorSnap = await db
      .collection("playoffBrackets")
      .doc(startAfterDocId)
      .get();
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
    const prediction = (data.bracket ?? {}) as Bracket;
    const scored = scorePlayoffBracket(prediction, results);

    batch.set(
      bracketDoc.ref,
      {
        totalScore: scored.totalScore,
        winnerPoints: scored.winnerPoints,
        gamesPoints: scored.gamesPoints,
        alive: scored.alive,
        firstMissSeriesId: scored.firstMissSeriesId,
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
  const fullPage = bracketsSnap.size >= PLAYOFF_BRACKET_RESCORE_PAGE_SIZE;

  return {
    processed: bracketsSnap.size,
    nextStartAfterDocId: fullPage ? lastDoc.id : null,
  };
}
