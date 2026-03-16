import { onDocumentWritten } from "firebase-functions/v2/firestore";
import { FieldValue } from "firebase-admin/firestore";
import { db } from "../firebase";
import { scorePlayoffBracket, type Bracket } from "./scorePlayoffBracket";

export const onPlayoffResultsWrite = onDocumentWritten(
  {
    document: "playoffResults/{season}",
    region: "asia-northeast1",
  },
  async (event) => {
    const season = String(event.params.season ?? "").trim();
    if (!season) return;

    const after = event.data?.after;
    if (!after?.exists) return;

    const resultsData = after.data();
    const results = (resultsData?.results ?? {}) as Bracket;

    const bracketsSnap = await db
      .collection("playoffBrackets")
      .where("season", "==", season)
      .get();

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

      if (opCount >= 400) {
        await batch.commit();
        batch = db.batch();
        opCount = 0;
      }
    }

    if (opCount > 0) {
      await batch.commit();
    }
  }
);