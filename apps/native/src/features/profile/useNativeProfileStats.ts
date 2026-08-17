import { useCallback, useEffect, useLayoutEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { withTimeout } from "../../../../../lib/async/withTimeout";
import type { ProfileDailyTrendRow } from "../../../../../lib/profile/profileDailyTrendRow";
import {
  isProfileChartsComplete,
  type ProfileChartsBundle,
  type ProfileChartsLast20Point,
} from "../../../../../lib/profile/profileChartsBundle";
import type { ProfileStatsStreakContext } from "../../../../../lib/profile/profileStreakScope";
import {
  prefetchNbaKinetikPeriodStats,
  seedNbaKinetikPeriodStatsCache,
  type ProfileKinetikMetricsPeriod,
} from "../../../../../lib/profile/useNbaKinetikMonthlyStats";
import {
  preferredNbaKinetikPeriod,
} from "../../../../../lib/rankings/nbaSeason";
import { profileOverviewSeasonKey, PROFILE_OVERVIEW_USE_PREVIOUS_SEASON } from "../../../../../lib/profile/profileOverviewSeason";
import type { MyRankMetricValueDeltas } from "../../../../../lib/rankings/myRankMetricValueDeltas";
import type { RankingLeagueSource } from "../../../../../lib/rankings/rankingLeagueSource";
import type { WcRankingStage } from "../../../../../lib/rankings/wcRankingStage";
import {
  fetchProfileUserStats,
  normalizeProfileDailyTrendRows,
  ensureNbaOverviewChartsApi,
  type ProfileStatsFetchContext,
  type ProfileSummaryNative,
  type ProfileSummaryRanksNative,
  type RankPlayoffTrendPointNative,
} from "./profileApi";
import {
  fetchNbaProfileCardPhaseFirestore,
  fetchNbaProfileOverviewChartsFirestore,
  invalidateProfileChartsCache,
  type NbaProfileCardPhaseFirestore,
} from "./fetchNbaProfileCardPhaseFirestore";
import { loadProfileUserDocNative } from "./profileUserDocCacheNative";
import {
  ensureNbaTodayGamesSettled,
  nbaCardStatsBackgroundRefreshMs,
  nbaCardStatsCacheTtlMs,
} from "./nbaTodayGamesSettledNative";
import {
  heroSnapshotToSummary,
  heroSnapshotToSummaryRanks,
  isProfileHeroSnapshotFresh,
  parseProfileHeroSnapshot,
} from "../../../../../lib/profile/profileHeroSnapshot";
import { getUniterzApiBaseUrl } from "../games/submitPredictionApi";

export type NativeProfileStatsState = {
  /** プロフィールカード（サマリー）取得中 */
  loading: boolean;
  /** @deprecated 互換 — daily / rank のどちらかが未取得 */
  chartsLoading: boolean;
  /** Daily Combo（26-27 season）取得中 */
  dailyTrendLoading: boolean;
  /** Ranking Progress（26-27）取得中 */
  rankTrendLoading: boolean;
  summary: ProfileSummaryNative | null;
  summaryRanks: ProfileSummaryRanksNative | null;
  stats: Record<string, unknown> | null;
  dailyTrend: ProfileDailyTrendRow[];
  rankTrend: RankPlayoffTrendPointNative[];
  /**
   * Last20 denorm（null = 未取得で posts クエリへ）。
   * [] = 取得済みだが空。
   */
  last20: ProfileChartsLast20Point[] | null;
  metricValueDeltas: MyRankMetricValueDeltas | null;
  error: string | null;
};

const STATS_CACHE_VERSION = `v12:${profileOverviewSeasonKey()}:heroSeasonStreak`;
/** NBA 以外 / フォールバック */
const CACHE_TTL_MS = 5 * 60 * 1000;
const PROFILE_STATS_FETCH_TIMEOUT_MS = 20_000;

type CacheEntry = {
  at: number;
  summary: ProfileSummaryNative | null;
  summaryRanks: ProfileSummaryRanksNative | null;
  metricValueDeltas: MyRankMetricValueDeltas | null;
  stats: Record<string, unknown> | null;
  /** null = 未取得。[] = 取得済みだが空（26-27 season） */
  dailyTrend: ProfileDailyTrendRow[] | null;
  rankTrend: RankPlayoffTrendPointNative[] | null;
  last20: ProfileChartsLast20Point[] | null;
};

const statsCache = new Map<string, CacheEntry>();

const idleState: NativeProfileStatsState = {
  loading: false,
  chartsLoading: false,
  dailyTrendLoading: false,
  rankTrendLoading: false,
  summary: null,
  summaryRanks: null,
  stats: null,
  dailyTrend: [],
  rankTrend: [],
  last20: null,
  metricValueDeltas: null,
  error: null,
};

function rankPointsFromCharts(
  points: { dateKey: string; rank: number }[]
): RankPlayoffTrendPointNative[] {
  return points.map((p) => {
    const parts = p.dateKey.split("-");
    const labelShort =
      parts.length >= 3 ? `${Number(parts[1])}/${Number(parts[2])}` : p.dateKey;
    return {
      dateKey: p.dateKey,
      rank: p.rank,
      labelShort,
      date: p.dateKey,
    };
  });
}

function statsCacheKey(
  uid: string,
  rankingLeague: RankingLeagueSource,
  _wcStage?: WcRankingStage
): string {
  const nbaPeriodSuffix =
    rankingLeague === "nba" ? `:${preferredNbaKinetikPeriod()}` : "";
  return `${STATS_CACHE_VERSION}:${uid}:${rankingLeague}:${nbaPeriodSuffix}`;
}

/** Kinetik カード用（SEASON/PLAYOFF タブ既定） */
function buildCardFetchContext(
  rankingLeague: RankingLeagueSource,
  wcStage: WcRankingStage
): ProfileStatsFetchContext {
  const nbaPeriod: ProfileKinetikMetricsPeriod | undefined =
    rankingLeague === "nba" ? preferredNbaKinetikPeriod() : undefined;
  return {
    rankingLeague,
    wcStage,
    ...(nbaPeriod ? { nbaPeriod } : {}),
  };
}

function prefetchOtherNbaKinetikPeriod(
  uid: string,
  fetchedPeriod: ProfileKinetikMetricsPeriod
): void {
  const other: ProfileKinetikMetricsPeriod =
    fetchedPeriod === "season" ? "playoffs" : "season";
  const apiBase = getUniterzApiBaseUrl() || undefined;
  prefetchNbaKinetikPeriodStats(uid, other, apiBase);
}

function seedNbaKinetikFromFetchedPeriod(
  uid: string,
  rankingLeague: RankingLeagueSource,
  period: ProfileKinetikMetricsPeriod,
  summary: ProfileSummaryNative,
  summaryRanks: ProfileSummaryRanksNative | null
): void {
  if (rankingLeague !== "nba") return;
  seedNbaKinetikPeriodStatsCache(uid, period, summary, {
    totalPrecision: summaryRanks?.totalPrecision ?? null,
    totalUpset: summaryRanks?.totalUpset ?? null,
    totalPoints: summaryRanks?.totalPoints ?? null,
    totalPointsDenominator: summaryRanks?.totalPointsDenominator ?? null,
    rankDeltaPlaces: summaryRanks?.rankDeltaPlaces ?? null,
  });
  prefetchOtherNbaKinetikPeriod(uid, period);
}

function readValidCache(
  key: string,
  rankingLeague: RankingLeagueSource = "nba"
): CacheEntry | null {
  const cached = statsCache.get(key);
  if (!cached) return null;
  const ttl =
    rankingLeague === "nba" ? nbaCardStatsCacheTtlMs() : CACHE_TTL_MS;
  if (Date.now() - cached.at >= ttl) return null;
  if (cached.summary == null) return null;
  return cached;
}

function mergeCacheEntry(key: string, patch: Partial<CacheEntry>) {
  const prev = statsCache.get(key);
  statsCache.set(key, {
    at: Date.now(),
    summary: patch.summary !== undefined ? patch.summary : (prev?.summary ?? null),
    summaryRanks:
      patch.summaryRanks !== undefined
        ? patch.summaryRanks
        : (prev?.summaryRanks ?? null),
    metricValueDeltas:
      patch.metricValueDeltas !== undefined
        ? patch.metricValueDeltas
        : (prev?.metricValueDeltas ?? null),
    stats: patch.stats !== undefined ? patch.stats : (prev?.stats ?? null),
    dailyTrend:
      patch.dailyTrend !== undefined
        ? patch.dailyTrend
        : (prev?.dailyTrend ?? null),
    rankTrend:
      patch.rankTrend !== undefined ? patch.rankTrend : (prev?.rankTrend ?? null),
    last20: patch.last20 !== undefined ? patch.last20 : (prev?.last20 ?? null),
  });
}

function loadingFlagsFromCache(cached: CacheEntry, rankingLeague: RankingLeagueSource) {
  const dailyTrendLoading = cached.dailyTrend == null;
  const rankTrendLoading =
    true && cached.rankTrend == null;
  return {
    dailyTrendLoading,
    rankTrendLoading,
    chartsLoading: dailyTrendLoading || rankTrendLoading,
  };
}

function applyCacheToState(
  cached: CacheEntry,
  rankingLeague: RankingLeagueSource,
  setState: Dispatch<SetStateAction<NativeProfileStatsState>>
) {
  const flags = loadingFlagsFromCache(cached, rankingLeague);
  setState({
    loading: false,
    ...flags,
    summary: cached.summary,
    summaryRanks: cached.summaryRanks,
    metricValueDeltas: cached.metricValueDeltas,
    stats: cached.stats,
    dailyTrend: cached.dailyTrend ?? [],
    rankTrend: cached.rankTrend ?? [],
    last20: cached.last20,
    error: null,
  });
}

function emptySummaryRanks(): ProfileSummaryRanksNative {
  return {
    totalPrecision: null,
    totalUpset: null,
    totalPoints: null,
    totalPointsDenominator: null,
    rankDeltaPlaces: null,
  };
}

function hasNbaActivityFromSummary(
  summary: ProfileSummaryNative | null | undefined
): boolean {
  return (summary?.posts ?? 0) > 0;
}

function chartsRowsFromBundle(charts: ProfileChartsBundle | null) {
  return {
    dailyTrend: normalizeProfileDailyTrendRows(charts?.dailyTrend ?? []),
    rankTrend: rankPointsFromCharts(charts?.rankTrend ?? []),
    last20: charts?.last20 ?? [],
  };
}

async function resolveNbaHeroSummary(
  targetUid: string,
  rankingLeague: RankingLeagueSource,
  cacheKey: string,
  cardPeriod: ProfileKinetikMetricsPeriod
): Promise<{
  summary: ProfileSummaryNative;
  summaryRanks: ProfileSummaryRanksNative;
} | null> {
  const cached = statsCache.get(cacheKey);
  if (cached?.summary) {
    return {
      summary: cached.summary,
      summaryRanks: cached.summaryRanks ?? emptySummaryRanks(),
    };
  }

  const userLoaded = await loadProfileUserDocNative(targetUid);
  if (userLoaded?.exists) {
    seedNativeProfileStatsFromUserDoc(targetUid, userLoaded.data, rankingLeague);
    const seeded = statsCache.get(cacheKey);
    if (seeded?.summary) {
      return {
        summary: seeded.summary,
        summaryRanks: seeded.summaryRanks ?? emptySummaryRanks(),
      };
    }
  }

  /** 移行期: hero 未整備ユーザーだけ cumulative 1 read */
  const fs = await fetchNbaProfileCardPhaseFirestore(targetUid, cardPeriod);
  if (!fs?.summary) return null;
  const summary = fs.summary as ProfileSummaryNative;
  const summaryRanks = (fs.summaryRanks ??
    emptySummaryRanks()) as ProfileSummaryRanksNative;
  mergeCacheEntry(cacheKey, { summary, summaryRanks });
  return { summary, summaryRanks };
}

async function fetchOverviewChartsOnly(
  targetUid: string,
  hasActivity: boolean
) {
  return fetchNbaProfileOverviewChartsFirestore(targetUid, {
    hasNbaSeasonActivity: hasActivity,
    allowNestedFallback: true,
  });
}

function commitChartsToStatsCache(
  cacheKey: string,
  charts: ProfileChartsBundle | null
): ReturnType<typeof chartsRowsFromBundle> {
  const rows = chartsRowsFromBundle(charts);
  mergeCacheEntry(cacheKey, rows);
  return rows;
}

function commitNbaCardPhaseToStatsCache(
  cacheKey: string,
  targetUid: string,
  rankingLeague: RankingLeagueSource,
  cardPeriod: ProfileKinetikMetricsPeriod,
  fs: NbaProfileCardPhaseFirestore & { summary: ProfileSummaryNative }
): void {
  seedNbaKinetikFromFetchedPeriod(
    targetUid,
    rankingLeague,
    cardPeriod,
    fs.summary,
    fs.summaryRanks
  );
  const charts = fs.profileCharts;
  mergeCacheEntry(cacheKey, {
    summary: fs.summary,
    summaryRanks: fs.summaryRanks,
    dailyTrend: normalizeProfileDailyTrendRows(charts?.dailyTrend ?? []),
    rankTrend: rankPointsFromCharts(charts?.rankTrend ?? []),
    last20: charts?.last20 ?? [],
  });
}

/**
 * users.profileHeroSnapshot から statsCache を即 seed（charts は後追い）。
 */
export function seedNativeProfileStatsFromUserDoc(
  uid: string,
  userDoc: Record<string, unknown> | null | undefined,
  rankingLeague: RankingLeagueSource = "nba"
): boolean {
  const safeUid = uid.trim();
  if (!safeUid || !userDoc) return false;
  const hero = parseProfileHeroSnapshot(userDoc);
  if (!isProfileHeroSnapshotFresh(hero)) return false;

  const cacheKey = statsCacheKey(safeUid, rankingLeague);
  if (readValidCache(cacheKey, rankingLeague)) return true;

  const cardPeriod = preferredNbaKinetikPeriod();
  const summary = heroSnapshotToSummary(hero, cardPeriod) as ProfileSummaryNative;
  const summaryRanks =
    heroSnapshotToSummaryRanks(hero) as ProfileSummaryRanksNative;

  seedNbaKinetikFromFetchedPeriod(
    safeUid,
    rankingLeague,
    "season",
    heroSnapshotToSummary(hero, "season") as ProfileSummaryNative,
    summaryRanks
  );
  seedNbaKinetikFromFetchedPeriod(
    safeUid,
    rankingLeague,
    "playoffs",
    heroSnapshotToSummary(hero, "playoffs") as ProfileSummaryNative,
    summaryRanks
  );

  mergeCacheEntry(cacheKey, {
    summary,
    summaryRanks,
    dailyTrend: [],
    rankTrend: [],
    last20: null,
  });
  return true;
}

/**
 * ランキング / 得点上位行からカード数字を先読み（hero が来るまでの仮）。
 * グループ期間集計は skip 側で呼ばないこと。
 */
export function primeNativeProfileStatsFromRankingRow(
  uid: string,
  row: {
    posts?: number | null;
    winRate?: number | null;
    totalScore?: number | null;
    totalPoints?: number | null;
    upsetScore?: number | null;
    totalUpset?: number | null;
    totalExactHits?: number | null;
    goalScorerHits?: number | null;
    totalGoalScorerHits?: number | null;
    rankDeltaPlaces?: number | null;
  },
  rankingLeague: RankingLeagueSource = "nba",
  rankHints?: {
    totalPointsRank?: number | null;
    totalPointsDenominator?: number | null;
  }
): void {
  const safeUid = uid.trim();
  if (!safeUid || rankingLeague !== "nba") return;

  const cacheKey = statsCacheKey(safeUid, rankingLeague);
  if (readValidCache(cacheKey, rankingLeague)?.summary) return;

  const posts = typeof row.posts === "number" ? Math.max(0, row.posts) : 0;
  const winRateRaw = typeof row.winRate === "number" ? row.winRate : 0;
  const winRate = winRateRaw <= 1 ? winRateRaw : winRateRaw / 100;
  const totalPoints =
    (typeof row.totalPoints === "number" ? row.totalPoints : null) ??
    (typeof row.totalScore === "number" ? row.totalScore : 0);
  const totalUpset =
    (typeof row.totalUpset === "number" ? row.totalUpset : null) ??
    (typeof row.upsetScore === "number" ? row.upsetScore : 0);
  const goalScorerHitCount =
    (typeof row.goalScorerHits === "number" ? row.goalScorerHits : null) ??
    (typeof row.totalGoalScorerHits === "number"
      ? row.totalGoalScorerHits
      : 0);

  const summary: ProfileSummaryNative = {
    posts,
    fullPosts: posts,
    recent3Posts: Math.min(3, posts),
    wins: Math.round(winRate * posts),
    winRate,
    exactHitCount:
      typeof row.totalExactHits === "number" ? row.totalExactHits : 0,
    goalScorerHitCount,
    upsetPointsSum: totalUpset,
    pointsSumV3: totalPoints,
    basePointsSum: totalPoints,
    upsetBonusSum: 0,
    streakBonusSum: 0,
    upsetChanceCount: 0,
    upsetHitCount: 0,
    activeWinStreak: 0,
  };

  mergeCacheEntry(cacheKey, {
    summary,
    ...(rankHints?.totalPointsRank != null
      ? {
          summaryRanks: {
            totalPrecision: null,
            totalUpset: null,
            totalPoints: rankHints.totalPointsRank,
            totalPointsDenominator:
              rankHints.totalPointsDenominator ?? null,
            rankDeltaPlaces:
              typeof row.rankDeltaPlaces === "number"
                ? row.rankDeltaPlaces
                : null,
          },
        }
      : {}),
  });
}

/**
 * Overview charts subcollection を先読み（cumulative 親 doc は読まない）。
 */
export async function prefetchNativeProfileCharts(
  uid: string,
  rankingLeague: RankingLeagueSource = "nba"
): Promise<void> {
  const safeUid = uid.trim();
  if (!safeUid || rankingLeague !== "nba") return;

  const cacheKey = statsCacheKey(safeUid, rankingLeague);
  const cached = statsCache.get(cacheKey);
  const hasActivity = hasNbaActivityFromSummary(cached?.summary ?? null);

  try {
    const chartsResult = await fetchOverviewChartsOnly(safeUid, hasActivity);
    if (!cached?.summary) return;
    commitChartsToStatsCache(cacheKey, chartsResult.profileCharts);
  } catch {
    /* ignore */
  }
}

/**
 * ログイン直後 — users hero + charts subcol のみ（cumulative 親は読まない）。
 */
export async function prefetchNativeProfileStats(
  uid: string,
  rankingLeague: RankingLeagueSource = "nba"
): Promise<void> {
  const safeUid = uid.trim();
  if (!safeUid) return;

  const cacheKey = statsCacheKey(safeUid, rankingLeague);
  if (readValidCache(cacheKey, rankingLeague)) return;

  if (rankingLeague !== "nba") return;

  ensureNbaTodayGamesSettled();
  try {
    const userLoaded = await loadProfileUserDocNative(safeUid);
    if (userLoaded?.exists) {
      seedNativeProfileStatsFromUserDoc(safeUid, userLoaded.data, rankingLeague);
    }
    await prefetchNativeProfileCharts(safeUid, rankingLeague);
  } catch {
    /* ignore */
  }
}

/**
 * カードは preferred period、overview チャートは 26-27 season 固定。
 * Daily は trend 専用リクエストで先行表示（phase 待ちしない）。
 */
export function useNativeProfileStats(
  uid: string | undefined,
  enabled: boolean,
  profileStatsContext?: ProfileStatsStreakContext,
  authReady = true
) {
  const rankingLeague = profileStatsContext?.rankingLeague ?? "nba";
  const wcStage = profileStatsContext?.wcStage ?? "overall";
  const statsEnabled = enabled && authReady;
  const cacheKey = uid ? statsCacheKey(uid, rankingLeague, wcStage) : "";

  const [state, setState] = useState<NativeProfileStatsState>(() => {
    if (!uid || !statsEnabled) return idleState;
    const cached = readValidCache(statsCacheKey(uid, rankingLeague, wcStage), rankingLeague);
    if (!cached) {
      return {
        ...idleState,
        loading: true,
        chartsLoading: true,
        dailyTrendLoading: true,
        rankTrendLoading: true,
      };
    }
    const flags = loadingFlagsFromCache(cached, rankingLeague);
    return {
      loading: false,
      ...flags,
      summary: cached.summary,
      summaryRanks: cached.summaryRanks,
      metricValueDeltas: cached.metricValueDeltas,
      stats: cached.stats,
      dailyTrend: cached.dailyTrend ?? [],
      rankTrend: cached.rankTrend ?? [],
      last20: cached.last20,
      error: null,
    };
  });

  const [refreshKey, setRefreshKey] = useState(0);
  const activeFetchKeyRef = useRef("");

  const refetchDailyTrend = useCallback(() => {
    if (cacheKey) {
      mergeCacheEntry(cacheKey, { dailyTrend: null });
    }
    setRefreshKey((k) => k + 1);
  }, [cacheKey]);

  /** 画面復帰時など: ハングした loading をやり直す */
  const refetch = useCallback(() => {
    if (cacheKey) {
      activeFetchKeyRef.current = "";
    }
    setRefreshKey((k) => k + 1);
  }, [cacheKey]);

  useLayoutEffect(() => {
    if (!uid || !cacheKey || !statsEnabled) {
      setState(idleState);
      return;
    }
    const cached = readValidCache(cacheKey, rankingLeague);
    if (cached) {
      applyCacheToState(cached, rankingLeague, setState);
      return;
    }
    setState({
      ...idleState,
      loading: true,
      chartsLoading: true,
      dailyTrendLoading: true,
      rankTrendLoading: true,
    });
  }, [cacheKey, statsEnabled, uid, rankingLeague]);

  useEffect(() => {
    if (!statsEnabled || !uid || !cacheKey) {
      setState(idleState);
      return;
    }

    const targetUid = uid;
    const cardCtx = buildCardFetchContext(rankingLeague, wcStage);
    let cancelled = false;

    async function refreshPhaseInBackground() {
      try {
        const cardPeriod =
          cardCtx.nbaPeriod ?? preferredNbaKinetikPeriod();
        if (rankingLeague === "nba") {
          const cached = statsCache.get(cacheKey);
          if (!cached?.summary) return;
          const chartsResult = await fetchOverviewChartsOnly(
            targetUid,
            hasNbaActivityFromSummary(cached.summary)
          );
          if (cancelled) return;
          const rows = commitChartsToStatsCache(
            cacheKey,
            chartsResult.profileCharts
          );
          setState((prev) => ({
            ...prev,
            dailyTrend: rows.dailyTrend,
            rankTrend: rows.rankTrend,
            last20: rows.last20,
            dailyTrendLoading: false,
            rankTrendLoading: false,
            chartsLoading: false,
          }));
          return;
        }

        const phase = await fetchProfileUserStats(targetUid, "phase", cardCtx);
        if (cancelled || !phase.summary) return;
        seedNbaKinetikFromFetchedPeriod(
          targetUid,
          rankingLeague,
          cardPeriod,
          phase.summary,
          phase.summaryRanks
        );
        mergeCacheEntry(cacheKey, {
          summary: phase.summary,
          summaryRanks: phase.summaryRanks,
          metricValueDeltas: phase.metricValueDeltas,
        });
        setState((prev) => ({
          ...prev,
          summary: phase.summary,
          summaryRanks: phase.summaryRanks ?? prev.summaryRanks,
          metricValueDeltas: phase.metricValueDeltas ?? prev.metricValueDeltas,
        }));
      } catch {
        /* keep cache */
      }
    }

    async function ensureMissingCharts() {
      const cached = statsCache.get(cacheKey);
      if (!cached?.summary) return;
      const needTrend = cached.dailyTrend == null;
      const needRank =
        cached.rankTrend == null && true;
      const needLast20 = cached.last20 == null;
      if (!needTrend && !needRank && !needLast20) return;

      if (needTrend || needRank) {
        setState((prev) => ({
          ...prev,
          dailyTrendLoading: needTrend ? true : prev.dailyTrendLoading,
          rankTrendLoading: needRank ? true : prev.rankTrendLoading,
          chartsLoading: true,
        }));
      }

      try {
        if (rankingLeague === "nba") {
          const ensured = await ensureNbaOverviewChartsApi(targetUid, {
            force: PROFILE_OVERVIEW_USE_PREVIOUS_SEASON,
          });
          if (cancelled) return;
          if (ensured) {
            invalidateProfileChartsCache(targetUid);
            mergeCacheEntry(cacheKey, {
              dailyTrend: ensured.dailyTrend,
              rankTrend: ensured.rankTrend,
              last20: ensured.last20,
            });
            setState((prev) => ({
              ...prev,
              dailyTrend: ensured.dailyTrend,
              rankTrend: ensured.rankTrend,
              last20: ensured.last20,
              dailyTrendLoading: false,
              rankTrendLoading: false,
              chartsLoading: false,
            }));
            return;
          }
        }

        mergeCacheEntry(cacheKey, {
          ...(needTrend ? { dailyTrend: [] } : {}),
          ...(needRank ? { rankTrend: [] } : {}),
          ...(needLast20 ? { last20: [] } : {}),
        });
        setState((prev) => ({
          ...prev,
          dailyTrend: needTrend ? [] : prev.dailyTrend,
          rankTrend: needRank ? [] : prev.rankTrend,
          last20: needLast20 ? [] : prev.last20,
          dailyTrendLoading: false,
          rankTrendLoading: false,
          chartsLoading: false,
        }));
      } catch {
        if (!cancelled) {
          setState((prev) => ({
            ...prev,
            dailyTrendLoading: false,
            rankTrendLoading: false,
            chartsLoading: false,
          }));
        }
      }
    }

    async function run() {
      if (rankingLeague === "nba") {
        ensureNbaTodayGamesSettled();
      }

      const cached = readValidCache(cacheKey, rankingLeague);
      if (cached) {
        applyCacheToState(cached, rankingLeague, setState);
        const refreshAfter =
          rankingLeague === "nba"
            ? nbaCardStatsBackgroundRefreshMs()
            : 30_000;
        const needsRefresh = Date.now() - cached.at >= refreshAfter;
        if (needsRefresh) void refreshPhaseInBackground();
        if (
          cached.dailyTrend == null ||
          (true && cached.rankTrend == null)
        ) {
          void ensureMissingCharts();
        }
        return;
      }

      if (activeFetchKeyRef.current === cacheKey) return;
      activeFetchKeyRef.current = cacheKey;

      try {
        if (rankingLeague === "nba") {
          /**
           * ヒーロー: users.profileHeroSnapshot（移行期のみ cumulative）。
           * Overview: profileCharts subcollection 1 read。
           */
          const cardPeriod =
            cardCtx.nbaPeriod ?? preferredNbaKinetikPeriod();
          const t0 = Date.now();

          const hero = await withTimeout(
            resolveNbaHeroSummary(
              targetUid,
              rankingLeague,
              cacheKey,
              cardPeriod
            ),
            PROFILE_STATS_FETCH_TIMEOUT_MS,
            "profile-stats-timeout"
          );
          if (cancelled) return;

          if (!hero) {
            setState((prev) => ({
              ...prev,
              loading: false,
              error: null,
            }));
            return;
          }

          seedNbaKinetikFromFetchedPeriod(
            targetUid,
            rankingLeague,
            cardPeriod,
            hero.summary,
            hero.summaryRanks
          );

          const chartsResult = await fetchOverviewChartsOnly(
            targetUid,
            hasNbaActivityFromSummary(hero.summary)
          );
          if (cancelled) return;

          const charts = chartsResult.profileCharts;
          const rows = chartsRowsFromBundle(charts);

          if (!isProfileChartsComplete(charts)) {
            if (__DEV__) {
              console.log(
                `[profileCharts] path=charts-subcol+ensure season=${chartsResult.overviewSeasonKey} chartsPath=${chartsResult.chartsPath} ms=${Date.now() - t0} daily=${rows.dailyTrend.length} rank=${rows.rankTrend.length} last20=${rows.last20.length}`
              );
            }
            mergeCacheEntry(cacheKey, {
              summary: hero.summary,
              summaryRanks: hero.summaryRanks,
              dailyTrend: rows.dailyTrend,
              rankTrend: rows.rankTrend,
              last20: rows.last20,
            });
            setState({
              loading: false,
              chartsLoading: false,
              dailyTrendLoading: false,
              rankTrendLoading: false,
              summary: hero.summary,
              summaryRanks: hero.summaryRanks,
              stats: null,
              dailyTrend: rows.dailyTrend,
              rankTrend: rows.rankTrend,
              last20: rows.last20,
              metricValueDeltas: null,
              error: null,
            });
            void ensureNbaOverviewChartsApi(targetUid, {
              force: PROFILE_OVERVIEW_USE_PREVIOUS_SEASON,
            }).then((ensured) => {
              if (cancelled || !ensured) return;
              invalidateProfileChartsCache(targetUid);
              const nextDaily = normalizeProfileDailyTrendRows(
                ensured.dailyTrend
              );
              const nextRank = ensured.rankTrend;
              const nextLast20 = ensured.last20;
              mergeCacheEntry(cacheKey, {
                dailyTrend: nextDaily,
                rankTrend: nextRank,
                last20: nextLast20,
              });
              setState((prev) => ({
                ...prev,
                dailyTrend: nextDaily,
                rankTrend: nextRank,
                last20: nextLast20,
              }));
            });
            return;
          }

          if (__DEV__) {
            console.log(
              `[profileCharts] path=${chartsResult.chartsPath} season=${chartsResult.overviewSeasonKey} ms=${Date.now() - t0} daily=${rows.dailyTrend.length} rank=${rows.rankTrend.length} last20=${rows.last20.length}`
            );
          }

          mergeCacheEntry(cacheKey, {
            summary: hero.summary,
            summaryRanks: hero.summaryRanks,
            dailyTrend: rows.dailyTrend,
            rankTrend: rows.rankTrend,
            last20: rows.last20,
          });

          setState({
            loading: false,
            chartsLoading: false,
            dailyTrendLoading: false,
            rankTrendLoading: false,
            summary: hero.summary,
            summaryRanks: hero.summaryRanks,
            stats: null,
            dailyTrend: rows.dailyTrend,
            rankTrend: rows.rankTrend,
            last20: rows.last20,
            metricValueDeltas: null,
            error: null,
          });
          return;
        }

        const phase = await fetchProfileUserStats(targetUid, "phase", cardCtx);
        if (cancelled) return;

        if (!phase.summary) {
          setState({
            ...idleState,
            loading: false,
            error: null,
          });
          return;
        }

        mergeCacheEntry(cacheKey, {
          summary: phase.summary,
          summaryRanks: phase.summaryRanks,
          metricValueDeltas: phase.metricValueDeltas,
          dailyTrend: [],
          rankTrend: [],
          last20: [],
        });

        setState({
          loading: false,
          chartsLoading: false,
          dailyTrendLoading: false,
          rankTrendLoading: false,
          summary: phase.summary,
          summaryRanks: phase.summaryRanks,
          metricValueDeltas: phase.metricValueDeltas,
          stats: null,
          dailyTrend: [],
          rankTrend: [],
          last20: [],
          error: null,
        });
      } catch (e) {
        if (cancelled) return;
        const msg = e instanceof Error ? e.message : "読み込みに失敗しました";
        setState({
          ...idleState,
          loading: false,
          error: msg,
        });
      } finally {
        if (activeFetchKeyRef.current === cacheKey) {
          activeFetchKeyRef.current = "";
        }
      }
    }

    void run();
    return () => {
      cancelled = true;
      // 離脱中にハングした fetch が残っていると、復帰時に
      // `activeFetchKeyRef === cacheKey` で再取得スキップされ loading が固まる
      if (activeFetchKeyRef.current === cacheKey) {
        activeFetchKeyRef.current = "";
      }
    };
  }, [uid, statsEnabled, rankingLeague, wcStage, cacheKey, refreshKey]);

  const cardsReady =
    !!uid &&
    statsEnabled &&
    !state.loading &&
    state.summary != null &&
    state.error == null;
  const overviewReady = cardsReady;

  return { ...state, cardsReady, overviewReady, refetchDailyTrend, refetch };
}
