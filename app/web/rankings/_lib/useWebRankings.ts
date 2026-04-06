"use client";

import { useMemo, useState, useEffect } from "react";
import type {
  MobileMetric,
  RankingRowWithCountry,
} from "@/app/component/rankings/_data/mockRows";
import { METRICS } from "@/app/component/rankings/_data/mockRows";
import {
  API_METRIC_BY_MOBILE,
  type RankingApiRow,
  toMobileRows,
} from "@/lib/rankings/rankingTransform";
import type { RankingRow } from "@/lib/rankings/useRanking";
import { useCumulativeRankingsBulk } from "@/lib/rankings/useCumulativeRankingsBulk";

export type WebRankingRow = RankingRowWithCountry & {
  totalPosts?: number;
};

const AVAILABLE_METRICS: MobileMetric[] = [
  "totalScore",
  "winRate",
  "marginPrecision",
  "upsetScore",
  "streak",
];

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
};

export function useWebRankings() {
  const visibleMetrics = useMemo(
    () => METRICS.filter((m) => AVAILABLE_METRICS.includes(m.key)),
    []
  );

  const [metric, setMetric] = useState<MobileMetric>("totalScore");

  useEffect(() => {
    if (!AVAILABLE_METRICS.includes(metric)) {
      setMetric("totalScore");
    }
  }, [metric]);

  const { listReady, personalPending, myUid, byMetric } =
    useCumulativeRankingsBulk();

  const rowsMap = useMemo(() => {
    if (!byMetric) return EMPTY_MAP;

    const next = { ...EMPTY_MAP };
    for (const m of AVAILABLE_METRICS) {
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
  }, [byMetric]);

  const rows = rowsMap[metric] ?? [];
  const top3 = rows.slice(0, 3);
  const restRows = rows.slice(3);

  const apiKey = API_METRIC_BY_MOBILE[metric];
  const bundle = byMetric?.[apiKey];
  const myRank = bundle?.myRank ?? null;
  const myRow = (bundle?.myRow ?? null) as RankingRow | null;

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
    myRow,
  };
}
