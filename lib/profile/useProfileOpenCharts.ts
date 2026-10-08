/**
 * PRO LEAGUE 用 Overview チャート（profileCharts/{season}__open）— Web / Native 共用。
 * doc 未作成は空バンドル扱い（ensure / 日次バックフィルはしない）。
 */
import { useEffect, useRef, useState } from "react";
import type { Firestore } from "firebase/firestore";
import {
  defaultProfileChartsDivision,
  type ProfileChartsDivision,
  type ProfileOpenChartsAccess,
} from "@/lib/profile/profileChartsDivision";
import {
  emptyProfileChartsBundle,
  type ProfileChartsLast20Point,
  type ProfileChartsRankPoint,
} from "@/lib/profile/profileChartsBundle";
import type { ProfileDailyTrendRow } from "@/lib/profile/profileDailyTrendRow";
import { loadProfileChartsBundleClient } from "@/lib/profile/profileChartsStorage";
import { profileOverviewSeasonKey } from "@/lib/profile/profileOverviewSeason";

export type ProfileOpenChartsState = {
  loading: boolean;
  dailyTrend: ProfileDailyTrendRow[];
  rankTrend: ProfileChartsRankPoint[];
  last20: ProfileChartsLast20Point[];
};

const EMPTY: ProfileOpenChartsState = {
  loading: false,
  dailyTrend: [],
  rankTrend: [],
  last20: [],
};

/**
 * 切替タブの選択。プラン確定後に対象ごと一度だけ既定値（見られるなら PRO LEAGUE）を当てる。
 */
export function useProfileChartsDivision(
  targetUid: string | null | undefined,
  access: ProfileOpenChartsAccess,
  planReady: boolean
): [ProfileChartsDivision, (next: ProfileChartsDivision) => void] {
  const [division, setDivision] = useState<ProfileChartsDivision>("pickup");
  const appliedKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!planReady || !targetUid) return;
    const key = `${targetUid}:${access}`;
    if (appliedKeyRef.current === key) return;
    appliedKeyRef.current = key;
    setDivision(defaultProfileChartsDivision(access));
  }, [targetUid, access, planReady]);

  return [access === "hidden" ? "pickup" : division, setDivision];
}

export function useProfileOpenCharts(
  db: Firestore,
  uid: string | null | undefined,
  enabled: boolean
): ProfileOpenChartsState {
  const [state, setState] = useState<ProfileOpenChartsState>(EMPTY);

  useEffect(() => {
    const safeUid = uid?.trim();
    if (!enabled || !safeUid) {
      setState(EMPTY);
      return;
    }
    let cancelled = false;
    setState({ ...EMPTY, loading: true });
    const seasonKey = profileOverviewSeasonKey();
    void loadProfileChartsBundleClient(db, safeUid, seasonKey, null, "open")
      .then((bundle) => {
        if (cancelled) return;
        const b = bundle ?? emptyProfileChartsBundle(seasonKey);
        setState({
          loading: false,
          dailyTrend: b.dailyTrend ?? [],
          rankTrend: b.rankTrend ?? [],
          last20: b.last20 ?? [],
        });
      })
      .catch(() => {
        if (!cancelled) setState(EMPTY);
      });
    return () => {
      cancelled = true;
    };
  }, [db, uid, enabled]);

  return state;
}
