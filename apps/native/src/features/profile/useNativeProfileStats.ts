import { useCallback, useEffect, useLayoutEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import type { ProfileDailyTrendRow } from "../../../../../lib/profile/profileDailyTrendRow";
import {
  isProfileChartsComplete,
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
  invalidateCumulativeDataCache,
} from "./fetchNbaProfileCardPhaseFirestore";
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
  /**
   * Last20 denorm（null = 未取得で posts クエリへ）。
   * [] = 取得済みだが空。
   */
  last20: ProfileChartsLast20Point[] | null;
  metricValueDeltas: MyRankMetricValueDeltas | null;
  error: string | null;
};

const STATS_CACHE_VERSION = `v9:${profileOverviewSeasonKey()}:fsCharts`;
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
    last20: cached.last20,
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
          const charts = fs.profileCharts;
          mergeCacheEntry(cacheKey, {
            summary: fs.summary,
            summaryRanks: fs.summaryRanks,
            ...(charts?.dailyTrend != null
              ? {
                  dailyTrend: normalizeProfileDailyTrendRows(charts.dailyTrend),
                }
              : {}),
            ...(charts?.rankTrend != null
              ? { rankTrend: rankPointsFromCharts(charts.rankTrend) }
              : {}),
            ...(charts?.last20 != null ? { last20: charts.last20 } : {}),
          });
          setState((prev) => ({
            ...prev,
            summary: fs.summary,
            summaryRanks: fs.summaryRanks ?? prev.summaryRanks,
            dailyTrend:
              charts?.dailyTrend != null
                ? normalizeProfileDailyTrendRows(charts.dailyTrend)
                : prev.dailyTrend,
            rankTrend:
              charts?.rankTrend != null
                ? rankPointsFromCharts(charts.rankTrend)
                : prev.rankTrend,
            last20: charts?.last20 != null ? charts.last20 : prev.last20,
            dailyTrendLoading:
              charts?.dailyTrend != null ? false : prev.dailyTrendLoading,
            rankTrendLoading:
              charts?.rankTrend != null ? false : prev.rankTrendLoading,
            chartsLoading:
              (charts?.dailyTrend != null ? false : prev.dailyTrendLoading) ||
              (charts?.rankTrend != null ? false : prev.rankTrendLoading),
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
            invalidateCumulativeDataCache(targetUid);
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
           * 正: cumulative_stats 1 read（カード + profileCharts）。
           * 欠けていれば ensure API がソースから埋めて書き戻す（以降は常に 1 read）。
           * クライアントの daily×30 / history×10 / posts×40 は廃止。
           */
          const cardPeriod =
            cardCtx.nbaPeriod ?? preferredNbaKinetikPeriod();
          const t0 = Date.now();
          const fs = await fetchNbaProfileCardPhaseFirestore(
            targetUid,
            cardPeriod
          );
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

          let charts = fs.profileCharts;
          if (!isProfileChartsComplete(charts)) {
            setState((prev) => ({
              ...prev,
              loading: false,
              summary: fs.summary,
              summaryRanks: fs.summaryRanks,
              stats: null,
              dailyTrendLoading: true,
              rankTrendLoading: true,
              chartsLoading: true,
              error: null,
            }));
            mergeCacheEntry(cacheKey, {
              summary: fs.summary,
              summaryRanks: fs.summaryRanks,
            });

            const ensured = await ensureNbaOverviewChartsApi(targetUid, {
              force: PROFILE_OVERVIEW_USE_PREVIOUS_SEASON,
            });
            if (cancelled) return;
            if (ensured) {
              invalidateCumulativeDataCache(targetUid);
              charts = {
                v: 1,
                seasonKey: ensured.seasonKey,
                dailyTrend: ensured.dailyTrend,
                rankTrend: ensured.rankTrend.map((p) => ({
                  dateKey: p.dateKey,
                  rank: p.rank,
                })),
                last20: ensured.last20,
              };
            } else {
              charts = {
                v: 1,
                seasonKey: fs.overviewSeasonKey,
                dailyTrend: [],
                rankTrend: [],
                last20: [],
              };
            }
            if (__DEV__) {
              console.log(
                `[profileCharts] path=${ensured ? "ensure" : "ensure-failed"} season=${fs.overviewSeasonKey} chartsPath=${fs.chartsPath} ms=${Date.now() - t0} daily=${charts?.dailyTrend?.length ?? 0} rank=${charts?.rankTrend?.length ?? 0} last20=${charts?.last20?.length ?? 0}`
              );
            }
          } else if (__DEV__) {
            console.log(
              `[profileCharts] path=${fs.chartsPath} season=${fs.overviewSeasonKey} ms=${Date.now() - t0} daily=${charts?.dailyTrend?.length ?? 0} rank=${charts?.rankTrend?.length ?? 0} last20=${charts?.last20?.length ?? 0}`
            );
          }

          const seededDaily = normalizeProfileDailyTrendRows(
            charts?.dailyTrend ?? []
          );
          const seededRank = rankPointsFromCharts(charts?.rankTrend ?? []);
          const seededLast20 = charts?.last20 ?? [];

          mergeCacheEntry(cacheKey, {
            summary: fs.summary,
            summaryRanks: fs.summaryRanks,
            dailyTrend: seededDaily,
            rankTrend: seededRank,
            last20: seededLast20,
          });

          setState({
            loading: false,
            chartsLoading: false,
            dailyTrendLoading: false,
            rankTrendLoading: false,
            summary: fs.summary,
            summaryRanks: fs.summaryRanks,
            stats: null,
            dailyTrend: seededDaily,
            rankTrend: seededRank,
            last20: seededLast20,
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
