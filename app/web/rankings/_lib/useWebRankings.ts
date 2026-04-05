"use client";

import { useEffect, useMemo, useState } from "react";
import type {
  MobileMetric,
  RankingRowWithCountry,
} from "@/app/component/rankings/_data/mockRows";
import {
  METRICS,
} from "@/app/component/rankings/_data/mockRows";
import { toMobileRows } from "@/lib/rankings/rankingTransform";
import type { RankingRow } from "@/lib/rankings/useRanking";

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
  rawRows: any[]
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
      copy.sort((a, b) =>
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

  const [rowsMap, setRowsMap] = useState<Record<MobileMetric, WebRankingRow[]>>(
    {
      totalScore: [],
      winRate: [],
      marginPrecision: [],
      upsetScore: [],
      streak: [],
    }
  );

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);

      try {
        const res = await fetch("/api/cumulative-ranking/bulk", {
          method: "GET",
          cache: "no-store",
        });

        if (!res.ok) {
          throw new Error("bulk fetch failed");
        }

        const json = await res.json();
        if (!json?.ok || !json?.byMetric) {
          throw new Error("invalid bulk response");
        }

        if (cancelled) return;

        const byMetric = json.byMetric as Record<string, { rows?: unknown[] }>;
        const apiMetricByMobile: Record<MobileMetric, string> = {
          totalScore: "totalPoints",
          winRate: "winRate",
          marginPrecision: "totalPrecision",
          upsetScore: "totalUpset",
          streak: "activeWinStreak",
        };

        setRowsMap((prev) => {
          const next = { ...prev };
          for (const m of AVAILABLE_METRICS) {
            const apiMetric = apiMetricByMobile[m];
            const data = byMetric[apiMetric];
            const rawRows = Array.isArray(data?.rows) ? data.rows : [];
            next[m] = sortWebRankingRows(
              m,
              mergeRowsWithMeta(m, rawRows as RankingRow[])
            );
          }
          return next;
        });
      } catch {
        if (cancelled) return;
        setRowsMap({
          totalScore: [],
          winRate: [],
          marginPrecision: [],
          upsetScore: [],
          streak: [],
        });
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, []);

  const rows = rowsMap[metric] ?? [];
  const top3 = rows.slice(0, 3);
  const restRows = rows.slice(3);

  return {
    loading,
    metric,
    setMetric,
    visibleMetrics,
    rows,
    top3,
    restRows,
  };
}