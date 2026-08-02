import { useCallback, useEffect, useLayoutEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import type { ProfileDailyTrendRow } from "../../../../../lib/profile/profileDailyTrendRow";
import type { ProfileStatsStreakContext } from "../../../../../lib/profile/profileStreakScope";
import {
  prefetchNbaKinetikPeriodStats,
  seedNbaKinetikPeriodStatsCache,
  type ProfileKinetikMetricsPeriod,
} from "../../../../../lib/profile/useNbaKinetikMonthlyStats";
import {
  preferredNbaKinetikPeriod,
  CURRENT_NBA_SEASON_KEY,
} from "../../../../../lib/rankings/nbaSeason";
import type { MyRankMetricValueDeltas } from "../../../../../lib/rankings/myRankMetricValueDeltas";
import type { RankingLeagueSource } from "../../../../../lib/rankings/rankingLeagueSource";
import type { WcRankingStage } from "../../../../../lib/rankings/wcRankingStage";
import {
  fetchProfileUserStats,
  normalizeProfileDailyTrendRows,
  fetchRankPlayoffTrend,
  fetchNbaOverviewDailyTrendStrict,
  type ProfileStatsFetchContext,
  type ProfileSummaryNative,
  type ProfileSummaryRanksNative,
  type RankPlayoffTrendPointNative,
} from "./profileApi";
import { fetchNbaProfileCardPhaseFirestore } from "./fetchNbaProfileCardPhaseFirestore";
import {
  ensureNbaTodayGamesSettled,
  nbaCardStatsBackgroundRefreshMs,
  nbaCardStatsCacheTtlMs,
} from "./nbaTodayGamesSettledNative";
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
  metricValueDeltas: MyRankMetricValueDeltas | null;
  error: string | null;
};

/** overview チャートは常に現行シーズン（2026-27）レギュラー固定 */
const OVERVIEW_CHART_NBA_PERIOD: ProfileKinetikMetricsPeriod = "season";

const STATS_CACHE_VERSION = `v7:${CURRENT_NBA_SEASON_KEY}:fsPhase`;
/** NBA 以外 / フォールバック */
const CACHE_TTL_MS = 5 * 60 * 1000;

type CacheEntry = {
  at: number;
  summary: ProfileSummaryNative | null;
  summaryRanks: ProfileSummaryRanksNative | null;
  metricValueDeltas: MyRankMetricValueDeltas | null;
  stats: Record<string, unknown> | null;
  /** null = 未取得。[] = 取得済みだが空（26-27 season） */
  dailyTrend: ProfileDailyTrendRow[] | null;
  rankTrend: RankPlayoffTrendPointNative[] | null;
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
  metricValueDeltas: null,
  error: null,
};

function statsCacheKey(
  uid: string,
  rankingLeague: RankingLeagueSource,
  wcStage?: WcRankingStage
): string {
  const safeWcStage =
    rankingLeague === "worldcup" ? (wcStage ?? "overall") : undefined;
  const nbaPeriodSuffix =
    rankingLeague === "nba" ? `:${preferredNbaKinetikPeriod()}` : "";
  return `${STATS_CACHE_VERSION}:${uid}:${rankingLeague}:${safeWcStage ?? "-"}${nbaPeriodSuffix}`;
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

/** Overview チャート用 — 常に 26-27 regular season */
function buildOverviewChartFetchContext(
  rankingLeague: RankingLeagueSource,
  wcStage: WcRankingStage
): ProfileStatsFetchContext {
  return {
    rankingLeague,
    wcStage,
    ...(rankingLeague === "nba"
      ? { nbaPeriod: OVERVIEW_CHART_NBA_PERIOD }
      : {}),
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
  });
}

