"use client";

import { useEffect, useMemo, useState } from "react";
import type {
  MobileMetric,
  RankingRowWithCountry,
  CountryCode,
} from "@/app/component/rankings/_data/mockRows";
import {
  METRICS,
  MOCK_ROWS,
} from "@/app/component/rankings/_data/mockRows";
import { toApiMetric, toMobileRows } from "@/lib/rankings/rankingTransform";

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

function toMockRows(metric: MobileMetric): WebRankingRow[] {
  return withCountryFallback(MOCK_ROWS[metric] ?? []);
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

export function useWebRankings(useMock = false) {
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
        if (useMock) {
          const next: Record<MobileMetric, WebRankingRow[]> = {
            totalScore: toMockRows("totalScore"),
            winRate: toMockRows("winRate"),
            marginPrecision: toMockRows("marginPrecision"),
            upsetScore: toMockRows("upsetScore"),
            streak: toMockRows("streak"),
          };

          if (!cancelled) setRowsMap(next);
          return;
        }

        const results = await Promise.all(
          AVAILABLE_METRICS.map(async (m) => {
            const apiMetric = toApiMetric(m);
            const res = await fetch(`/api/cumulative-ranking?metric=${apiMetric}`, {
              method: "GET",
              cache: "no-store",
            });

            if (!res.ok) {
              return [m, toMockRows(m)] as const;
            }

            const json = await res.json();
            const rawRows = Array.isArray(json?.rows) ? json.rows : [];

            return [m, mergeRowsWithMeta(m, rawRows)] as const;
          })
        );

        if (cancelled) return;

        setRowsMap((prev) => {
          const next = { ...prev };
          for (const [m, rows] of results) {
            next[m] = rows;
          }
          return next;
        });
      } catch {
        if (cancelled) return;

        setRowsMap((prev) => ({
          ...prev,
          totalScore: prev.totalScore.length
            ? prev.totalScore
            : toMockRows("totalScore"),
          marginPrecision: prev.marginPrecision.length
            ? prev.marginPrecision
            : toMockRows("marginPrecision"),
          upsetScore: prev.upsetScore.length
            ? prev.upsetScore
            : toMockRows("upsetScore"),
          streak: prev.streak.length ? prev.streak : toMockRows("streak"),
          winRate: prev.winRate.length ? prev.winRate : toMockRows("winRate"),
        }));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [useMock]);

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