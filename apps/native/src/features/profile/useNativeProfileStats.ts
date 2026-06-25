import { useCallback, useEffect, useLayoutEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import type { ProfileDailyTrendRow } from "../../../../../lib/profile/profileDailyTrendRow";
import type { ProfileStatsStreakContext } from "../../../../../lib/profile/profileStreakScope";
import type { MyRankMetricValueDeltas } from "../../../../../lib/rankings/myRankMetricValueDeltas";
import type { RankingLeagueSource } from "../../../../../lib/rankings/rankingLeagueSource";
import type { WcRankingStage } from "../../../../../lib/rankings/wcRankingStage";
import {
  fetchDailyTrendFirestoreFallback,
  fetchProfileUserStats,
  fetchRankPlayoffTrend,
  normalizeProfileDailyTrendRows,
  resolveProfileDailyTrend,
  type ProfileSummaryNative,
  type ProfileSummaryRanksNative,
  type RankPlayoffTrendPointNative,
} from "./profileApi";

export type NativeProfileStatsState = {
  /** プロフィールカード（サマリー）取得中 */
  loading: boolean;
  /** チャート用の後追い取得中 */
  chartsLoading: boolean;
  summary: ProfileSummaryNative | null;
  summaryRanks: ProfileSummaryRanksNative | null;
  stats: Record<string, unknown> | null;
  dailyTrend: ProfileDailyTrendRow[];
  rankTrend: RankPlayoffTrendPointNative[];
  metricValueDeltas: MyRankMetricValueDeltas | null;
  error: string | null;
};

const CACHE_TTL_MS = 5 * 60 * 1000;
const BACKGROUND_REFRESH_MS = 30_000;

type CacheEntry = {
  at: number;
  summary: ProfileSummaryNative | null;
  summaryRanks: ProfileSummaryRanksNative | null;
  metricValueDeltas: MyRankMetricValueDeltas | null;
  stats: Record<string, unknown> | null;
  dailyTrend: ProfileDailyTrendRow[] | null;
  rankTrend: RankPlayoffTrendPointNative[] | null;
};

const statsCache = new Map<string, CacheEntry>();

const idleState: NativeProfileStatsState = {
  loading: false,
  chartsLoading: false,
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
  return `${uid}:${rankingLeague}:${safeWcStage ?? "-"}`;
}

function readValidCache(key: string): CacheEntry | null {
  const cached = statsCache.get(key);
  if (!cached) return null;
  if (Date.now() - cached.at >= CACHE_TTL_MS) return null;
  if (cached.summary == null) return null;
  return cached;
}

function mergeCacheEntry(key: string, patch: Partial<CacheEntry>) {
  const prev = statsCache.get(key);
  statsCache.set(key, {
    at: Date.now(),
    summary: patch.summary ?? prev?.summary ?? null,
    summaryRanks: patch.summaryRanks ?? prev?.summaryRanks ?? null,
    metricValueDeltas: patch.metricValueDeltas ?? prev?.metricValueDeltas ?? null,
    stats: patch.stats ?? prev?.stats ?? null,
    dailyTrend: patch.dailyTrend ?? prev?.dailyTrend ?? null,
    rankTrend: patch.rankTrend ?? prev?.rankTrend ?? null,
  });
}

function applyCacheToState(
  cached: CacheEntry,
  setState: Dispatch<SetStateAction<NativeProfileStatsState>>
) {
  setState({
    loading: false,
    chartsLoading: cached.dailyTrend == null || cached.rankTrend == null,
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
 * Web `useUserStatsV2` と同様 — カード用 phase を先に返し、trend / 順位推移は後追い。
 */
export function useNativeProfileStats(
  uid: string | undefined,
  enabled: boolean,
  profileStatsContext?: ProfileStatsStreakContext,
  /** Firestore 日次フォールバックに必要。自分プロフィール初回は `status === "ready"` を渡す */
  authReady = true
) {
  const rankingLeague = profileStatsContext?.rankingLeague ?? "worldcup";
  const wcStage = profileStatsContext?.wcStage ?? "overall";
  const statsEnabled = enabled && authReady;
  const cacheKey = uid ? statsCacheKey(uid, rankingLeague, wcStage) : "";

  const [state, setState] = useState<NativeProfileStatsState>(() => {
    if (!uid || !statsEnabled) return idleState;
    const cached = readValidCache(statsCacheKey(uid, rankingLeague, wcStage));
    if (!cached) {
      return { ...idleState, loading: true };
    }
    return {
      loading: false,
      chartsLoading: cached.dailyTrend == null || cached.rankTrend == null,
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
  const backfillAttemptedRef = useRef("");

  const refetchDailyTrend = useCallback(() => {
    if (cacheKey) {
      mergeCacheEntry(cacheKey, { dailyTrend: null });
    }
    setRefreshKey((k) => k + 1);
  }, [cacheKey]);

  /** リーグ切替を paint 前にキャッシュ反映 */
  useLayoutEffect(() => {
    if (!uid || !cacheKey || !statsEnabled) {
      setState(idleState);
      return;
    }
    const cached = readValidCache(cacheKey);
    if (cached) {
      applyCacheToState(cached, setState);
      return;
    }
    setState({ ...idleState, loading: true });
  }, [cacheKey, statsEnabled, uid]);

  useEffect(() => {
    if (!statsEnabled || !uid || !cacheKey) {
      setState(idleState);
      backfillAttemptedRef.current = "";
      return;
    }

    const targetUid = uid;
    const ctx: ProfileStatsStreakContext = { rankingLeague, wcStage };
    let cancelled = false;

    async function ensureCharts() {
      const cached = statsCache.get(cacheKey);
      if (!cached?.summary) return;

      setState((prev) => ({ ...prev, chartsLoading: true }));

      const needTrend = cached.dailyTrend == null;
      const needRankTrend = cached.rankTrend == null;
      const needStats = cached.stats == null;

      try {
        const [trendBundle, rankRows, statsBundle] = await Promise.all([
          needTrend
            ? fetchProfileUserStats(targetUid, "trend", ctx)
            : Promise.resolve(null),
          needRankTrend
            ? fetchRankPlayoffTrend(targetUid, ctx)
            : Promise.resolve(null),
          needStats
            ? fetchProfileUserStats(targetUid, "stats", ctx)
            : Promise.resolve(null),
        ]);
        if (cancelled) return;

        let dailyTrend = cached.dailyTrend ?? [];
        if (needTrend && trendBundle) {
          dailyTrend = await resolveProfileDailyTrend(
            targetUid,
            ctx,
            trendBundle.dailyTrend
          );
        }

        const rankTrend = needRankTrend ? (rankRows ?? []) : (cached.rankTrend ?? []);
        const stats = needStats
          ? statsBundle?.stats ?? cached.stats
          : cached.stats;

        mergeCacheEntry(cacheKey, {
          dailyTrend,
          rankTrend,
          stats,
        });

        setState((prev) => ({
          ...prev,
          chartsLoading: false,
          dailyTrend,
          rankTrend,
          stats: stats ?? prev.stats,
        }));
      } catch {
        if (!cancelled) {
          setState((prev) => ({ ...prev, chartsLoading: false }));
        }
      }
    }

    async function refreshPhaseInBackground() {
      try {
        const phase = await fetchProfileUserStats(targetUid, "phase", ctx);
        if (cancelled || !phase.summary) return;
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
        /* 背景更新失敗はキャッシュ表示を維持 */
      }
    }

    async function run() {
      const cached = readValidCache(cacheKey);
      if (cached) {
        applyCacheToState(cached, setState);
        const needsRefresh =
          cached.metricValueDeltas == null ||
          Date.now() - cached.at >= BACKGROUND_REFRESH_MS;
        if (needsRefresh) void refreshPhaseInBackground();
        if (cached.dailyTrend == null || cached.rankTrend == null) {
          void ensureCharts();
        }
        return;
      }

      if (activeFetchKeyRef.current === cacheKey) return;
      activeFetchKeyRef.current = cacheKey;

      try {
        const phase = await fetchProfileUserStats(targetUid, "phase", ctx);
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
        });

        backfillAttemptedRef.current = "";

        setState({
          loading: false,
          chartsLoading: true,
          summary: phase.summary,
          summaryRanks: phase.summaryRanks,
          metricValueDeltas: phase.metricValueDeltas,
          stats: null,
          dailyTrend: [],
          rankTrend: [],
          error: null,
        });

        void ensureCharts();
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

  /** サマリーはあるのに日次だけ空 → Firestore を再試行 */
  useEffect(() => {
    if (!statsEnabled || !uid || state.loading || state.error) return;
    if (state.dailyTrend.length > 0) return;
    if (!state.summary || state.summary.posts <= 0) return;

    const dedupeKey = `${cacheKey}:${refreshKey}`;
    if (backfillAttemptedRef.current === dedupeKey) return;
    backfillAttemptedRef.current = dedupeKey;

    const ctx: ProfileStatsStreakContext = { rankingLeague, wcStage };
    let cancelled = false;

    void (async () => {
      const rows = normalizeProfileDailyTrendRows(
        await fetchDailyTrendFirestoreFallback(uid, ctx)
      );
      if (cancelled || rows.length === 0) return;
      mergeCacheEntry(cacheKey, { dailyTrend: rows });
      setState((prev) =>
        prev.dailyTrend.length > 0 ? prev : { ...prev, dailyTrend: rows }
      );
    })();

    return () => {
      cancelled = true;
    };
  }, [
    uid,
    statsEnabled,
    rankingLeague,
    wcStage,
    cacheKey,
    refreshKey,
    state.loading,
    state.error,
    state.dailyTrend.length,
    state.summary,
  ]);

  const cardsReady =
    !!uid && statsEnabled && !state.loading && state.summary != null && state.error == null;
  const overviewReady = cardsReady;

  return { ...state, cardsReady, overviewReady, refetchDailyTrend };
}
