import { coerceTotalPointsRank } from "@/lib/profile/resolvePlayoffTotalPointsRank";
import type { PlayoffRoundKey } from "@/lib/rankings/playoffRound";
import type { RankingPhase } from "@/lib/rankings/rankingPhase";
import { loadRankSnapshotHistoryDocsWalkBack } from "@/lib/rankings/server/loadRankSnapshotHistoryDocs";

type HistoryDoc = {
  play_in?: Record<string, unknown>;
  playoffs?: Record<string, unknown>;
  playoffRounds?: Partial<Record<string, Record<string, unknown>>>;
};

/**
 * cumulative_stats/{uid}/rankSnapshotHistory から totalPoints 順位（最新日・前日）を読む。
 * プレーオフ通算は playoffs、ラウンド別は playoffRounds.{round}.totalPoints。
 *
 * 最新 2 件の snapshot doc のみ遡って読む（サブコレクション全件 get を避ける）。
 */
export async function loadSnapshotTotalPointsRankAndDelta(
  uid: string,
  phase: RankingPhase,
  round: PlayoffRoundKey
): Promise<{ latestRank: number | null; deltaPlaces: number | null }> {
  const sorted = await loadRankSnapshotHistoryDocsWalkBack(uid, { maxDocs: 2 });
  if (sorted.length === 0) return { latestRank: null, deltaPlaces: null };

  const latest = sorted[sorted.length - 1];
  const prev = sorted.length >= 2 ? sorted[sorted.length - 2] : null;
  if (!latest) return { latestRank: null, deltaPlaces: null };

  const latestData = latest.data as HistoryDoc | undefined;
  const prevData = prev?.data as HistoryDoc | undefined;

  let latestRankRaw: unknown;
  let prevRankRaw: unknown;

  if (phase === "playoffs" && round !== "overall") {
    latestRankRaw = latestData?.playoffRounds?.[round]?.totalPoints;
    prevRankRaw = prevData?.playoffRounds?.[round]?.totalPoints;
  } else if (phase === "play_in") {
    latestRankRaw = latestData?.play_in?.totalPoints;
    prevRankRaw = prevData?.play_in?.totalPoints;
  } else {
    latestRankRaw = latestData?.playoffs?.totalPoints;
    prevRankRaw = prevData?.playoffs?.totalPoints;
  }

  const latestRank = coerceTotalPointsRank(latestRankRaw);
  const prevRank = coerceTotalPointsRank(prevRankRaw);
  if (latestRank == null) return { latestRank: null, deltaPlaces: null };
  const deltaPlaces =
    prevRank != null && prevRank !== latestRank ? prevRank - latestRank : null;

  return { latestRank, deltaPlaces };
}
