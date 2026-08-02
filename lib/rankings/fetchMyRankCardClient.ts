/**
 * マイランクカード用 — cumulative_stats 1 read。
 * 順位・指標値を同梱。Free/Pro カードは順位デルタ非表示のため prior 履歴は読まない。
 */
import type { Firestore } from "firebase/firestore";
import { loadCumulativeDataClient } from "@/lib/profile/fetchNbaProfileCardPhaseClient";
import { pickNbaCumulativeRankingSlice } from "@/lib/rankings/pickNbaStatsBucket";
import { readStoredRankFromSnapshotRanks } from "@/lib/rankings/server/readSnapshotRanksFromCumulative";

export type MyRankCardFastRow = {
  uid: string;
  displayName: string;
  handle: string | null;
  photoURL: string | null;
  countryCode: string | null;
  plan: "free" | "pro";
  totalPosts: number;
  totalWins: number;
  winRate: number;
  totalPoints: number;
  totalPrecision: number;
  totalUpset: number;
  totalGoalScorerHits: number;
  activeWinStreak: number;
  rank: number;
  rankDeltaPlaces: number | null;
};

export type MyRankCardFastPayload = {
  myRank: number | null;
  myRankDeltaPlaces: number | null;
  myRow: MyRankCardFastRow | null;
  plan: "free" | "pro";
};

function activeBasketballStreak(data: Record<string, unknown>): number {
  const signed =
    data.activeWinStreakBasketball ??
    (data.streakBySport as Record<string, unknown> | undefined)?.basketball ??
    data.currentStreak ??
    data.activeWinStreak ??
    0;
  return typeof signed === "number" && signed > 0 ? signed : 0;
}

function buildNbaMyRow(
  uid: string,
  data: Record<string, unknown>,
  myRank: number | null
): MyRankCardFastRow {
  const bySeason = pickNbaCumulativeRankingSlice(data);
  const tp = Number(bySeason.totalPosts ?? 0);
  const tw = Number(bySeason.totalWins ?? 0);
  const plan = data.plan === "pro" ? "pro" : "free";
  return {
    uid,
    displayName: String(data.displayName ?? ""),
    handle: (data.handle as string | null | undefined) ?? null,
    photoURL: (data.photoURL as string | null | undefined) ?? null,
    countryCode: (data.countryCode as string | null | undefined) ?? null,
    plan,
    totalPosts: tp,
    totalWins: tw,
    winRate: tp > 0 ? tw / tp : Number(bySeason.winRate ?? 0),
    totalPoints: Number(bySeason.totalPoints ?? 0),
    totalPrecision: Number(bySeason.totalPrecision ?? 0),
    totalUpset: Number(bySeason.totalUpset ?? 0),
    totalGoalScorerHits: Number(bySeason.totalGoalScorerHits ?? 0),
    activeWinStreak: activeBasketballStreak(data),
    rank: myRank ?? 0,
    rankDeltaPlaces: null,
  };
}

export async function fetchMyRankCardFastClient(
  db: Firestore,
  uid: string
): Promise<MyRankCardFastPayload | null> {
  const safeUid = uid.trim();
  if (!safeUid) return null;

  try {
    const data = await loadCumulativeDataClient(db, safeUid);
    if (!data) {
      return {
        myRank: null,
        myRankDeltaPlaces: null,
        myRow: null,
        plan: "free",
      };
    }

    const myRank = readStoredRankFromSnapshotRanks(data, "totalPoints", null);
    const myRow = buildNbaMyRow(safeUid, data, myRank);

    return {
      myRank,
      myRankDeltaPlaces: null,
      myRow,
      plan: myRow.plan,
    };
  } catch {
    return null;
  }
}
