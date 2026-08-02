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
    /**
     * parent が trend 解決済み（空でも再取得しない）。
     * seedRows=[] + seedComplete で「データなし」を確定表示する。
     */
    seedComplete?: boolean;
    /**
     * stats 側の trend 取得が終わるまで独立 fetch しない。
     * seed 待ち中の二重取得を防ぐ。
     */
    deferIndependentFetch?: boolean;
    rankingLeague?: RankingLeagueSource;
    wcStage?: WcRankingStage;
    /** NBA overview: season = 現行キー（26-27）レギュラーのみ */
    nbaPeriod?: "season" | "playoffs";
    authReady?: boolean;
  }
) {
  const enabled = options?.enabled ?? true;
  const authReady = options?.authReady ?? true;
  const deferIndependentFetch = options?.deferIndependentFetch ?? false;
  const seedComplete = options?.seedComplete ?? false;
  const nbaPeriod =
    options?.nbaPeriod ??
    ((options?.rankingLeague ?? "nba") === "nba" ? "season" : undefined);
  const trendCtx = resolveProfileDailyTrendContext(
    options?.rankingLeague ?? "nba",
    options?.wcStage,
    nbaPeriod
  );
  const seedRows = options?.seedRows;
  const useSeed =
    Array.isArray(seedRows) &&
    enabled &&
    authReady &&
    (seedRows.length > 0 || seedComplete);

  const [fetchedRows, setFetchedRows] = useState<ProfileDailyTrendRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled || useSeed || !targetUid || !authReady) {
      setFetchedRows([]);
      setLoading(false);
      return;
    }

    if (deferIndependentFetch) {
      setLoading(true);
      return;
    }

    const uid = targetUid;
    const ctx = {
      rankingLeague: trendCtx.rankingLeague,
      wcStage: trendCtx.wcStage,
      ...(trendCtx.nbaPeriod ? { nbaPeriod: trendCtx.nbaPeriod } : {}),
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
    deferIndependentFetch,
    trendCtx.rankingLeague,
    trendCtx.wcStage,
    trendCtx.nbaPeriod,
  ]);

  const sourceRows = useSeed ? seedRows! : fetchedRows;

  const chartData: ProfileDailyTrendRow[] = useMemo(() => {
    return normalizeProfileDailyTrendRows(sourceRows).map((row) => ({
      ...row,
      posts: row.posts ?? 0,
      wins: row.wins ?? 0,
      pointsV3: row.pointsV3 ?? 0,
      exactHitCount: row.exactHitCount ?? 0,
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
