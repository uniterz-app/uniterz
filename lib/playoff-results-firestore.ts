import { db } from "@/lib/firebase";
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  type Timestamp,
} from "firebase/firestore";
import type { Bracket } from "@/lib/score-playoff-bracket";

export type PlayoffResultsDoc = {
  season: string;
  results: Bracket;
  updatedAt?: Timestamp | null;
};

const COLLECTION_NAME = "playoffResults";

export async function loadPlayoffResults(
  season: string
): Promise<PlayoffResultsDoc | null> {
  const ref = doc(db, COLLECTION_NAME, season);
  const snap = await getDoc(ref);

  if (!snap.exists()) return null;

  const data = snap.data() as Partial<PlayoffResultsDoc>;

  return {
    season: data.season ?? season,
    results: data.results ?? {},
    updatedAt: data.updatedAt ?? null,
  };
}

export async function savePlayoffResults(
  season: string,
  results: Bracket
): Promise<void> {
  const ref = doc(db, COLLECTION_NAME, season);

  await setDoc(
    ref,
    {
      season,
      results,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}