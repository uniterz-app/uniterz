/**
 * マイランクカード用 — cumulative_stats 1 read。
 * 順位・指標値・Ranking Progress seed を同梱。
 */
import type { Firestore } from "firebase/firestore";
import { loadCumulativeDataClient } from "@/lib/profile/fetchNbaProfileCardPhaseClient";
import { profileOverviewSeasonKey } from "@/lib/profile/profileOverviewSeason";
import { loadProfileChartsBundleClient } from "@/lib/profile/profileChartsStorage";
import { pickNbaCumulativeRankingSlice } from "@/lib/rankings/pickNbaStatsBucket";
import type { MyRankProgressPoint } from "@/lib/rankings/myRankRankingProgress";
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
  /** profileCharts.rankTrend（別 API は打たない） */
  rankProgressPoints: MyRankProgressPoint[] | null;
  rankProgressSeedComplete: boolean;
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
        rankProgressPoints: [],
        rankProgressSeedComplete: true,
      };
    }

    const myRank = readStoredRankFromSnapshotRanks(data, "totalPoints");
    const myRow = buildNbaMyRow(safeUid, data, myRank);
    const seasonKey = profileOverviewSeasonKey();
    const charts = await loadProfileChartsBundleClient(
      db,
      safeUid,
      seasonKey,
      data
    );
    const rankProgressPoints = (charts?.rankTrend ??
      []) as MyRankProgressPoint[];

    return {
      myRank,
      myRankDeltaPlaces: null,
      myRow,
      plan: myRow.plan,
      rankProgressPoints,
      // subcollection / 親 fallback を読んだので別 API は打たない
      rankProgressSeedComplete: true,
    };
  } catch {
    return null;
  }
}
