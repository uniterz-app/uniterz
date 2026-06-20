/**
 * Web `useProfileDailyTrendChart` と同等。
 * seed が空のときは API / Firestore から独立取得（自分プロフィール初回の空 seed 問題を回避）。
 */
import { useEffect, useMemo, useState } from "react";
import type { ProfileDailyTrendRow } from "../../../../../lib/profile/profileDailyTrendRow";
import { resolveProfileDailyTrendContext } from "../../../../../lib/profile/userStatsV2ProfileRollup";
import type { RankingLeagueSource } from "../../../../../lib/rankings/rankingLeagueSource";
import type { WcRankingStage } from "../../../../../lib/rankings/wcRankingStage";
import {
  normalizeProfileDailyTrendRows,
  resolveProfileDailyTrend,
} from "./profileApi";

export function useNativeProfileDailyTrendChart(
  targetUid: string | undefined,
  options?: {
    enabled?: boolean;
    /** user-stats から渡すときは Firestore を読まない（空配列は seed とみなさない） */
    seedRows?: ProfileDailyTrendRow[] | null;
    rankingLeague?: RankingLeagueSource;
    wcStage?: WcRankingStage;
    authReady?: boolean;
  }
) {
  const enabled = options?.enabled ?? true;
  const authReady = options?.authReady ?? true;
  const trendCtx = resolveProfileDailyTrendContext(
    options?.rankingLeague ?? "worldcup",
    options?.wcStage
  );
  const seedRows = options?.seedRows;
  const useSeed =
    Array.isArray(seedRows) && seedRows.length > 0 && enabled && authReady;

  const [fetchedRows, setFetchedRows] = useState<ProfileDailyTrendRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled || useSeed || !targetUid || !authReady) {
      setFetchedRows([]);
      setLoading(false);
      return;
    }

    const uid = targetUid;
    const ctx = {
      rankingLeague: trendCtx.rankingLeague,
      wcStage: trendCtx.wcStage,
    };
    let cancelled = false;

    async function run() {
      setLoading(true);
      try {
        const rows = await resolveProfileDailyTrend(uid, ctx, []);
        if (!cancelled) {
          setFetchedRows(normalizeProfileDailyTrendRows(rows));
        }
      } catch {
        if (!cancelled) setFetchedRows([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [
    targetUid,
    enabled,
    useSeed,
    authReady,
    trendCtx.rankingLeague,
    trendCtx.wcStage,
  ]);

  const sourceRows = useSeed ? seedRows! : fetchedRows;

  const chartData: ProfileDailyTrendRow[] = useMemo(() => {
    return normalizeProfileDailyTrendRows(sourceRows).map((row) => ({
      ...row,
      posts: row.posts ?? 0,
      wins: row.wins ?? 0,
      pointsV3: row.pointsV3 ?? 0,
      scorePrecision: row.scorePrecision ?? 0,
      upsetPoints: row.upsetPoints ?? 0,
      winRate: row.winRate ?? (row.posts > 0 ? row.wins / row.posts : 0),
    }));
  }, [sourceRows]);

  return {
    chartData,
    loading: useSeed ? false : loading,
    rawDailyTrend: sourceRows,
  };
}
