"use client";

import { useMemo, useState, useEffect } from "react";
import type {
  MobileMetric,
  RankingRowWithCountry,
} from "@/lib/rankings/rankingMetrics";
import {
  NBA_RANKING_METRICS,
  WC_RANKING_METRICS,
} from "@/lib/rankings/rankingMetrics";
import { buildRankingTabMetrics } from "@/lib/rankings/wcVisibleMetrics";
import {
  API_METRIC_BY_MOBILE,
  type RankingApiRow,
  toMobileRows,
} from "@/lib/rankings/rankingTransform";
import type { RankingRow } from "@/lib/rankings/cumulativeRankingRow";
import { useCumulativeRankingsBulk } from "@/lib/rankings/useCumulativeRankingsBulk";
import { usePeriodRankingsBulk } from "@/lib/rankings/usePeriodRankingsBulk";
import { useOpenSeasonRankingsBulk } from "@/lib/rankings/useOpenSeasonRankingsBulk";
import type { RankingPeriod } from "@/lib/rankings/rankingPeriod";
import type { PlayoffRoundKey } from "@/lib/rankings/playoffRound";
import type { RankingPhase } from "@/lib/rankings/rankingPhase";
import type { WcRankingStage } from "@/lib/rankings/wcRankingStage";
import type { RankingDivision } from "@/lib/rankings/rankingDivision";
import { resolveMyRankForCard } from "@/lib/rankings/rankingsPageShared";
import { sortRankingRowsByMetric } from "@/lib/rankings/sortRankingRows";

export type WebRankingRow = RankingRowWithCountry & {
  totalPosts?: number;
};


function mergeRowsWithMeta(
  metric: MobileMetric,
  rawRows: RankingApiRow[]
): WebRankingRow[] {
  const uiRows = toMobileRows(metric, rawRows);

  const totalPostsByUid = new Map<string, number>();
  for (const row of rawRows) {
    if (!row?.uid) continue;
    totalPostsByUid.set(row.uid, row.totalPosts ?? 0);
  }

  return uiRows.map((row) => ({
    ...row,
    totalPosts: totalPostsByUid.get(row.uid),
  }));
}

/** バルク取得後に指標ごとに UI 行を並べ替え（CF スナップショット順と揃える） */
function sortWebRankingRows(
  metric: MobileMetric,
  rows: WebRankingRow[]
): WebRankingRow[] {
  return sortRankingRowsByMetric(metric, rows);
}

const EMPTY_MAP: Record<MobileMetric, WebRankingRow[]> = {
  totalScore: [],
  winRate: [],
  marginPrecision: [],
  exactHits: [],
  upsetScore: [],
  streak: [],
  goalScorerHits: [],
};

export function useWebRankings(
  phase: RankingPhase = "playoffs",
  round: PlayoffRoundKey = "overall",
  wcStage: WcRankingStage | null = null,
  /** NBA weekly/monthly ボード。null ならシーズン累積を使う */
  period: Exclude<RankingPeriod, "season"> | null = null,
  /** 過去期間のラベル。null なら現在期間 */
  periodLabel: string | null = null,
  /** PRO LEAGUE など。period / open シーズン用 */
  division: RankingDivision = "standard",
  /** PRO LEAGUE のシーズン累積ボード */
  useOpenSeason = false
) {
  const availableMetrics = wcStage ? WC_RANKING_METRICS : NBA_RANKING_METRICS;

  const visibleMetrics = useMemo(
    () => buildRankingTabMetrics("nba"),
    []
  );

  const [metric, setMetric] = useState<MobileMetric>("totalScore");

  useEffect(() => {
    if (!availableMetrics.includes(metric)) {
      setMetric("totalScore");
    }
  }, [metric, availableMetrics]);

  const seasonBulk = useCumulativeRankingsBulk(phase, round, wcStage);
  const openSeasonBulk = useOpenSeasonRankingsBulk(useOpenSeason);
  const periodBulk = usePeriodRankingsBulk(period, periodLabel, division);
  const activeBulk = useOpenSeason
    ? openSeasonBulk
    : period
      ? periodBulk
      : seasonBulk;
  const { listReady, personalPending, myUid, byMetric, myMetricValueDeltas, ensureMetric } =
    activeBulk;

  useEffect(() => {
    void ensureMetric(API_METRIC_BY_MOBILE[metric]);
  }, [metric, ensureMetric]);

  const rowsMap = useMemo(() => {
    if (!byMetric) return EMPTY_MAP;

    const next = { ...EMPTY_MAP };
    for (const m of availableMetrics) {
      const apiMetric = API_METRIC_BY_MOBILE[m];
      const data = byMetric[apiMetric];
      const rawRows = Array.isArray(data?.rows)
        ? (data.rows as RankingApiRow[])
        : [];
      next[m] = sortWebRankingRows(
        m,
        mergeRowsWithMeta(m, rawRows)
      );
    }
    return next;
  }, [byMetric, availableMetrics]);

  const rows = rowsMap[metric] ?? [];
  const top3 = rows.slice(0, 3);
  const restRows = rows.slice(3);

  const apiKey = API_METRIC_BY_MOBILE[metric];
  const bundle = byMetric?.[apiKey];
  const metricReady = bundle != null;
  const rawRows = Array.isArray(bundle?.rows)
    ? (bundle.rows as RankingApiRow[])
    : [];
  const { myRank, myRankDeltaPlaces } = resolveMyRankForCard({
    myUid,
    myRank: bundle?.myRank,
    myRankDeltaPlaces: bundle?.myRankDeltaPlaces,
    myRow: (bundle?.myRow ?? null) as RankingRow | null,
    listRows: rawRows,
  });
  const myRow = (bundle?.myRow ?? null) as RankingRow | null;
  const rankingListCount =
    typeof bundle?.count === "number" && Number.isFinite(bundle.count)
      ? bundle.count
      : 0;

  return {
    listReady,
    metricReady,
    personalPending,
    metric,
    setMetric,
    visibleMetrics,
    rows,
    top3,
    restRows,
    myUid,
    myRank,
    myRankDeltaPlaces,
    myRow,
    rankingListCount,
    byMetric,
    myMetricValueDeltas,
    ensureMetric,
    periodAvailableLabels: periodBulk.availableLabels,
    periodActiveLabel: periodBulk.activeLabel,
    proRequired: openSeasonBulk.proRequired || periodBulk.proRequired,
  };
}
