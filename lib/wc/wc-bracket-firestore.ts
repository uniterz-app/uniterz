import { db } from "@/lib/firebase";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import type { WcBracketPredictMatchId } from "@/lib/wc/wc-knockout-bracket";
import {
  getWcBracketChampionPick,
  WC_KNOCKOUT_SEASON,
} from "@/lib/wc/wc-knockout-bracket";
import type { WcBracketState } from "@/lib/wc/wc-knockout-bracket";
import { isWcKnockoutBracketSubmissionOpen } from "@/lib/wc/wc-knockout-config";
import { wcSurvivalRankKey } from "@/lib/wc/wc-bracket-survival-rank";

export type WcBracketDoc = {
  uid: string;
  season: string;
  bracket: WcBracketState;
  championPick: string | null;
  isSubmitted: boolean;
  submittedAt?: unknown;
  alive: boolean;
  firstMissMatchId: WcBracketPredictMatchId | null;
  survivedRounds: number;
  survivalRankKey?: number;
  hitByMatch?: Partial<Record<WcBracketPredictMatchId, boolean>>;
  scoredAt?: unknown;
};

function getWcBracketDocId(uid: string, season: string) {
  return `${season}_${uid}`;
}

export async function loadWcBracket(uid: string, season = WC_KNOCKOUT_SEASON) {
  const ref = doc(db, "wcBrackets", getWcBracketDocId(uid, season));
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return snap.data() as WcBracketDoc;
}

export async function createWcBracket(
  uid: string,
  bracket: WcBracketState,
  season = WC_KNOCKOUT_SEASON
) {
  if (!isWcKnockoutBracketSubmissionOpen(season)) {
    throw new Error("Bracket submission is closed");
  }
  const ref = doc(db, "wcBrackets", getWcBracketDocId(uid, season));

  await setDoc(ref, {
    uid,
    season,
    bracket,
    championPick: getWcBracketChampionPick(bracket),
    isSubmitted: true,
    submittedAt: serverTimestamp(),
    alive: true,
    firstMissMatchId: null,
    survivedRounds: 5,
    survivalRankKey: wcSurvivalRankKey({
      alive: true,
      survivedRounds: 5,
      firstMissMatchId: null,
    }),
    hitByMatch: {},
  } satisfies WcBracketDoc);
}

export type WcBracketResultsDoc = {
  season: string;
  winners: Partial<Record<WcBracketPredictMatchId, string>>;
  lastMatchId?: string;
  lastGameId?: string;
  updatedAt?: unknown;
};

export async function loadWcBracketResults(season = WC_KNOCKOUT_SEASON) {
  const ref = doc(db, "wcBracketResults", season);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return snap.data() as WcBracketResultsDoc;
}
