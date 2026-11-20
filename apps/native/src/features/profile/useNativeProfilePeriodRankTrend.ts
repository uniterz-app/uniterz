/**
 * プロフィール Ranking Progress の WEEKLY / MONTHLY データ。
 * SEASON のときは何も取らない（既存の日次シリーズを使う）。
 * 同じ（uid・期間・部門）は 60 秒メモリに持つ（タブを行き来しても再取得しない）。
 */
import { useEffect, useState } from "react";
import {
  fetchProfilePeriodRankTrend,
  type RankPlayoffTrendPointNative,
} from "./profileApi";

export type ProfileRankTrendPeriod = "weekly" | "monthly";

const CACHE_TTL_MS = 60_000;
const cache = new Map<
  string,
  { at: number; points: RankPlayoffTrendPointNative[] }
>();

function cacheKey(
  uid: string,
  period: ProfileRankTrendPeriod,
  division: "pickup" | "open"
): string {
  return `${uid}:${period}:${division}`;
}

export function useNativeProfilePeriodRankTrend(opts: {
  uid: string;
  /** null のときは取得しない（SEASON 表示中・非 NBA など） */
  period: ProfileRankTrendPeriod | null;
  division: "pickup" | "open";
}): { points: RankPlayoffTrendPointNative[]; loading: boolean } {
  const { uid, period, division } = opts;
  const key = period ? cacheKey(uid, period, division) : null;
  const [state, setState] = useState<{
    key: string | null;
    points: RankPlayoffTrendPointNative[];
  }>({ key: null, points: [] });

  useEffect(() => {
    if (!key || !period || !uid.trim()) return;
    const hit = cache.get(key);
    if (hit && Date.now() - hit.at < CACHE_TTL_MS) {
      setState({ key, points: hit.points });
      return;
    }
    let cancelled = false;
    void fetchProfilePeriodRankTrend(uid, period, division)
      .catch(() => [] as RankPlayoffTrendPointNative[])
      .then((points) => {
        if (points.length > 0) cache.set(key, { at: Date.now(), points });
        if (!cancelled) setState({ key, points });
      });
    return () => {
      cancelled = true;
    };
  }, [key, period, uid, division]);

  /** 取得完了した key が今の key と一致するまでは loading */
  const loading = key != null && state.key !== key;
  return { points: key != null && state.key === key ? state.points : [], loading };
}
