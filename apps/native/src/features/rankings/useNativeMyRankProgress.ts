/**
 * Web `useMyRankProgress` 相当。
 * seedComplete 時は API を打たず seedPoints を使う。
 */
import { useEffect, useState } from "react";
import type { MyRankProgressPoint } from "../../../../../lib/rankings/myRankRankingProgress";
import type { RankingLeagueSource } from "../../../../../lib/rankings/rankingLeagueSource";
import { fetchRankPlayoffTrend } from "../profile/profileApi";

const CACHE_TTL_MS = 5 * 60 * 1000;

const cache = new Map<string, { at: number; points: MyRankProgressPoint[] }>();

function cacheKey(input: {
  uid: string;
  rankingLeague: RankingLeagueSource;
}): string {
  return [input.uid, input.rankingLeague].join(":");
}

export function useNativeMyRankProgress(input: {
  uid: string | null | undefined;
  enabled: boolean;
  rankingLeague: RankingLeagueSource;
  wcStage?: unknown;
  seedPoints?: MyRankProgressPoint[] | null;
  seedComplete?: boolean;
}): { points: MyRankProgressPoint[] | null; loading: boolean } {
  const { uid, enabled, rankingLeague } = input;
  const seedComplete = input.seedComplete === true;
  const seedPoints = input.seedPoints;

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

    if (seedComplete) {
      setState({
        key: cacheKey({ uid, rankingLeague }),
        points: seedPoints ?? [],
        loading: false,
      });
      return;
    }

    const key = cacheKey({ uid, rankingLeague });
    const cached = cache.get(key);
    if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
      setState({ key, points: cached.points, loading: false });
      return;
    }

    let aborted = false;
    setState({ key, points: null, loading: true });

    void (async () => {
      try {
        const rows = await fetchRankPlayoffTrend(uid, { rankingLeague });
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
  }, [enabled, uid, rankingLeague, seedComplete, seedPoints]);

  return { points: state.points, loading: state.loading };
}
