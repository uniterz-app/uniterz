import type { MyRankMetricValueDeltas } from "@/lib/rankings/myRankMetricValueDeltas";
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";
import type { RankingLeagueSource } from "@/lib/rankings/rankingLeagueSource";
import { loadMostRecentPriorRankSnapshotHistory } from "@/lib/rankings/server/loadRankSnapshotHistoryDocs";

type SnapshotMetricValues = {
  totalPoints?: number;
  totalPrecision?: number;
  totalUpset?: number;
  winRate?: number;
};

type HistoryMetricValuesBlock = {
  seasons?: Partial<Record<string, SnapshotMetricValues>>;
};

type HistoryDoc = {
  metricValues?: HistoryMetricValuesBlock;
};

type CurrentRow = {
  totalPoints?: number;
  totalPrecision?: number;
  totalUpset?: number;
  winRate?: number;
};

function pickPriorValues(
  doc: HistoryDoc | undefined,
  _opts: { rankingLeague: RankingLeagueSource }
): SnapshotMetricValues | null {
  const mv = doc?.metricValues;
  if (!mv) return null;
  return mv.seasons?.[CURRENT_NBA_SEASON_KEY] ?? null;
}

function winRateAsPct(raw: number | undefined): number {
  const v = raw ?? 0;
  return v <= 1 ? v * 100 : v;
}

function deltaOrNull(current: number, prior: number | undefined): number | null {
  if (prior === undefined || !Number.isFinite(prior)) return null;
  const d = current - prior;
  if (!Number.isFinite(d) || Math.abs(d) < 1e-9) return null;
  return d;
}

export type PriorSnapshotMetrics = SnapshotMetricValues;

export async function loadPriorSnapshotMetrics(
  uid: string,
  opts: { rankingLeague: RankingLeagueSource }
): Promise<PriorSnapshotMetrics | null> {
  const prior = await loadMostRecentPriorRankSnapshotHistory(uid);
  return pickPriorValues((prior?.data as HistoryDoc | undefined) ?? undefined, opts);
}

/**
 * rankSnapshotHistory の前日 metricValues と現在の myRow を比較。
 * cron が metricValues を書き込んだ doc がある場合のみ非 null を返す（追加 Function クエリなし）。
 */
export async function loadMyRankMetricValueDeltas(
  uid: string,
  current: CurrentRow | null | undefined,
  opts: {
    rankingLeague: RankingLeagueSource;
    /** route 側で先に読んだ prior を渡すと二重 read を避けられる */
    priorMetrics?: PriorSnapshotMetrics | null;
  }
): Promise<MyRankMetricValueDeltas | null> {
  void uid;
  if (!current) return null;

  const prior =
    opts.priorMetrics !== undefined
      ? opts.priorMetrics
      : await loadPriorSnapshotMetrics(uid, opts);
  if (!prior) return null;

  const pts = current.totalPoints ?? 0;
  const prec = current.totalPrecision ?? 0;
  const upset = current.totalUpset ?? 0;
  const winPct = winRateAsPct(current.winRate);
  const priorWinPct = winRateAsPct(prior.winRate);

  const deltas: MyRankMetricValueDeltas = {
    totalPoints: deltaOrNull(pts, prior.totalPoints),
    totalPrecision: deltaOrNull(prec, prior.totalPrecision),
    totalUpset: deltaOrNull(upset, prior.totalUpset),
    winRate: deltaOrNull(winPct, priorWinPct),
  };

  if (
    deltas.totalPoints == null &&
    deltas.totalPrecision == null &&
    deltas.totalUpset == null &&
    deltas.winRate == null
  ) {
    return null;
  }

  return deltas;
}
