import { onCall } from "firebase-functions/v2/https";
import { db } from "../firebase";
import { enqueuePlayoffBracketRescoreChain } from "./playoffBracketRescoreChunked";

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

  await enqueuePlayoffBracketRescoreChain(db, season);

  return {
    ok: true,
    season,
    queued: true,
    message:
      "Rescore runs in background chunks (playoffBracketRescoreTasks). Check bracket scores after a short delay.",
  };
});
