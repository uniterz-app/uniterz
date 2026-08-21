/**
 * Web プロフィール: Native と同じ cumulative_stats + profileCharts subcol 読み。
 */
"use client";

import { useEffect, useState } from "react";
import { withTimeout } from "@/lib/async/withTimeout";
import { db } from "@/lib/firebase";
import {
  prefetchNbaKinetikBothPeriodsClient,
  type NbaProfileCardPhaseClient,
} from "@/lib/profile/fetchNbaProfileCardPhaseClient";
import {
  last20FromChartsBundle,
  type ProfileChartsLast20Point,
} from "@/lib/profile/profileChartsBundle";
import type { ProfileDailyTrendRow } from "@/lib/profile/profileDailyTrendRow";
import {
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
  last20: ProfileChartsLast20Point[] | null;
  chartsPath: NbaProfileCardPhaseClient["chartsPath"] | null;
  overviewSeasonKey: string;
};

const idle: NbaProfileOverviewClientState = {
  loading: true,
  summary: null,
  summaryRanks: null,
  dailyTrend: [],
  rankTrend: [],
  last20: null,
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
      setState((prev) => ({
        ...prev,
        loading: prev.summary == null,
      }));
      const t0 = Date.now();

      try {
        const both = await withTimeout(
          prefetchNbaKinetikBothPeriodsClient(db, safeUid),
          OVERVIEW_FETCH_TIMEOUT_MS,
          "overview-fetch-timeout"
        );
        if (cancelled) return;
        if (!both) {
          setState({ ...idle, loading: false });
          return;
        }
        const fs = period === "playoffs" ? both.playoffs : both.season;
        const charts = fs.profileCharts;
        const dailyTrend = charts?.dailyTrend ?? [];
        const rankTrend = charts?.rankTrend ?? [];
        const last20 = last20FromChartsBundle(charts);
        if (process.env.NODE_ENV !== "production") {
          console.log(
            `[profileCharts:web] path=${fs.chartsPath} season=${fs.overviewSeasonKey} ms=${Date.now() - t0} daily=${dailyTrend.length} rank=${rankTrend.length} last20=${last20?.length ?? "null"}`
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
