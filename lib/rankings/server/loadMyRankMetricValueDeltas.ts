import type { MyRankMetricValueDeltas } from "@/lib/rankings/myRankMetricValueDeltas";
import {
  CURRENT_NBA_SEASON_KEY,
  previousNbaSeasonKey,
} from "@/lib/rankings/nbaSeason";
import type { RankingLeagueSource } from "@/lib/rankings/rankingLeagueSource";
import { loadMostRecentPriorRankSnapshotHistory } from "@/lib/rankings/server/loadRankSnapshotHistoryDocs";
import { dateKeyJST } from "@/lib/rankings/rankSnapshotDate";
import { getAdminDb } from "@/lib/firebaseAdmin";
import type { WcRankingStage } from "@/lib/rankings/wcRankingStage";
import { readDailyWcStageBucket } from "@/lib/rankings/dailyWcStageBuckets";

type SnapshotMetricValues = {
  totalPoints?: number;
  totalPrecision?: number;
  totalUpset?: number;
  winRate?: number;
};

type HistoryMetricValuesBlock = {
  seasons?: Partial<Record<string, SnapshotMetricValues>>;
  wc?: Partial<Record<WcRankingStage, SnapshotMetricValues>>;
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
  opts: {
    wcStage: WcRankingStage;
    rankingLeague: RankingLeagueSource;
  }
): SnapshotMetricValues | null {
  const mv = doc?.metricValues;
  if (!mv) return null;
  if (opts.rankingLeague === "worldcup") {
    return mv.wc?.[opts.wcStage] ?? null;
  }
  return (
    mv.seasons?.[CURRENT_NBA_SEASON_KEY] ??
    mv.seasons?.[previousNbaSeasonKey(CURRENT_NBA_SEASON_KEY)] ??
    null
  );
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

function safeInt(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
}

function wcDailyBucketFromDoc(
  data: Record<string, unknown>,
  wcStage: WcRankingStage
): Record<string, unknown> {
  const stageBucket = readDailyWcStageBucket(data, wcStage);
  if (Number(stageBucket.posts ?? 0) > 0) {
    return stageBucket as Record<string, unknown>;
  }
  const leagues = (data.leagues ?? {}) as Record<string, unknown>;
  return ((wcStage === "overall" ? leagues.wc : null) ??
    {}) as Record<string, unknown>;
}

function safeNum(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

/** WC 当日の加算分（前日比フォールバック — cumulative が遅延した場合） */
async function wcTodayPointsFromDaily(
  uid: string,
  wcStage: WcRankingStage
): Promise<number | null> {
  const adminDb = getAdminDb();
  const todayKey = dateKeyJST();
  const snap = await adminDb
    .doc(`user_stats_v2_daily/${uid}_${todayKey}`)
    .get();
  if (!snap.exists) return null;
  const data = snap.data() as Record<string, unknown>;
  const pts = safeNum(wcDailyBucketFromDoc(data, wcStage).pointsSumV3);
  if (pts <= 0) return null;
  return pts;
}

/** WC 完全的中の前日比 — 当日 daily の exactHitCount（history の旧スコア精度を使わない） */
async function wcExactHitDayDeltaFromDaily(
  uid: string,
  wcStage: WcRankingStage
): Promise<number | null> {
  const adminDb = getAdminDb();
  const todayKey = dateKeyJST();
  const snap = await adminDb
    .doc(`user_stats_v2_daily/${uid}_${todayKey}`)
    .get();
  if (!snap.exists) return null;
  const data = snap.data() as Record<string, unknown>;
  const inc = safeInt(wcDailyBucketFromDoc(data, wcStage).exactHitCount);
  if (inc === 0) return null;
  return inc;
}

export type PriorSnapshotMetrics = SnapshotMetricValues;

export async function loadPriorSnapshotMetrics(
  uid: string,
  opts: {
    wcStage: WcRankingStage | null;
    rankingLeague: RankingLeagueSource;
  }
): Promise<PriorSnapshotMetrics | null> {
  const prior = await loadMostRecentPriorRankSnapshotHistory(uid);
  return pickPriorValues((prior?.data as HistoryDoc | undefined) ?? undefined, {
    wcStage: opts.wcStage ?? "overall",
    rankingLeague: opts.rankingLeague,
  });
}

/**
 * rankSnapshotHistory の前日 metricValues と現在の myRow を比較。
 * cron が metricValues を書き込んだ doc がある場合のみ非 null を返す（追加 Function クエリなし）。
 */
export async function loadMyRankMetricValueDeltas(
  uid: string,
  current: CurrentRow | null | undefined,
  opts: {
    wcStage: WcRankingStage | null;
    rankingLeague: RankingLeagueSource;
    /** route 側で先に読んだ prior を渡すと二重 read を避けられる */
    priorMetrics?: PriorSnapshotMetrics | null;
  }
): Promise<MyRankMetricValueDeltas | null> {
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

  const totalPrecisionDelta =
    opts.rankingLeague === "worldcup"
      ? await wcExactHitDayDeltaFromDaily(uid, opts.wcStage ?? "overall")
      : deltaOrNull(prec, prior.totalPrecision);

  let totalPointsDelta = deltaOrNull(pts, prior.totalPoints);
  if (
    opts.rankingLeague === "worldcup" &&
    totalPointsDelta == null &&
    prior.totalPoints !== undefined
  ) {
    totalPointsDelta = await wcTodayPointsFromDaily(
      uid,
      opts.wcStage ?? "overall"
    );
  }

  const deltas: MyRankMetricValueDeltas = {
    totalPoints: totalPointsDelta,
    totalPrecision: totalPrecisionDelta,
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
