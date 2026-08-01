/**
 * NBA Kinetik メトリクスの Playoffs / 26-27 Season 切替用クライアント hook。
 */

"use client";

import { useEffect, useState } from "react";
import type {
  SummaryForCardsV2,
  SummaryRanksV2,
} from "@/app/component/profile/useUserStatsV2";
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";

export type ProfileKinetikMetricsPeriod = "playoffs" | "season";

export type NbaPeriodKinetikStats = {
  period: ProfileKinetikMetricsPeriod;
  seasonKey: string;
  summary: SummaryForCardsV2;
  summaryRanks: SummaryRanksV2;
};

const cache = new Map<
  string,
  { at: number; data: NbaPeriodKinetikStats }
>();
const CACHE_TTL_MS = 60_000;

/** @deprecated 旧名。useNbaKinetikPeriodStats を使う */
export type NbaMonthlyKinetikStats = NbaPeriodKinetikStats & {
  monthLabel: string;
};

export function useNbaKinetikPeriodStats(
  uid: string | null | undefined,
  period: ProfileKinetikMetricsPeriod,
  enabled: boolean,
  /** Native は API ベース URL。Web は省略（相対パス） */
  apiBase?: string
): {
  data: NbaPeriodKinetikStats | null;
  loading: boolean;
} {
  const [data, setData] = useState<NbaPeriodKinetikStats | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const safeUid = uid?.trim() ?? "";
    if (!enabled || !safeUid) {
      setData(null);
      setLoading(false);
      return;
    }

    const cacheKey = `${safeUid}:${period}:${CURRENT_NBA_SEASON_KEY}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
      setData(cached.data);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    const qs = new URLSearchParams({
      uid: safeUid,
      parts: "phase",
      league: "nba",
      period,
    });
    const base = (apiBase ?? "").replace(/\/$/, "");
    const url = `${base}/api/profile/user-stats?${qs.toString()}`;

    void fetch(url, {
      method: "GET",
      cache: "no-store",
    })
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok || !json?.ok) {
          throw new Error(json?.error ?? "nba period stats failed");
        }
        const summary = (json.summary as SummaryForCardsV2) ?? null;
        const summaryRanks =
          (json.summaryRanks as SummaryRanksV2 | null | undefined) ?? {
            totalPrecision: null,
            totalUpset: null,
            totalPoints: null,
            totalPointsDenominator: null,
            rankDeltaPlaces: null,
          };
        if (!summary) {
          throw new Error("nba period summary missing");
        }
        const next: NbaPeriodKinetikStats = {
          period,
          seasonKey: CURRENT_NBA_SEASON_KEY,
          summary,
          summaryRanks,
        };
        cache.set(cacheKey, { at: Date.now(), data: next });
        if (!cancelled) setData(next);
      })
      .catch(() => {
        if (!cancelled) setData(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [uid, period, enabled, apiBase]);

  return { data, loading };
}

/** @deprecated useNbaKinetikPeriodStats に統合 */
export function useNbaKinetikMonthlyStats(
  uid: string | null | undefined,
  enabled: boolean,
  apiBase?: string
) {
  return useNbaKinetikPeriodStats(
    uid,
    "season",
    enabled,
    apiBase
  );
}

export function getNbaKinetikPeriodTitle(
  period: ProfileKinetikMetricsPeriod,
  seasonKey: string = CURRENT_NBA_SEASON_KEY
): string {
  if (period === "playoffs") return "NBA // PLAYOFFS STATS";
  const short = seasonKey.replace(/^20/, "").replace("-20", "-");
  // "2026-27" → "26-27"
  const label = /^\d{4}-\d{2}$/.test(seasonKey)
    ? `${seasonKey.slice(2, 4)}-${seasonKey.slice(5)}`
    : short;
  return `NBA // ${label} SEASON STATS`;
}

/** @deprecated */
export function getNbaKinetikMonthlyTitle(monthLabel: string): string {
  const m = monthLabel.trim();
  if (/^\d{4}-\d{2}$/.test(m)) return `NBA // ${m} STATS`;
  return getNbaKinetikPeriodTitle("season");
}
