/**
 * cumulative_stats 直読でカード phase を返す（公開読取前提）。
 * 1 doc で season / playoffs + overview チャート denorm を賄う。
 */
import { doc, getDoc } from "firebase/firestore";
import {
  parseProfileChartsBundle,
  type ProfileChartsBundle,
} from "../../../../../lib/profile/profileChartsBundle";
import { summaryFromNbaScopeRanking } from "../../../../../lib/profile/resolveLiveProfileSummary";
import {
  seedNbaKinetikPeriodStatsCache,
  type ProfileKinetikMetricsPeriod,
} from "../../../../../lib/profile/useNbaKinetikMonthlyStats";
import { CURRENT_NBA_SEASON_KEY } from "../../../../../lib/rankings/nbaSeason";
import { readStoredRankFromSnapshotRanks } from "../../../../../lib/rankings/server/readSnapshotRanksFromCumulative";
import { db } from "../../lib/firebase";
import type { ProfileSummaryNative, ProfileSummaryRanksNative } from "./profileApi";

export type NbaProfileCardPhaseFirestore = {
  summary: ProfileSummaryNative;
  summaryRanks: ProfileSummaryRanksNative;
  /** overview チャート denorm（欠ける配列キーは従来フェッチ） */
  profileCharts: ProfileChartsBundle | null;
};

const DOC_TTL_MS = 45_000;
const docCache = new Map<
  string,
  { at: number; data: Record<string, unknown> | null }
>();
const docInflight = new Map<
  string,
  Promise<Record<string, unknown> | null>
>();

export async function loadCumulativeData(
  uid: string
): Promise<Record<string, unknown> | null> {
  const hit = docCache.get(uid);
  if (hit && Date.now() - hit.at < DOC_TTL_MS) return hit.data;

  const existing = docInflight.get(uid);
  if (existing) return existing;

  const promise = getDoc(doc(db, "cumulative_stats", uid))
    .then((snap) => {
      const data = snap.exists()
        ? (snap.data() as Record<string, unknown>)
        : null;
      docCache.set(uid, { at: Date.now(), data });
      return data;
    })
    .catch(() => {
      docCache.set(uid, { at: Date.now(), data: null });
      return null;
    })
    .finally(() => {
      docInflight.delete(uid);
    });

  docInflight.set(uid, promise);
  return promise;
}

/** ensure API 書き込み後にローカル doc キャッシュを捨てる */
export function invalidateCumulativeDataCache(uid: string): void {
  docCache.delete(uid.trim());
}

function ranksFromData(
  data: Record<string, unknown> | null
): ProfileSummaryRanksNative {
  return {
    totalPrecision: readStoredRankFromSnapshotRanks(
      data,
      "totalPrecision",
      null
    ),
    totalUpset: readStoredRankFromSnapshotRanks(data, "totalUpset", null),
    totalPoints: readStoredRankFromSnapshotRanks(data, "totalPoints", null),
    totalPointsDenominator: null,
    rankDeltaPlaces: null,
  };
}

function chartsFromData(
  data: Record<string, unknown> | null
): ProfileChartsBundle | null {
  return parseProfileChartsBundle(data, CURRENT_NBA_SEASON_KEY);
}

export async function fetchNbaProfileCardPhaseFirestore(
  uid: string,
  period: ProfileKinetikMetricsPeriod
): Promise<NbaProfileCardPhaseFirestore | null> {
  const safeUid = uid.trim();
  if (!safeUid) return null;

  try {
    const data = await loadCumulativeData(safeUid);
    return {
      summary: summaryFromNbaScopeRanking(data, period),
      summaryRanks: ranksFromData(data),
      profileCharts: chartsFromData(data),
    };
  } catch {
    return null;
  }
}

/** season + playoffs を同じ 1 read でキャッシュに載せる */
export async function prefetchNbaKinetikBothPeriodsFirestore(
  uid: string
): Promise<{
  season: NbaProfileCardPhaseFirestore;
  playoffs: NbaProfileCardPhaseFirestore;
} | null> {
  const safeUid = uid.trim();
  if (!safeUid) return null;

  try {
    const data = await loadCumulativeData(safeUid);
    const ranks = ranksFromData(data);
    const profileCharts = chartsFromData(data);
    const season = {
      summary: summaryFromNbaScopeRanking(data, "season"),
      summaryRanks: ranks,
      profileCharts,
    };
    const playoffs = {
      summary: summaryFromNbaScopeRanking(data, "playoffs"),
      summaryRanks: ranks,
      profileCharts,
    };
    seedNbaKinetikPeriodStatsCache(
      safeUid,
      "season",
      season.summary,
      {
        totalPrecision: season.summaryRanks.totalPrecision,
        totalUpset: season.summaryRanks.totalUpset,
        totalPoints: season.summaryRanks.totalPoints,
        totalPointsDenominator:
          season.summaryRanks.totalPointsDenominator ?? null,
        rankDeltaPlaces: season.summaryRanks.rankDeltaPlaces ?? null,
      }
    );
    seedNbaKinetikPeriodStatsCache(
      safeUid,
      "playoffs",
      playoffs.summary,
      {
        totalPrecision: playoffs.summaryRanks.totalPrecision,
        totalUpset: playoffs.summaryRanks.totalUpset,
        totalPoints: playoffs.summaryRanks.totalPoints,
        totalPointsDenominator:
          playoffs.summaryRanks.totalPointsDenominator ?? null,
        rankDeltaPlaces: playoffs.summaryRanks.rankDeltaPlaces ?? null,
      }
    );
    return { season, playoffs };
  } catch {
    return null;
  }
}
