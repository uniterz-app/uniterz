import { onCall } from "firebase-functions/v2/https";
import { FieldValue } from "firebase-admin/firestore";
import { db } from "../firebase";
import { scorePlayoffBracket, type Bracket } from "./scorePlayoffBracket";

export const rescorePlayoffBrackets = onCall(async (request) => {
  const season = String(request.data?.season ?? "").trim();

  if (!season) {
    throw new Error("season is required");
  }

  const resultsRef = db.collection("playoffResults").doc(season);
  const resultsSnap = await resultsRef.get();

  if (!resultsSnap.exists) {
    throw new Error(`playoffResults/${season} not found`);
  }

  const resultsData = resultsSnap.data();
  const results = (resultsData?.results ?? {}) as Bracket;

  const bracketsSnap = await db
    .collection("playoffBrackets")
    .where("season", "==", season)
    .get();

  let batch = db.batch();
  let opCount = 0;
  let updatedCount = 0;

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
    updatedCount += 1;

    if (opCount >= 400) {
      await batch.commit();
      batch = db.batch();
      opCount = 0;
    }
  }

  if (opCount > 0) {
    await batch.commit();
  }

  return {
    ok: true,
    season,
    updatedCount,
  };
});