import { useCallback, useEffect, useRef, useState } from "react";
import type { ProfileDailyTrendRow } from "../../../../../lib/profile/profileDailyTrendRow";
import type { ProfileStatsStreakContext } from "../../../../../lib/profile/profileStreakScope";
import type { MyRankMetricValueDeltas } from "../../../../../lib/rankings/myRankMetricValueDeltas";
import {
  fetchDailyTrendFirestoreFallback,
  fetchProfileUserStatsAll,
  fetchRankPlayoffTrend,
  normalizeProfileDailyTrendRows,
  resolveProfileDailyTrend,
  type ProfileSummaryNative,
  type ProfileSummaryRanksNative,
  type RankPlayoffTrendPointNative,
} from "./profileApi";

export type NativeProfileStatsState = {
  /** stats / trend / rank すべて完了するまで true */
  loading: boolean;
  summary: ProfileSummaryNative | null;
  summaryRanks: ProfileSummaryRanksNative | null;
  stats: Record<string, unknown> | null;
  dailyTrend: ProfileDailyTrendRow[];
  rankTrend: RankPlayoffTrendPointNative[];
  metricValueDeltas: MyRankMetricValueDeltas | null;
  error: string | null;
};

const idleState: NativeProfileStatsState = {
  loading: false,
  summary: null,
  summaryRanks: null,
  stats: null,
  dailyTrend: [],
  rankTrend: [],
  metricValueDeltas: null,
  error: null,
};

/**
 * Web `ProfilePageBaseV2` + `useUserStatsV2` / `useProfilePlayoffRankTrend` に相当する取得。
 * サマリー・グラフは stats と日次トレンド・順位推移が揃うまで待つ（Web の overviewReady と同様）。
 */
export function useNativeProfileStats(
  uid: string | undefined,
  enabled: boolean,
  profileStatsContext?: ProfileStatsStreakContext,
  /** Firestore 日次フォールバックに必要。自分プロフィール初回は `status === "ready"` を渡す */
  authReady = true
) {
  const [state, setState] = useState<NativeProfileStatsState>(idleState);
  const [refreshKey, setRefreshKey] = useState(0);
  const rankingLeague = profileStatsContext?.rankingLeague ?? "worldcup";
  const wcStage = profileStatsContext?.wcStage ?? "overall";
  const statsEnabled = enabled && authReady;

  const refetchDailyTrend = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  const backfillAttemptedRef = useRef<string>("");

  useEffect(() => {
    if (!statsEnabled || !uid) {
      setState(idleState);
      backfillAttemptedRef.current = "";
      return;
    }

    const targetUid = uid;
    const ctx: ProfileStatsStreakContext = { rankingLeague, wcStage };
    let cancelled = false;

    async function run() {
      setState({
        loading: true,
        summary: null,
        summaryRanks: null,
        stats: null,
        dailyTrend: [],
        rankTrend: [],
        metricValueDeltas: null,
        error: null,
      });

      try {
        const [bundle, rankRows] = await Promise.all([
          fetchProfileUserStatsAll(targetUid, ctx),
          fetchRankPlayoffTrend(targetUid, ctx),
        ]);
        if (cancelled) return;

        const dailyTrend = await resolveProfileDailyTrend(
          targetUid,
          ctx,
          bundle.dailyTrend
        );
        if (cancelled) return;

        backfillAttemptedRef.current = "";

        setState({
          loading: false,
          summary: bundle.summary,
          summaryRanks: bundle.summaryRanks,
          stats: bundle.stats,
          dailyTrend,
          rankTrend: rankRows,
          metricValueDeltas: bundle.metricValueDeltas,
          error: null,
        });
      } catch (e) {
        if (cancelled) return;
        const msg = e instanceof Error ? e.message : "読み込みに失敗しました";
        setState({
          loading: false,
          summary: null,
          summaryRanks: null,
          stats: null,
          dailyTrend: [],
          rankTrend: [],
          metricValueDeltas: null,
          error: msg,
        });
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [uid, statsEnabled, rankingLeague, wcStage, refreshKey]);

  /** サマリーはあるのに日次だけ空 → Firestore を再試行（初回 auth タイミング差の救済） */
  useEffect(() => {
    if (!statsEnabled || !uid || state.loading || state.error) return;
    if (state.dailyTrend.length > 0) return;
    if (!state.summary || state.summary.posts <= 0) return;

    const dedupeKey = `${uid}:${rankingLeague}:${wcStage ?? "overall"}:${refreshKey}`;
    if (backfillAttemptedRef.current === dedupeKey) return;
    backfillAttemptedRef.current = dedupeKey;

    const ctx: ProfileStatsStreakContext = { rankingLeague, wcStage };
    let cancelled = false;

    void (async () => {
      const rows = normalizeProfileDailyTrendRows(
        await fetchDailyTrendFirestoreFallback(uid, ctx)
      );
      if (cancelled || rows.length === 0) return;
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
    refreshKey,
    state.loading,
    state.error,
    state.dailyTrend.length,
    state.summary,
  ]);

  const overviewReady = !!uid && statsEnabled && !state.loading && state.error == null;

  return { ...state, overviewReady, refetchDailyTrend };
}
