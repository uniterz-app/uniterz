/**
 * Web `usePeriodRankingsBulk` 相当 — NBA Weekly / Monthly
 * 一覧は全員共通。uid 変化で再取得しない。
 */

import { useCallback, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../lib/firebase";
import { getUniterzApiBaseUrl } from "../games/submitPredictionApi";
import type { RankingDivision } from "../../../../../lib/rankings/rankingDivision";
import type { RankingPeriod } from "../../../../../lib/rankings/rankingPeriod";
import type { BulkMetricPayload } from "./useNativeCumulativeRankingsBulk";

export function useNativePeriodRankingsBulk(
  period: Exclude<RankingPeriod, "season"> | null,
  label: string | null = null,
  division: RankingDivision = "standard"
) {
  const [uid, setUid] = useState<string | null>(null);
  const [listReady, setListReady] = useState(false);
  const [byMetric, setByMetric] = useState<Record<string, BulkMetricPayload>>(
    {}
  );
  const [availableLabels, setAvailableLabels] = useState<string[]>([]);
  const [activeLabel, setActiveLabel] = useState<string | null>(null);
  const [proRequired, setProRequired] = useState(false);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => setUid(u?.uid ?? null));
  }, []);

  const load = useCallback(async () => {
    if (!period) {
      setByMetric({});
      setAvailableLabels([]);
      setActiveLabel(null);
      setProRequired(false);
      setListReady(true);
      return;
    }
    setListReady(false);
    setProRequired(false);
    try {
      const base = getUniterzApiBaseUrl();
      if (!base) {
        setByMetric({});
        return;
      }
      const token =
        division === "open"
          ? await auth.currentUser?.getIdToken().catch(() => null)
          : null;
      const params = new URLSearchParams({ period });
      if (label) params.set("label", label);
      if (division === "open") params.set("division", "open");
      const res = await fetch(
        `${base}/api/period-ranking/bulk?${params.toString()}`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          cache: division === "open" ? "no-store" : "force-cache",
        }
      );
      const json = (await res.json()) as {
        ok?: boolean;
        error?: string;
        label?: string;
        byMetric?: Record<string, BulkMetricPayload>;
        availableLabels?: string[];
      };
      if (res.status === 403 && json?.error === "pro_required") {
        setByMetric({});
        setProRequired(true);
        return;
      }
      if (!res.ok || !json?.ok) {
        setByMetric({});
        return;
      }
      setByMetric(json.byMetric ?? {});
      setAvailableLabels(json.availableLabels ?? []);
      setActiveLabel(json.label ?? null);
    } catch {
      setByMetric({});
    } finally {
      setListReady(true);
    }
  }, [period, label, division, uid]);

  useEffect(() => {
    void load();
  }, [load]);

  const ensureMetric = useCallback((_metric: string) => {
    /* period bulk loads all metrics at once */
  }, []);

  return {
    listReady: period ? listReady : true,
    personalPending: false,
    myUid: uid,
    byMetric: period ? byMetric : {},
    ensureMetric,
    availableLabels: period ? availableLabels : [],
    activeLabel,
    proRequired,
  };
}
