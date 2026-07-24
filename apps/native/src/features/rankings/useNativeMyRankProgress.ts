/**
 * Web `useMyRankProgress` 相当。
 * `/api/profile/rank-playoff-trend` から総合得点順位の日次推移を取得する。
 */
import { useEffect, useState } from "react";
import type { MyRankProgressPoint } from "../../../../../lib/rankings/myRankRankingProgress";
import type { RankingLeagueSource } from "../../../../../lib/rankings/rankingLeagueSource";
import type { WcRankingStage } from "../../../../../lib/rankings/wcRankingStage";
import { fetchRankPlayoffTrend } from "../profile/profileApi";

const CACHE_TTL_MS = 5 * 60 * 1000;

const cache = new Map<string, { at: number; points: MyRankProgressPoint[] }>();

function cacheKey(input: {
  uid: string;
  rankingLeague: RankingLeagueSource;
  wcStage: WcRankingStage | null;
}): string {
  return [input.uid, input.rankingLeague, input.wcStage ?? "-"].join(":");
}

export function useNativeMyRankProgress(input: {
  uid: string | null | undefined;
  enabled: boolean;
  rankingLeague: RankingLeagueSource;
  wcStage?: WcRankingStage | null;
}): { points: MyRankProgressPoint[] | null; loading: boolean } {
  const { uid, enabled, rankingLeague } = input;
  const wcStage = input.wcStage ?? null;

  const [state, setState] = useState<{
    key: string | null;
    points: MyRankProgressPoint[] | null;
    loading: boolean;
  }>({ key: null, points: null, loading: false });

  useEffect(() => {
    if (!enabled || !uid) {
      setState({ key: null, points: null, loading: false });
      return;
    }

    const key = cacheKey({ uid, rankingLeague, wcStage });
    const cached = cache.get(key);
    if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
      setState({ key, points: cached.points, loading: false });
      return;
    }

    let aborted = false;
    setState({ key, points: null, loading: true });

    void (async () => {
      try {
        const rows = await fetchRankPlayoffTrend(uid, {
          rankingLeague,
          wcStage: rankingLeague === "worldcup" ? (wcStage ?? "overall") : undefined,
        });
        const points: MyRankProgressPoint[] = rows.map((r) => ({
          dateKey: r.dateKey,
          rank: r.rank,
        }));
        cache.set(key, { at: Date.now(), points });
        if (!aborted) setState({ key, points, loading: false });
      } catch {
        if (!aborted) setState({ key, points: [], loading: false });
      }
    })();

    return () => {
      aborted = true;
    };
  }, [enabled, uid, rankingLeague, wcStage]);

  return { points: state.points, loading: state.loading };
}