function loadingFlagsFromCache(cached: CacheEntry, rankingLeague: RankingLeagueSource) {
  const dailyTrendLoading = cached.dailyTrend == null;
  const rankTrendLoading =
    rankingLeague !== "worldcup" && cached.rankTrend == null;
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
    error: null,
  });
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
        rankTrendLoading: rankingLeague !== "worldcup",
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
      rankTrendLoading: rankingLeague !== "worldcup",
    });
  }, [cacheKey, statsEnabled, uid, rankingLeague]);

  useEffect(() => {
    if (!statsEnabled || !uid || !cacheKey) {
      setState(idleState);
      return;
    }

    const targetUid = uid;
    const cardCtx = buildCardFetchContext(rankingLeague, wcStage);
    const chartCtx = buildOverviewChartFetchContext(rankingLeague, wcStage);
    let cancelled = false;

    async function refreshPhaseInBackground() {
      try {
        const cardPeriod =
          cardCtx.nbaPeriod ?? preferredNbaKinetikPeriod();
        if (rankingLeague === "nba") {
          const fs = await fetchNbaProfileCardPhaseFirestore(
            targetUid,
            cardPeriod
          );
          if (cancelled || !fs?.summary) return;
          seedNbaKinetikFromFetchedPeriod(
            targetUid,
            rankingLeague,
            cardPeriod,
            fs.summary,
            fs.summaryRanks
          );
          mergeCacheEntry(cacheKey, {
            summary: fs.summary,
            summaryRanks: fs.summaryRanks,
          });
          setState((prev) => ({
            ...prev,
            summary: fs.summary,
            summaryRanks: fs.summaryRanks ?? prev.summaryRanks,
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
        cached.rankTrend == null && rankingLeague !== "worldcup";
      if (!needTrend && !needRank) return;

      if (needTrend) {
        setState((prev) => ({
          ...prev,
          dailyTrendLoading: true,
          chartsLoading: true,
        }));
      }
      if (needRank) {
        setState((prev) => ({
          ...prev,
          rankTrendLoading: true,
          chartsLoading: true,
        }));
      }

      try {
        const [trendBundle, rankRows] = await Promise.all([
          needTrend
            ? fetchNbaOverviewDailyTrendStrict(targetUid).then((dailyTrend) => ({
                dailyTrend,
              }))
            : Promise.resolve(null),
          needRank
            ? fetchRankPlayoffTrend(targetUid, chartCtx)
            : Promise.resolve(null),
        ]);
        if (cancelled) return;

        const patch: Partial<CacheEntry> = {};
        if (needTrend) {
          patch.dailyTrend = normalizeProfileDailyTrendRows(
            trendBundle?.dailyTrend ?? []
          );
        }
        if (needRank) {
          patch.rankTrend = rankRows ?? [];
        }
        mergeCacheEntry(cacheKey, patch);
        setState((prev) => {
          const dailyTrend = patch.dailyTrend ?? prev.dailyTrend;
          const rankTrend = patch.rankTrend ?? prev.rankTrend;
          const dailyTrendLoading = false;
          const rankTrendLoading =
            rankingLeague !== "worldcup" &&
            (patch.rankTrend == null ? prev.rankTrendLoading : false);
          return {
            ...prev,
            dailyTrend,
            rankTrend,
            dailyTrendLoading,
            rankTrendLoading,
            chartsLoading: dailyTrendLoading || rankTrendLoading,
          };
        });
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
          (rankingLeague !== "worldcup" && cached.rankTrend == null)
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
           * カード phase は cumulative_stats 直読のみ（本番 API なし）。
           * 試合 final → Functions 更新 → 次回/短TTL再読で反映。
           * 当日全試合 final 後は TTL を伸ばして read を抑制。
           */
          const cardPeriod =
            cardCtx.nbaPeriod ?? preferredNbaKinetikPeriod();
          const trendP = fetchNbaOverviewDailyTrendStrict(targetUid);
          const rankP = fetchRankPlayoffTrend(targetUid, chartCtx);
          const phaseP = fetchNbaProfileCardPhaseFirestore(
            targetUid,
            cardPeriod
          );

          void trendP
            .then((dailyTrend) => {
              if (cancelled) return;
              mergeCacheEntry(cacheKey, { dailyTrend });
              setState((prev) => ({
                ...prev,
                dailyTrend,
                dailyTrendLoading: false,
                chartsLoading: prev.rankTrendLoading,
              }));
            })
            .catch(() => {
              if (cancelled) return;
              mergeCacheEntry(cacheKey, { dailyTrend: [] });
              setState((prev) => ({
                ...prev,
                dailyTrend: [],
                dailyTrendLoading: false,
                chartsLoading: prev.rankTrendLoading,
              }));
            });

          void rankP
            .then((rankTrend) => {
              if (cancelled) return;
              mergeCacheEntry(cacheKey, { rankTrend });
              setState((prev) => ({
                ...prev,
                rankTrend,
                rankTrendLoading: false,
                chartsLoading: prev.dailyTrendLoading,
              }));
            })
            .catch(() => {
              if (cancelled) return;
              mergeCacheEntry(cacheKey, { rankTrend: [] });
              setState((prev) => ({
                ...prev,
                rankTrend: [],
                rankTrendLoading: false,
                chartsLoading: prev.dailyTrendLoading,
              }));
            });

          const fs = await phaseP;
          if (cancelled) return;

          if (!fs?.summary) {
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
            fs.summary,
            fs.summaryRanks
          );

          mergeCacheEntry(cacheKey, {
            summary: fs.summary,
            summaryRanks: fs.summaryRanks,
          });

          setState((prev) => ({
            ...prev,
            loading: false,
            summary: fs.summary,
            summaryRanks: fs.summaryRanks,
            stats: null,
            error: null,
          }));

          await Promise.allSettled([trendP, rankP]);
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
    };
  }, [uid, statsEnabled, rankingLeague, wcStage, cacheKey, refreshKey]);

  const cardsReady =
    !!uid &&
    statsEnabled &&
    !state.loading &&
    state.summary != null &&
    state.error == null;
  const overviewReady = cardsReady;

  return { ...state, cardsReady, overviewReady, refetchDailyTrend };
}
