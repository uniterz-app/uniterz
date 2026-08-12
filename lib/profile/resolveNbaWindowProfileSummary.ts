/**
 * NBA プロフィール用・Week / Month ウィンドウサマリー。
 * Season / Playoffs スコープで日次を合算し、Season のみ period 順位も付与。
 */

import type { Firestore } from "firebase-admin/firestore";
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";
import {
  pickNbaPlayoffsDailyIncBucket,
  pickNbaSeasonKeyDailyIncBucket,
} from "@/lib/rankings/pickNbaStatsBucket";
import {
  currentRankingPeriodLabel,
  enumerateDateKeysInclusive,
  resolveRankingPeriodRangeForLabel,
  type RankingPeriod,
} from "@/lib/rankings/rankingPeriod";
import { readNbaPeriodRankingSnapshots } from "@/lib/rankings/server/readNbaPeriodRankingSnapshots";
import type { ProfileSummaryForCards } from "@/lib/profile/resolveLiveProfileSummary";
import type { ProfileSummaryRanks } from "@/lib/rankings/server/fetchProfileSummaryRanks";
import { resolveNbaMonthlyProfileSummary } from "@/lib/profile/resolveNbaMonthlyProfileSummary";

export type ProfileKinetikBoard = "season" | "playoffs";
export type ProfileKinetikWindow = Exclude<RankingPeriod, "season">;

/** 週次/月次プロフィール（WEEK/MONTH）カード用の事前集計キャッシュ */
const PROFILE_WINDOW_SUMMARY_CACHE_COLLECTION =
  "user_nba_window_profile_summaries_v1";

type DailyInc = {
  posts?: number;
  wins?: number;
  pointsSumV3?: number;
  upsetPointsSum?: number;
  goalScorerHitCount?: number;
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

function emptySummary(): ProfileSummaryForCards {
  return {
    posts: 0,
    fullPosts: 0,
    recent3Posts: 0,
    wins: 0,
    winRate: 0,
    exactHitCount: 0,
    goalScorerHitCount: 0,
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

function pickDailyInc(
  data: Record<string, unknown>,
  board: ProfileKinetikBoard
): DailyInc | null {
  const row =
    board === "playoffs"
      ? pickNbaPlayoffsDailyIncBucket(data)
      : pickNbaSeasonKeyDailyIncBucket(data, CURRENT_NBA_SEASON_KEY);
  if (!row || typeof row !== "object" || Object.keys(row).length === 0) {
    return null;
  }
  return row as DailyInc;
}

export type NbaWindowProfileSummaryResult = {
  board: ProfileKinetikBoard;
  window: ProfileKinetikWindow;
  label: string;
  summary: ProfileSummaryForCards;
  summaryRanks: ProfileSummaryRanks;
};

/**
 * 指定 Week / Month（省略時は現行）のカード用サマリー。
 * board=season のときのみ period ランキング順位を付与。
 */
export async function resolveNbaWindowProfileSummary(
  db: Firestore,
  uid: string,
  opts: {
    board: ProfileKinetikBoard;
    window: ProfileKinetikWindow;
    label?: string | null;
  }
): Promise<NbaWindowProfileSummaryResult> {
  const { board, window } = opts;

  /** 互換: 従来の月次 Season 実装へ委譲 */
  if (board === "season" && window === "monthly") {
    const monthly = await resolveNbaMonthlyProfileSummary(
      db,
      uid,
      opts.label ?? undefined
    );
    return {
      board,
      window,
      label: monthly.monthLabel,
      summary: monthly.summary,
      summaryRanks: monthly.summaryRanks,
    };
  }

  const label = opts.label?.trim() || currentRankingPeriodLabel(window);
  const isCurrentWindow = label === currentRankingPeriodLabel(window);

  // 現行ウィンドウは日次合算で鮮度優先（キャッシュでズレるリスクを避ける）
  if (!isCurrentWindow) {
    const cacheDocId = `${uid}_${board}_${window}_${label}`;
    const snap = await db
      .collection(PROFILE_WINDOW_SUMMARY_CACHE_COLLECTION)
      .doc(cacheDocId)
      .get();
    if (snap.exists) {
      const data = snap.data() as Partial<{
        label: string;
        summary: ProfileSummaryForCards;
        summaryRanks: ProfileSummaryRanks;
      }>;
      if (data?.summary && data?.summaryRanks) {
        return {
          board,
          window,
          label: typeof data.label === "string" && data.label ? data.label : label,
          summary: data.summary,
          summaryRanks: data.summaryRanks,
        };
      }
    }
  }

  const range = resolveRankingPeriodRangeForLabel(window, label);
  const dateKeys = enumerateDateKeysInclusive(range.startKey, range.endKey);

  let posts = 0;
  let wins = 0;
  let pointsSumV3 = 0;
  let upsetPointsSum = 0;
  let goalScorerHitCount = 0;
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
      const inc = pickDailyInc(data, board);
      if (!inc) continue;
      posts += safeInt(inc.posts);
      wins += safeInt(inc.wins);
      pointsSumV3 += safeNum(inc.pointsSumV3);
      upsetPointsSum += safeNum(inc.upsetPointsSum);
      goalScorerHitCount += safeInt(inc.goalScorerHitCount);
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
          exactHitCount: 0,
          goalScorerHitCount,
          upsetPointsSum,
          pointsSumV3,
          upsetChanceCount,
          upsetHitCount,
          upsetBonusSum,
          streakBonusSum,
          basePointsSum: Math.max(
            0,
            pointsSumV3 - upsetBonusSum - streakBonusSum
          ),
        }
      : emptySummary();

  let summaryRanks = EMPTY_RANKS;
  /** Playoff 専用の週次/月次ボードは未整備 — 順位は出さない */
  if (board === "season") {
    try {
      const snapshot = await readNbaPeriodRankingSnapshots({
        period: window,
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
            pts && Number.isFinite(pts.count) && pts.count > 0
              ? pts.count
              : null,
          rankDeltaPlaces: pts?.myRankDeltaPlaces ?? null,
        };
      }
    } catch {
      /* 順位は任意 */
    }
  }

  // 過去ラベルのみ書き戻し（現行は鮮度優先のためスキップ）
  if (!isCurrentWindow) {
    const cacheDocId = `${uid}_${board}_${window}_${label}`;
    await db
      .collection(PROFILE_WINDOW_SUMMARY_CACHE_COLLECTION)
      .doc(cacheDocId)
      .set(
        {
          board,
          window,
          label,
          summary,
          summaryRanks,
        },
        { merge: true }
      )
      .catch(() => {
        // 書き込み失敗はユーザー体験に影響させない（次回再計算で埋まる）
      });
  }

  return { board, window, label, summary, summaryRanks };
}
