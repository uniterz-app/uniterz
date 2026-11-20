/**
 * プロフィール RANKING PROGRESS の WEEKLY / MONTHLY 用。
 * period_ranking_snapshots（Functions cron が日次生成。過去期間は更新されない）から、
 * 現シーズンの直近 N 期間ぶんの「総合得点順位」を自分の分だけ読む。
 *
 * ranks は全参加者ぶんの map（1 doc 約 30KB）なので、必ず自分の uid だけ fieldMask で読む。
 * 現在の期間の doc は日次で更新されるので、最後の点が「今の順位」になる。
 */
import { FieldPath } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebaseAdmin";
import {
  periodRankingSnapshotDocId,
  type RankingDivision,
} from "@/lib/rankings/rankingDivision";
import { listRankingPeriodLabels } from "@/lib/rankings/rankingPeriod";

/** Pro の最大表示数（Free はクライアントで末尾 3 件に絞る） */
export const PERIOD_RANK_TREND_MAX_POINTS = 10;

export type PeriodRankTrendPoint = {
  /** weekly: 週初めの月曜 YYYY-MM-DD / monthly: YYYY-MM */
  label: string;
  rank: number;
};

export async function loadPeriodRankTrend(opts: {
  uid: string;
  period: "weekly" | "monthly";
  division: RankingDivision;
  limit?: number;
}): Promise<PeriodRankTrendPoint[]> {
  const limit = Math.min(
    PERIOD_RANK_TREND_MAX_POINTS,
    Math.max(1, Math.floor(opts.limit ?? PERIOD_RANK_TREND_MAX_POINTS))
  );
  /** 新しい順 */
  const labels = listRankingPeriodLabels(opts.period, { limit });
  if (labels.length === 0) return [];

  const db = getAdminDb();
  const refs = labels.map((label) =>
    db.collection("period_ranking_snapshots").doc(
      periodRankingSnapshotDocId({
        division: opts.division,
        period: opts.period,
        label,
        metric: "totalPoints",
      })
    )
  );
  const rankPath = new FieldPath("ranks", opts.uid);
  const snaps = await db.getAll(...refs, { fieldMask: [rankPath] });

  const points: PeriodRankTrendPoint[] = [];
  snaps.forEach((snap, i) => {
    if (!snap.exists) return;
    const rank = snap.get(rankPath);
    if (typeof rank !== "number" || !Number.isFinite(rank) || rank < 1) return;
    points.push({ label: labels[i]!, rank });
  });
  /** 古い順（チャートは左が過去） */
  return points.reverse();
}
