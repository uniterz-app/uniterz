import { db } from "@/lib/firebase";
import {
  deleteDoc,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import type { SeriesId } from "@/lib/playoff-bracket";

export type SeriesPick = {
  winner?: string;
  games?: number;
};

export type BracketState = Partial<Record<SeriesId, SeriesPick>>;

export type PlayoffBracketDoc = {
  uid: string;
  season: string;
  bracket: BracketState;
  championPick: string | null;
  isSubmitted: boolean;
  submittedAt?: unknown;
  totalScore: number;
  winnerPoints: number;
  gamesPoints: number;
  alive: boolean;
  firstMissSeriesId: SeriesId | null;
};

function getPlayoffBracketDocId(uid: string, season: string) {
  return `${season}_${uid}`;
}

export async function loadPlayoffBracket(uid: string, season: string) {
  const ref = doc(db, "playoffBrackets", getPlayoffBracketDocId(uid, season));
  const snap = await getDoc(ref);

  if (!snap.exists()) return null;

  return snap.data() as PlayoffBracketDoc;
}

export async function createPlayoffBracket(
  uid: string,
  bracket: BracketState,
  season: string
) {
  const ref = doc(db, "playoffBrackets", getPlayoffBracketDocId(uid, season));

  await setDoc(ref, {
    uid,
    season,
    bracket,
    championPick: bracket["FINALS"]?.winner ?? null,
    isSubmitted: true,
    submittedAt: serverTimestamp(),
    totalScore: 0,
    winnerPoints: 0,
    gamesPoints: 0,
    alive: true,
    firstMissSeriesId: null,
  } satisfies PlayoffBracketDoc);
}

export async function updatePlayoffBracket(
  uid: string,
  season: string,
  bracket: BracketState
) {
  const ref = doc(db, "playoffBrackets", getPlayoffBracketDocId(uid, season));

  await updateDoc(ref, {
    bracket,
    championPick: bracket["FINALS"]?.winner ?? null,
  });
}

export async function deletePlayoffBracket(uid: string, season: string) {
  const ref = doc(db, "playoffBrackets", getPlayoffBracketDocId(uid, season));
  await deleteDoc(ref);
}