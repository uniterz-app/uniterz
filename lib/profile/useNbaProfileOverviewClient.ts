/**
 * Web プロフィール: Native と同じ cumulative_stats 1 read + ensure 裏実行。
 */
"use client";

import { useEffect, useState } from "react";
import { withTimeout } from "@/lib/async/withTimeout";
import { db } from "@/lib/firebase";
import {
  fetchNbaProfileCardPhaseClient,
  invalidateCumulativeDataCacheClient,
  prefetchNbaKinetikBothPeriodsClient,
  type NbaProfileCardPhaseClient,
} from "@/lib/profile/fetchNbaProfileCardPhaseClient";
import {
  isProfileChartsComplete,
  type ProfileChartsLast20Point,
} from "@/lib/profile/profileChartsBundle";
import type { ProfileDailyTrendRow } from "@/lib/profile/profileDailyTrendRow";
import {
  PROFILE_OVERVIEW_USE_PREVIOUS_SEASON,
  profileOverviewSeasonKey,
} from "@/lib/profile/profileOverviewSeason";
import { preferredNbaKinetikPeriod } from "@/lib/rankings/nbaSeason";
import type { ProfileKinetikMetricsPeriod } from "@/lib/profile/useNbaKinetikMonthlyStats";
import { peekPrimedProfileStatsSummary } from "@/app/component/profile/useUserStatsV2";
import { peekNbaKinetikPeriodStatsCache } from "@/lib/profile/useNbaKinetikMonthlyStats";

export type NbaProfileOverviewClientState = {
  loading: boolean;
  summary: NbaProfileCardPhaseClient["summary"] | null;
  summaryRanks: NbaProfileCardPhaseClient["summaryRanks"] | null;
  dailyTrend: ProfileDailyTrendRow[];
  rankTrend: { dateKey: string; rank: number }[];
  last20: ProfileChartsLast20Point[];
  chartsPath: NbaProfileCardPhaseClient["chartsPath"] | null;
  overviewSeasonKey: string;
};

const idle: NbaProfileOverviewClientState = {
  loading: true,
  summary: null,
  summaryRanks: null,
  dailyTrend: [],
  rankTrend: [],
  last20: [],
  chartsPath: null,
  overviewSeasonKey: profileOverviewSeasonKey(),
};

function initialOverviewState(
  uid: string | null | undefined,
  period: ProfileKinetikMetricsPeriod
): NbaProfileOverviewClientState {
  const safeUid = uid?.trim();
  if (!safeUid) return { ...idle, loading: false };

  const primed = peekPrimedProfileStatsSummary(safeUid, "nba");
  if (primed?.summary) {
    return {
      ...idle,
      loading: true,
      summary: primed.summary as NbaProfileCardPhaseClient["summary"],
      summaryRanks:
        (primed.summaryRanks as NbaProfileCardPhaseClient["summaryRanks"]) ??
        null,
    };
  }

  const kinetik = peekNbaKinetikPeriodStatsCache(safeUid, period);
  if (kinetik?.summary) {
    return {
      ...idle,
      loading: true,
      summary: kinetik.summary as NbaProfileCardPhaseClient["summary"],
      summaryRanks:
        (kinetik.summaryRanks as NbaProfileCardPhaseClient["summaryRanks"]) ??
        null,
    };
  }

  return idle;
}

const OVERVIEW_FETCH_TIMEOUT_MS = 20_000;

async function ensureOverviewChartsBg(uid: string, seasonKey: string) {
  const qs = new URLSearchParams({
    uid,
    seasonKey,
  });
  if (PROFILE_OVERVIEW_USE_PREVIOUS_SEASON) qs.set("force", "1");
  const res = await fetch(
    `/api/profile/ensure-overview-charts?${qs.toString()}`,
    { cache: "no-store" }
  );
  if (!res.ok) return null;
  const json = (await res.json()) as {
    ok?: boolean;
    dailyTrend?: ProfileDailyTrendRow[];
    rankTrend?: { dateKey: string; rank: number }[];
    last20?: ProfileChartsLast20Point[];
  };
  if (json.ok !== true) return null;
  return {
    dailyTrend: Array.isArray(json.dailyTrend) ? json.dailyTrend : [],
    rankTrend: Array.isArray(json.rankTrend) ? json.rankTrend : [],
    last20: Array.isArray(json.last20) ? json.last20 : [],
  };
}

export function useNbaProfileOverviewClient(
  uid: string | null | undefined,
  options?: {
    enabled?: boolean;
    period?: ProfileKinetikMetricsPeriod;
  }
): NbaProfileOverviewClientState {
  const enabled = options?.enabled ?? true;
  const period = options?.period ?? preferredNbaKinetikPeriod();
  const [state, setState] = useState<NbaProfileOverviewClientState>(() =>
    enabled ? initialOverviewState(uid, period) : { ...idle, loading: false }
  );

  useEffect(() => {
    if (!enabled || !uid?.trim()) {
      setState({ ...idle, loading: false });
      return;
    }

    const safeUid = uid.trim();
    let cancelled = false;

    async function run() {
      // 既に summary がある再入場ではフルスケルトンに戻さない
      setState((prev) => ({
        ...prev,
        loading: prev.summary == null,
      }));
      const t0 = Date.now();

      void prefetchNbaKinetikBothPeriodsClient(db, safeUid);

      try {
        const fs = await withTimeout(
          fetchNbaProfileCardPhaseClient(db, safeUid, period),
          OVERVIEW_FETCH_TIMEOUT_MS,
          "overview-fetch-timeout"
        );
        if (cancelled) return;

        if (!fs) {
          setState({ ...idle, loading: false });
          return;
        }

        const charts = fs.profileCharts;
        const dailyTrend = charts?.dailyTrend ?? [];
        const rankTrend = charts?.rankTrend ?? [];
        const last20 = charts?.last20 ?? [];

        if (process.env.NODE_ENV !== "production") {
          console.log(
            `[profileCharts:web] path=${fs.chartsPath} season=${fs.overviewSeasonKey} ms=${Date.now() - t0} daily=${dailyTrend.length} rank=${rankTrend.length} last20=${last20.length}`
          );
        }

        setState({
          loading: false,
          summary: fs.summary,
          summaryRanks: fs.summaryRanks,
          dailyTrend,
          rankTrend,
          last20,
          chartsPath: fs.chartsPath,
          overviewSeasonKey: fs.overviewSeasonKey,
        });

        if (!isProfileChartsComplete(charts) && fs.chartsPath === "missing") {
          void ensureOverviewChartsBg(safeUid, fs.overviewSeasonKey).then(
            (ensured) => {
              if (cancelled || !ensured) return;
              invalidateCumulativeDataCacheClient(safeUid);
              setState((prev) => ({
                ...prev,
                dailyTrend: ensured.dailyTrend,
                rankTrend: ensured.rankTrend,
                last20: ensured.last20,
                chartsPath: "complete",
              }));
            }
          );
        }
      } catch {
        if (!cancelled) {
          setState((prev) => ({ ...prev, loading: false }));
        }
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [enabled, period, uid]);

  return state;
}
