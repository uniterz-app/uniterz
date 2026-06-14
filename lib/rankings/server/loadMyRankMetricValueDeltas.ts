import type { MyRankMetricValueDeltas } from "@/lib/rankings/myRankMetricValueDeltas";
import type { PlayoffRoundKey } from "@/lib/rankings/playoffRound";
import type { RankingPhase } from "@/lib/rankings/rankingPhase";
import type { RankingLeagueSource } from "@/lib/rankings/rankingLeagueSource";
import { loadRankSnapshotHistoryDocsWalkBack } from "@/lib/rankings/server/loadRankSnapshotHistoryDocs";
import {
  dateKeyJST,
  getYesterdayDateKeyJST,
  RANK_DELTA_PRIOR_MAX_LOOKBACK_DAYS,
  subtractOneDayFromDateKeyJST,
} from "@/lib/rankings/rankSnapshotDate";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { RANK_SNAPSHOT_HISTORY_SUBCOL } from "@/lib/rankings/rankingPhase";
import type { WcRankingStage } from "@/lib/rankings/wcRankingStage";
import { readDailyWcStageBucket } from "@/lib/rankings/dailyWcStageBuckets";

type SnapshotMetricValues = {
  totalPoints?: number;
  totalPrecision?: number;
  totalUpset?: number;
  winRate?: number;
};

type HistoryMetricValuesBlock = {
  play_in?: SnapshotMetricValues;
  playoffs?: SnapshotMetricValues;
  playoffRounds?: Partial<Record<PlayoffRoundKey, SnapshotMetricValues>>;
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
    phase: RankingPhase;
    round: PlayoffRoundKey;
    wcStage: WcRankingStage;
    rankingLeague: RankingLeagueSource;
  }
): SnapshotMetricValues | null {
  const mv = doc?.metricValues;
  if (!mv) return null;
  if (opts.rankingLeague === "worldcup") {
    return mv.wc?.[opts.wcStage] ?? null;
  }
  if (opts.phase === "playoffs" && opts.round !== "overall") {
    return mv.playoffRounds?.[opts.round] ?? null;
  }
  if (opts.phase === "play_in") {
    return mv.play_in ?? null;
  }
  return mv.playoffs ?? null;
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

async function loadPriorHistoryDoc(uid: string) {
  const adminDb = getAdminDb();
  let key = getYesterdayDateKeyJST();
  for (let i = 0; i < RANK_DELTA_PRIOR_MAX_LOOKBACK_DAYS; i++) {
    const snap = await adminDb
      .collection("cumulative_stats")
      .doc(uid)
      .collection(RANK_SNAPSHOT_HISTORY_SUBCOL)
      .doc(key)
      .get();
    if (snap.exists) return snap.data() as HistoryDoc;
    key = subtractOneDayFromDateKeyJST(key);
  }
  return null;
}

/**
 * rankSnapshotHistory の前日 metricValues と現在の myRow を比較。
 * cron が metricValues を書き込んだ doc がある場合のみ非 null を返す（追加 Function クエリなし）。
 */
export async function loadMyRankMetricValueDeltas(
  uid: string,
  current: CurrentRow | null | undefined,
  opts: {
    phase: RankingPhase;
    round: PlayoffRoundKey;
    wcStage: WcRankingStage | null;
    rankingLeague: RankingLeagueSource;
  }
): Promise<MyRankMetricValueDeltas | null> {
  if (!current) return null;

  const priorDoc = await loadPriorHistoryDoc(uid);
  const prior = pickPriorValues(priorDoc ?? undefined, {
    phase: opts.phase,
    round: opts.round,
    wcStage: opts.wcStage ?? "overall",
    rankingLeague: opts.rankingLeague,
  });
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

  const deltas: MyRankMetricValueDeltas = {
    totalPoints: deltaOrNull(pts, prior.totalPoints),
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
