/**
 * NBA プロフィール用・当月（JST）サマリー。
 * user_stats_v2_daily のシーズンスライスを合算し、period スナップショットから順位を取る。
 */

import type { Firestore } from "firebase-admin/firestore";
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";
import {
  currentRankingPeriodLabel,
  enumerateDateKeysInclusive,
  resolveRankingPeriodRangeForLabel,
} from "@/lib/rankings/rankingPeriod";
import { readNbaPeriodRankingSnapshots } from "@/lib/rankings/server/readNbaPeriodRankingSnapshots";
import type { ProfileSummaryForCards } from "@/lib/profile/resolveLiveProfileSummary";
import type { ProfileSummaryRanks } from "@/lib/rankings/server/fetchProfileSummaryRanks";

type DailyInc = {
  posts?: number;
  wins?: number;
  pointsSumV3?: number;
  upsetPointsSum?: number;
  scorePrecisionSum?: number;
  upsetBonusSum?: number;
  streakBonusSum?: number;
  upsetOpportunityCount?: number;
  upsetHitCount?: number;
};

function safeInt(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
}

function safeNum(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

function pickNbaInc(data: Record<string, unknown>): DailyInc | null {
  const bySeason = data.rankingBySeason as
    | Record<string, DailyInc>
    | undefined;
  const seasonInc = bySeason?.[CURRENT_NBA_SEASON_KEY];
  if (seasonInc && typeof seasonInc === "object") return seasonInc;

  const leagues = data.leagues as { nba?: DailyInc } | undefined;
  if (leagues?.nba && typeof leagues.nba === "object") return leagues.nba;

  const byPhase = data.rankingByPhase as
    | Record<string, DailyInc>
    | undefined;
  if (byPhase?.playoffs && typeof byPhase.playoffs === "object") {
    return byPhase.playoffs;
  }
  return null;
}

function emptySummary(): ProfileSummaryForCards {
  return {
    posts: 0,
    fullPosts: 0,
    recent3Posts: 0,
    wins: 0,
    winRate: 0,
    scorePrecisionSum: 0,
    upsetPointsSum: 0,
    pointsSumV3: 0,
    upsetChanceCount: 0,
    upsetHitCount: 0,
    upsetBonusSum: 0,
    streakBonusSum: 0,
    basePointsSum: 0,
  };
}

const EMPTY_RANKS: ProfileSummaryRanks = {
  totalPrecision: null,
  totalUpset: null,
  totalPoints: null,
  totalPointsDenominator: null,
  rankDeltaPlaces: null,
};

export type NbaMonthlyProfileSummaryResult = {
  monthLabel: string;
  summary: ProfileSummaryForCards;
  summaryRanks: ProfileSummaryRanks;
};

/**
 * 指定月（省略時は当月）の NBA プロフィールカード用サマリー + 総合得点順位。
 */
export async function resolveNbaMonthlyProfileSummary(
  db: Firestore,
  uid: string,
  monthLabel?: string
): Promise<NbaMonthlyProfileSummaryResult> {
  const label = monthLabel?.trim() || currentRankingPeriodLabel("monthly");
  const range = resolveRankingPeriodRangeForLabel("monthly", label);
  const dateKeys = enumerateDateKeysInclusive(range.startKey, range.endKey);

  let posts = 0;
  let wins = 0;
  let pointsSumV3 = 0;
  let upsetPointsSum = 0;
  let scorePrecisionSum = 0;
  let upsetBonusSum = 0;
  let streakBonusSum = 0;
  let upsetChanceCount = 0;
  let upsetHitCount = 0;

  if (dateKeys.length > 0) {
    const refs = dateKeys.map((key) =>
      db.collection("user_stats_v2_daily").doc(`${uid}_${key}`)
    );
    const snaps = await db.getAll(...refs);
    for (const snap of snaps) {
      if (!snap.exists) continue;
      const data = snap.data() as Record<string, unknown>;
      const inc = pickNbaInc(data);
      if (!inc) continue;
      posts += safeInt(inc.posts);
      wins += safeInt(inc.wins);
      pointsSumV3 += safeNum(inc.pointsSumV3);
      upsetPointsSum += safeNum(inc.upsetPointsSum);
      scorePrecisionSum += safeNum(inc.scorePrecisionSum);
      upsetBonusSum += safeNum(inc.upsetBonusSum);
      streakBonusSum += safeNum(inc.streakBonusSum);
      upsetChanceCount += safeInt(inc.upsetOpportunityCount);
      upsetHitCount += safeInt(inc.upsetHitCount);
    }
  }

  const summary: ProfileSummaryForCards =
    posts > 0
      ? {
          posts,
          fullPosts: posts,
          recent3Posts: 0,
          wins,
          winRate: wins / posts,
          scorePrecisionSum,
          upsetPointsSum,
          pointsSumV3,
          upsetChanceCount,
          upsetHitCount,
          upsetBonusSum,
          streakBonusSum,
          basePointsSum: Math.max(0, pointsSumV3 - upsetBonusSum - streakBonusSum),
        }
      : emptySummary();

  let summaryRanks = EMPTY_RANKS;
  try {
    const snapshot = await readNbaPeriodRankingSnapshots({
      period: "monthly",
      label,
      uid,
    });
    const pts = snapshot?.byMetric?.totalPoints;
    const upset = snapshot?.byMetric?.totalUpset;
    if (pts || upset) {
      summaryRanks = {
        totalPrecision: null,
        totalUpset: upset?.myRank ?? null,
        totalPoints: pts?.myRank ?? null,
        totalPointsDenominator:
          pts && Number.isFinite(pts.count) && pts.count > 0 ? pts.count : null,
        rankDeltaPlaces: pts?.myRankDeltaPlaces ?? null,
      };
    }
  } catch {
    /* 順位は任意 — サマリー本体は返す */
  }

  return { monthLabel: label, summary, summaryRanks };
}
