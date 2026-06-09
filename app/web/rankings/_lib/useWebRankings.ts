"use client";

import { useMemo, useState, useEffect } from "react";
import type {
  MobileMetric,
  RankingRowWithCountry,
} from "@/app/component/rankings/_data/mockRows";
import {
  METRICS,
  NBA_RANKING_METRICS,
  WC_RANKING_METRICS,
} from "@/app/component/rankings/_data/mockRows";
import {
  API_METRIC_BY_MOBILE,
  type RankingApiRow,
  toMobileRows,
} from "@/lib/rankings/rankingTransform";
import type { RankingRow } from "@/lib/rankings/useRanking";
import { useCumulativeRankingsBulk } from "@/lib/rankings/useCumulativeRankingsBulk";
import type { PlayoffRoundKey } from "@/lib/rankings/playoffRound";
import type { RankingPhase } from "@/lib/rankings/rankingPhase";
import type { WcRankingStage } from "@/lib/rankings/wcRankingStage";

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

/** バルク取得後に指標ごとに UI 行を並べ替え */
function sortWebRankingRows(
  metric: MobileMetric,
  rows: WebRankingRow[]
): WebRankingRow[] {
  const copy = [...rows];
  switch (metric) {
    case "totalScore":
      copy.sort((a, b) => (b.totalScore ?? 0) - (a.totalScore ?? 0));
      break;
    case "winRate":
      copy.sort((a, b) => (b.winRate ?? 0) - (a.winRate ?? 0));
      break;
    case "marginPrecision":
      copy.sort(
        (a, b) =>
          (b.marginPrecisionScore ?? 0) - (a.marginPrecisionScore ?? 0)
      );
      break;
    case "upsetScore":
      copy.sort((a, b) => (b.upsetScore ?? 0) - (a.upsetScore ?? 0));
      break;
    case "streak":
      copy.sort((a, b) => (b.streak ?? 0) - (a.streak ?? 0));
      break;
    case "goalScorerHits":
      copy.sort((a, b) => (b.goalScorerHits ?? 0) - (a.goalScorerHits ?? 0));
      break;
    default:
      break;
  }
  return copy;
}

const EMPTY_MAP: Record<MobileMetric, WebRankingRow[]> = {
  totalScore: [],
  winRate: [],
  marginPrecision: [],
  upsetScore: [],
  streak: [],
  goalScorerHits: [],
};

export function useWebRankings(
  phase: RankingPhase = "playoffs",
  round: PlayoffRoundKey = "overall",
  wcStage: WcRankingStage | null = null
) {
  const availableMetrics = wcStage ? WC_RANKING_METRICS : NBA_RANKING_METRICS;

  const visibleMetrics = useMemo(
    () => METRICS.filter((m) => availableMetrics.includes(m.key)),
    [availableMetrics]
  );

  const [metric, setMetric] = useState<MobileMetric>("totalScore");

  useEffect(() => {
    if (!availableMetrics.includes(metric)) {
      setMetric("totalScore");
    }
  }, [metric, availableMetrics]);

  const { listReady, personalPending, myUid, byMetric, ensureMetric } =
    useCumulativeRankingsBulk(phase, round, wcStage);

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
  const myRank = bundle?.myRank ?? null;
  const myRankDeltaPlaces = bundle?.myRankDeltaPlaces ?? null;
  const myRow = (bundle?.myRow ?? null) as RankingRow | null;
  const rankingListCount =
    typeof bundle?.count === "number" && Number.isFinite(bundle.count)
      ? bundle.count
      : 0;

  return {
    listReady,
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
  };
}
