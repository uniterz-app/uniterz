"use client";

import { useEffect, useMemo, useState } from "react";
import type {
  MobileMetric,
  RankingRowWithCountry,
  CountryCode,
} from "@/app/component/rankings/_data/mockRows";
import {
  METRICS,
} from "@/app/component/rankings/_data/mockRows";
import { toMobileRows } from "@/lib/rankings/rankingTransform";

export type WebRankingRow = RankingRowWithCountry & {
  totalPosts?: number;
};

const FALLBACK_COUNTRY_BY_UID: Record<string, CountryCode> = {
  u1: "US",
  u2: "CN",
  u3: "JP",
};

const AVAILABLE_METRICS: MobileMetric[] = [
  "totalScore",
  "winRate",
  "marginPrecision",
  "upsetScore",
  "streak",
];

function withCountryFallback(rows: WebRankingRow[]): WebRankingRow[] {
  return rows.map((row, index) => ({
    ...row,
    countryCode:
      row.countryCode ??
      FALLBACK_COUNTRY_BY_UID[row.uid] ??
      (index === 0 ? "US" : index === 1 ? "CN" : "JP"),
  }));
}

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

  return withCountryFallback(
    uiRows.map((row) => ({
      ...row,
      totalPosts: totalPostsByUid.get(row.uid),
    }))
  );
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
            next[m] = mergeRowsWithMeta(m, rawRows);
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