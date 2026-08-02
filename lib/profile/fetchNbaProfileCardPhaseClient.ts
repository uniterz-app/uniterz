/**
 * cumulative_stats クライアント直読（Web / Native 共用）。
 * 1 doc でカード phase + overview チャート denorm を賄う。
 */
import { doc, getDoc, type Firestore } from "firebase/firestore";
import {
  cumulativeHasNbaSeasonActivity,
  emptyProfileChartsBundle,
  isProfileChartsComplete,
  parseProfileChartsBundle,
  type ProfileChartsBundle,
} from "@/lib/profile/profileChartsBundle";
import { summaryFromNbaScopeRanking } from "@/lib/profile/resolveLiveProfileSummary";
import {
  seedNbaKinetikPeriodStatsCache,
  type ProfileKinetikMetricsPeriod,
} from "@/lib/profile/useNbaKinetikMonthlyStats";
import {
  PROFILE_OVERVIEW_USE_PREVIOUS_SEASON,
  profileOverviewSeasonKey,
} from "@/lib/profile/profileOverviewSeason";
import { readStoredRankFromSnapshotRanks } from "@/lib/rankings/server/readSnapshotRanksFromCumulative";

export type NbaProfileCardPhaseClient = {
  summary: ReturnType<typeof summaryFromNbaScopeRanking>;
  summaryRanks: {
    totalPrecision: number | null;
    totalUpset: number | null;
    totalPoints: number | null;
    totalPointsDenominator: number | null;
    rankDeltaPlaces: number | null;
  };
  profileCharts: ProfileChartsBundle | null;
  chartsPath: "complete" | "empty-season" | "missing";
  overviewSeasonKey: string;
};

const DOC_TTL_MS = 10 * 60_000;
const docCache = new Map<
  string,
  { at: number; data: Record<string, unknown> | null }
>();
const docInflight = new Map<
  string,
  Promise<Record<string, unknown> | null>
>();

export async function loadCumulativeDataClient(
  db: Firestore,
  uid: string
): Promise<Record<string, unknown> | null> {
  const safeUid = uid.trim();
  if (!safeUid) return null;

  const hit = docCache.get(safeUid);
  if (hit && Date.now() - hit.at < DOC_TTL_MS) return hit.data;

  const existing = docInflight.get(safeUid);
  if (existing) return existing;

  const promise = getDoc(doc(db, "cumulative_stats", safeUid))
    .then((snap) => {
      const data = snap.exists()
        ? (snap.data() as Record<string, unknown>)
        : null;
      docCache.set(safeUid, { at: Date.now(), data });
      return data;
    })
    .catch(() => {
      docCache.set(safeUid, { at: Date.now(), data: null });
      return null;
    })
    .finally(() => {
      docInflight.delete(safeUid);
    });

  docInflight.set(safeUid, promise);
  return promise;
}

export function invalidateCumulativeDataCacheClient(uid: string): void {
  docCache.delete(uid.trim());
}

function ranksFromData(data: Record<string, unknown> | null) {
  return {
    totalPrecision: readStoredRankFromSnapshotRanks(
      data,
      "totalPrecision",
      null
    ),
    totalUpset: readStoredRankFromSnapshotRanks(data, "totalUpset", null),
    totalPoints: readStoredRankFromSnapshotRanks(data, "totalPoints", null),
    totalPointsDenominator: null as number | null,
    rankDeltaPlaces: null as number | null,
  };
}

export function chartsFromCumulativeData(
  data: Record<string, unknown> | null
): {
  profileCharts: ProfileChartsBundle | null;
  chartsPath: "complete" | "empty-season" | "missing";
  overviewSeasonKey: string;
} {
  const overviewSeasonKey = profileOverviewSeasonKey();
  const parsed = parseProfileChartsBundle(data, overviewSeasonKey);
  if (isProfileChartsComplete(parsed)) {
    const allEmpty =
      parsed.dailyTrend.length === 0 &&
      parsed.rankTrend.length === 0 &&
      parsed.last20.length === 0;
    if (!(PROFILE_OVERVIEW_USE_PREVIOUS_SEASON && allEmpty)) {
      return {
        profileCharts: parsed,
        chartsPath: "complete",
        overviewSeasonKey,
      };
    }
  }
  if (
    !PROFILE_OVERVIEW_USE_PREVIOUS_SEASON &&
    !cumulativeHasNbaSeasonActivity(data, overviewSeasonKey)
  ) {
    return {
      profileCharts: emptyProfileChartsBundle(overviewSeasonKey),
      chartsPath: "empty-season",
      overviewSeasonKey,
    };
  }
  return { profileCharts: parsed, chartsPath: "missing", overviewSeasonKey };
}

export async function fetchNbaProfileCardPhaseClient(
  db: Firestore,
  uid: string,
  period: ProfileKinetikMetricsPeriod
): Promise<NbaProfileCardPhaseClient | null> {
  const safeUid = uid.trim();
  if (!safeUid) return null;

  try {
    const data = await loadCumulativeDataClient(db, safeUid);
    const { profileCharts, chartsPath, overviewSeasonKey } =
      chartsFromCumulativeData(data);
    return {
      summary: summaryFromNbaScopeRanking(data, period),
      summaryRanks: ranksFromData(data),
      profileCharts,
      chartsPath,
      overviewSeasonKey,
    };
  } catch {
    return null;
  }
}

export async function prefetchNbaKinetikBothPeriodsClient(
  db: Firestore,
  uid: string
): Promise<{
  season: NbaProfileCardPhaseClient;
  playoffs: NbaProfileCardPhaseClient;
} | null> {
  const safeUid = uid.trim();
  if (!safeUid) return null;

  try {
    const data = await loadCumulativeDataClient(db, safeUid);
    const ranks = ranksFromData(data);
    const { profileCharts, chartsPath, overviewSeasonKey } =
      chartsFromCumulativeData(data);
    const season: NbaProfileCardPhaseClient = {
      summary: summaryFromNbaScopeRanking(data, "season"),
      summaryRanks: ranks,
      profileCharts,
      chartsPath,
      overviewSeasonKey,
    };
    const playoffs: NbaProfileCardPhaseClient = {
      summary: summaryFromNbaScopeRanking(data, "playoffs"),
      summaryRanks: ranks,
      profileCharts,
      chartsPath,
      overviewSeasonKey,
    };
    seedNbaKinetikPeriodStatsCache(safeUid, "season", season.summary, {
      totalPrecision: season.summaryRanks.totalPrecision,
      totalUpset: season.summaryRanks.totalUpset,
      totalPoints: season.summaryRanks.totalPoints,
      totalPointsDenominator:
        season.summaryRanks.totalPointsDenominator ?? null,
      rankDeltaPlaces: season.summaryRanks.rankDeltaPlaces ?? null,
    });
    seedNbaKinetikPeriodStatsCache(safeUid, "playoffs", playoffs.summary, {
      totalPrecision: playoffs.summaryRanks.totalPrecision,
      totalUpset: playoffs.summaryRanks.totalUpset,
      totalPoints: playoffs.summaryRanks.totalPoints,
      totalPointsDenominator:
        playoffs.summaryRanks.totalPointsDenominator ?? null,
      rankDeltaPlaces: playoffs.summaryRanks.rankDeltaPlaces ?? null,
    });
    return { season, playoffs };
  } catch {
    return null;
  }
}
