"use client";

import { useCallback, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import type { RankingPeriod } from "@/lib/rankings/rankingPeriod";
import type { BulkMetricPayload } from "@/lib/rankings/useCumulativeRankingsBulk";

type PeriodBulkResult = {
  byMetric: Record<string, BulkMetricPayload>;
  range: { startKey: string; endKey: string; labelKey: string } | null;
  availableLabels: string[];
};

const emptyResult: PeriodBulkResult = {
  byMetric: {},
  range: null,
  availableLabels: [],
};

export function usePeriodRankingsBulk(
  period: Exclude<RankingPeriod, "season"> | null,
  /** 過去期間のラベル。null なら現在期間 */
  label: string | null = null
) {
  const [uid, setUid] = useState<string | null>(auth.currentUser?.uid ?? null);
  const [listReady, setListReady] = useState(false);
  const [byMetric, setByMetric] = useState<Record<string, BulkMetricPayload>>(
    {}
  );
  const [range, setRange] = useState<PeriodBulkResult["range"]>(null);
  const [availableLabels, setAvailableLabels] = useState<string[]>([]);
  const [activeLabel, setActiveLabel] = useState<string | null>(null);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => setUid(u?.uid ?? null));
  }, []);

  const load = useCallback(async () => {
    if (!period) {
      setByMetric({});
      setRange(null);
      setAvailableLabels([]);
      setActiveLabel(null);
      setListReady(true);
      return;
    }
    setListReady(false);
    try {
      const token = await auth.currentUser?.getIdToken().catch(() => null);
      const params = new URLSearchParams({ period });
      if (label) params.set("label", label);
      const res = await fetch(`/api/period-ranking/bulk?${params}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        cache: "no-store",
      });
      const json = (await res.json()) as {
        ok?: boolean;
        label?: string;
        byMetric?: Record<string, BulkMetricPayload>;
        range?: PeriodBulkResult["range"];
        availableLabels?: string[];
      };
      if (!res.ok || !json?.ok) {
        setByMetric({});
        setRange(null);
        return;
      }
      setByMetric(json.byMetric ?? {});
      setRange(json.range ?? null);
      setAvailableLabels(json.availableLabels ?? []);
      setActiveLabel(json.label ?? null);
    } catch {
      setByMetric({});
      setRange(null);
    } finally {
      setListReady(true);
    }
  }, [period, label]);

  useEffect(() => {
    void load();
  }, [load, uid]);

  const ensureMetric = useCallback((_metric: string) => {
    /* period bulk loads all metrics at once */
  }, []);

  return {
    listReady: period ? listReady : true,
    personalPending: false,
    myUid: uid,
    byMetric: period ? byMetric : emptyResult.byMetric,
    myMetricValueDeltas: null as null,
    ensureMetric,
    periodRange: range,
    availableLabels: period ? availableLabels : emptyResult.availableLabels,
    activeLabel,
  };
}
