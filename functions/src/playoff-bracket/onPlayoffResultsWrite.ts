import { onDocumentWritten } from "firebase-functions/v2/firestore";
import { db } from "../firebase";
import { enqueuePlayoffBracketRescoreChain } from "./playoffBracketRescoreChunked";

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

    await enqueuePlayoffBracketRescoreChain(db, season);
  }
);
