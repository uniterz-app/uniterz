"use client";

import { useEffect, useMemo, useState } from "react";
import type { LeagueTab, Period } from "@/lib/rankings/types";
import type {
  MobileMetric,
  RankingRowWithCountry,
  CountryCode,
} from "@/app/mobile/(with-nav)/rankings/_data/mockRows";
import { METRICS, MOCK_ROWS } from "@/app/mobile/(with-nav)/rankings/_data/mockRows";

const FALLBACK_COUNTRY_BY_UID: Record<string, CountryCode> = {
  u1: "US",
  u2: "CN",
  u3: "JP",
};

function patchRows(
  rows: RankingRowWithCountry[],
  metric: MobileMetric
): RankingRowWithCountry[] {
  return rows.map((row, index) => {
    const patched: RankingRowWithCountry = {
      ...row,
      countryCode:
        row.countryCode ??
        FALLBACK_COUNTRY_BY_UID[row.uid] ??
        (index === 0 ? "US" : index === 1 ? "CN" : "JP"),
      totalScore:
        row.totalScore ??
        (metric === "totalScore" ? (row as any).score ?? (row as any).points ?? 0 : 0),
      avgTotalScore: row.avgTotalScore ?? 0,
      marginPrecisionScore:
        row.marginPrecisionScore ??
        (metric === "marginPrecision" ? (row as any).score ?? (row as any).points ?? 0 : 0),
      avgMarginPrecision: row.avgMarginPrecision ?? 0,
      upsetScore:
        row.upsetScore ??
        (metric === "upsetScore" ? (row as any).score ?? (row as any).points ?? 0 : 0),
      avgUpsetScore: row.avgUpsetScore ?? 0,
      streak: row.streak ?? 0,
      winRate: row.winRate ?? 0,
      posts: row.posts ?? 0,
    };

    return patched;
  });
}

export function useWebRankings(league: LeagueTab, period: Period, useMock = true) {
  const availableMetrics = useMemo<MobileMetric[]>(() => {
    if (period === "month") {
      return ["totalScore", "marginPrecision", "upsetScore", "streak"];
    }
    return ["totalScore", "winRate", "marginPrecision"];
  }, [period]);

  const visibleMetrics = useMemo(
    () => METRICS.filter((m) => availableMetrics.includes(m.key)),
    [availableMetrics]
  );

  const [metric, setMetric] = useState<MobileMetric>(
    period === "month" ? "totalScore" : "winRate"
  );

  useEffect(() => {
    setMetric(period === "month" ? "totalScore" : "winRate");
  }, [period]);

  useEffect(() => {
    if (!availableMetrics.includes(metric)) {
      setMetric(availableMetrics[0]);
    }
  }, [availableMetrics, metric]);

  const [rowsMap, setRowsMap] = useState<Record<MobileMetric, RankingRowWithCountry[]>>({
    totalScore: [],
    winRate: [],
    marginPrecision: [],
    upsetScore: [],
    streak: [],
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);

      try {
        if (useMock) {
          const next: Record<MobileMetric, RankingRowWithCountry[]> = {
            totalScore: patchRows(MOCK_ROWS.totalScore, "totalScore"),
            winRate: patchRows(MOCK_ROWS.winRate, "winRate"),
            marginPrecision: patchRows(MOCK_ROWS.marginPrecision, "marginPrecision"),
            upsetScore: patchRows(MOCK_ROWS.upsetScore, "upsetScore"),
            streak: patchRows(MOCK_ROWS.streak, "streak"),
          };

          if (!cancelled) setRowsMap(next);
          return;
        }

        const results = await Promise.all(
          availableMetrics.map(async (m) => {
            const res = await fetch(
              `/api/rankings-v2?period=${period}&league=${league}&metric=${m}`,
              { cache: "no-store" }
            );
            const json = await res.json();
            const rawRows = (json.rows ?? []) as RankingRowWithCountry[];
            return [m, patchRows(rawRows, m)] as const;
          })
        );

        if (cancelled) return;

        setRowsMap((prev) => {
          const next = { ...prev };
          for (const [m, rows] of results) next[m] = rows;
          return next;
        });
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [league, period, availableMetrics, useMock]);

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