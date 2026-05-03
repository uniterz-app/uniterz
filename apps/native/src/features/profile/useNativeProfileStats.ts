import { useEffect, useState } from "react";
import type { ProfileDailyTrendRow } from "../../../../../lib/profile/profileDailyTrendRow";
import {
  fetchDailyTrendFirestoreFallback,
  fetchProfileUserStats,
  fetchProfileUserStatsAll,
  fetchRankPlayoffTrend,
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
  error: string | null;
};

const idleState: NativeProfileStatsState = {
  loading: false,
  summary: null,
  summaryRanks: null,
  stats: null,
  dailyTrend: [],
  rankTrend: [],
  error: null,
};

/**
 * Web `ProfilePageBaseV2` + `useUserStatsV2` / `useProfilePlayoffRankTrend` に相当する取得。
 * サマリー・グラフは stats と日次トレンド・順位推移が揃うまで待つ（Web の overviewReady と同様）。
 */
export function useNativeProfileStats(uid: string | undefined, enabled: boolean) {
  const [state, setState] = useState<NativeProfileStatsState>(idleState);

  useEffect(() => {
    if (!enabled || !uid) {
      setState(idleState);
      return;
    }

    const targetUid = uid;
    let cancelled = false;

    async function run() {
      setState({
        loading: true,
        summary: null,
        summaryRanks: null,
        stats: null,
        dailyTrend: [],
        rankTrend: [],
        error: null,
      });

      try {
        const [bundle, rankRows] = await Promise.all([
          fetchProfileUserStatsAll(targetUid),
          fetchRankPlayoffTrend(targetUid),
        ]);
        if (cancelled) return;

        /** チャートが参照するのは `date` が埋まった行のみ（`ProfileDailyTrendChartNative` と整合） */
        const hasChartUsableDates = (rows: typeof bundle.dailyTrend) =>
          rows.some((r) => String(r.date ?? "").trim().length > 0);

        /** 結合 `parts=stats,phase,trend` で `dailyTrend` だけ欠けるケースに備え `trend` 単独も試す */
        const apiTrendEmpty =
          bundle.dailyTrend.length === 0 || !hasChartUsableDates(bundle.dailyTrend);

        let dailyTrend = apiTrendEmpty
          ? await fetchDailyTrendFirestoreFallback(targetUid)
          : bundle.dailyTrend;

        if (!hasChartUsableDates(dailyTrend)) {
          try {
            const trendOnly = await fetchProfileUserStats(targetUid, "trend");
            if (hasChartUsableDates(trendOnly.dailyTrend)) {
              dailyTrend = trendOnly.dailyTrend;
            }
          } catch {
            /* 後段の Firestore のみで続行 */
          }
        }

        if (!hasChartUsableDates(dailyTrend)) {
          const fb = await fetchDailyTrendFirestoreFallback(targetUid);
          if (hasChartUsableDates(fb)) dailyTrend = fb;
        }

        if (cancelled) return;

        setState({
          loading: false,
          summary: bundle.summary,
          summaryRanks: bundle.summaryRanks,
          stats: bundle.stats,
          dailyTrend,
          rankTrend: rankRows,
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
          error: msg,
        });
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [uid, enabled]);

  const overviewReady = !!uid && enabled && !state.loading && state.error == null;

  return { ...state, overviewReady };
}
