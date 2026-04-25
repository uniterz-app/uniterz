// functions/src/rankings/buildCumulativeRankingSnapshot.ts

import { getFirestore, FieldValue } from "firebase-admin/firestore";

/* =========================================================
 * Firestore
 * =======================================================*/
function db() {
  return getFirestore();
}

type Metric =
  | "winRate"
  | "totalPoints"
  | "totalPrecision"
  | "totalUpset"
  | "activeWinStreak";

const MIN_POSTS_FOR_WIN_RATE = 15;

const METRICS: Metric[] = [
  "totalPoints",
  "winRate",
  "totalPrecision",
  "totalUpset",
  "activeWinStreak",
];

type RankingPhase = "play_in" | "playoffs";
type PlayoffRoundKey = "r1" | "r2" | "cf" | "finals";
const PLAYOFF_ROUND_KEYS: PlayoffRoundKey[] = ["r1", "r2", "cf", "finals"];

/**
 * 日次スナップショットで再計算・書き込みするフェーズ。プレーイン終了後は確定表示のため除外する。
 * Next の `RANKING_SNAPSHOT_BUILD_PHASES` と同期すること。
 */
export const SNAPSHOT_BUILD_PHASES: RankingPhase[] = ["playoffs"];

/** Client: list cumulative_stats/{uid}/rankSnapshotHistory ordered by dateKey. */
export const RANK_SNAPSHOT_HISTORY_SUBCOL = "rankSnapshotHistory";

function toDateKeyJST(d: Date) {
  const j = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  const y = j.getUTCFullYear();
  const m = String(j.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(j.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

function getTodayJST(now: Date = new Date()) {
  return toDateKeyJST(now);
}

/** JST の「昨日」の dateKey（履歴 doc id と一致） */
export function getYesterdayDateKeyJST(now: Date = new Date()): string {
  const todayKey = getTodayJST(now);
  const [y, m, d] = todayKey.split("-").map(Number);
  const prev = new Date(Date.UTC(y, m - 1, d - 1));
  const yy = prev.getUTCFullYear();
  const mm = String(prev.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(prev.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

/** Step a JST calendar dateKey (YYYY-MM-DD) back one day (rankSnapshotHistory doc id). */
export function subtractOneDayFromDateKeyJST(dateKey: string): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const prev = new Date(Date.UTC(y, m - 1, d - 1));
  const yy = prev.getUTCFullYear();
  const mm = String(prev.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(prev.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

/** Max days to walk back when yesterday's per-user rank snapshot doc is missing. */
export const RANK_DELTA_PRIOR_MAX_LOOKBACK_DAYS = 30;

/* =========================================================
 * Utils
 * =======================================================*/
/** Leaderboard slice: prefer `rankingByPhase[phase]` when `phase` is set. */
function rankingSlice(d: any, phase?: RankingPhase) {
  if (phase) {
    const byPhase = d.rankingByPhase?.[phase];
    if (byPhase && typeof byPhase === "object") {
      const tp = byPhase.totalPosts ?? 0;
      const tw = byPhase.totalWins ?? 0;
      return {
        totalPosts: tp,
        totalWins: tw,
        winRate: tp > 0 ? tw / tp : byPhase.winRate ?? 0,
        totalPoints: byPhase.totalPoints ?? 0,
        totalPrecision: byPhase.totalPrecision ?? 0,
        totalUpset: byPhase.totalUpset ?? 0,
      };
    }
    return {
      totalPosts: 0,
      totalWins: 0,
      winRate: 0,
      totalPoints: 0,
      totalPrecision: 0,
      totalUpset: 0,
    };
  }
  const rk = d.ranking;
  if (rk && typeof rk === "object") {
    const tp = rk.totalPosts ?? 0;
    const tw = rk.totalWins ?? 0;
    return {
      totalPosts: tp,
      totalWins: tw,
      winRate: tp > 0 ? tw / tp : rk.winRate ?? 0,
      totalPoints: rk.totalPoints ?? 0,
      totalPrecision: rk.totalPrecision ?? 0,
      totalUpset: rk.totalUpset ?? 0,
    };
  }
  const totalPosts = d.totalPosts ?? 0;
  const totalWins = d.totalWins ?? 0;
  return {
    totalPosts,
    totalWins,
    winRate: d.winRate ?? 0,
    totalPoints: d.totalPoints ?? 0,
    totalPrecision: d.totalPrecision ?? 0,
    totalUpset: d.totalUpset ?? 0,
  };
}

function getValue(d: any, metric: Metric, phase: RankingPhase) {
  if (metric === "activeWinStreak") return d.activeWinStreak ?? 0;
  const r = rankingSlice(d, phase);
  if (metric === "winRate") return r.winRate ?? 0;
  if (metric === "totalPoints") return r.totalPoints ?? 0;
  if (metric === "totalPrecision") return r.totalPrecision ?? 0;
  return r.totalUpset ?? 0;
}

type BaseRow = {
  uid: string;
  displayName: string;
  handle: string | null;
  photoURL: string | null;
  countryCode?: string | null;
  plan: "free" | "pro";
  totalPosts: number;
  totalWins: number;
  winRate: number;
  totalPoints: number;
  totalPrecision: number;
  totalUpset: number;
  activeWinStreak: number;
};

function getRowMetricValue(row: BaseRow, metric: Metric): number {
  if (metric === "activeWinStreak") return row.activeWinStreak ?? 0;
  if (metric === "winRate") return row.winRate ?? 0;
  if (metric === "totalPoints") return row.totalPoints ?? 0;
  if (metric === "totalPrecision") return row.totalPrecision ?? 0;
  return row.totalUpset ?? 0;
}

/** Same ordering as snapshot sort (desc). Returns 0 when tied for rank. */
function cmpSortRows(a: BaseRow, b: BaseRow, metric: Metric): number {
  const diff = getRowMetricValue(b, metric) - getRowMetricValue(a, metric);
  if (diff !== 0) return diff;
  if (metric === "winRate") {
    const postsDiff = (b.totalPosts ?? 0) - (a.totalPosts ?? 0);
    if (postsDiff !== 0) return postsDiff;
  }
  return (b.totalPoints ?? 0) - (a.totalPoints ?? 0);
}

/** Matches getCumulativeRanking: rank = 1 + #{ strictly better values }. */
function assignCompetitionRanks(
  sorted: BaseRow[],
  metric: Metric
): Map<string, number> {
  const out = new Map<string, number>();
  let rank = 1;
  for (let i = 0; i < sorted.length; i++) {
    if (
      i > 0 &&
      cmpSortRows(sorted[i - 1]!, sorted[i]!, metric) !== 0
    ) {
      rank = i + 1;
    }
    out.set(sorted[i]!.uid, rank);
  }
  return out;
}

type PhaseRankMap = Partial<Record<Metric, number>>;

/** rankSnapshotHistory / snapshotRanks 用（ラウンド別は playoffs のみ） */
type PriorRankBlock = {
  play_in: PhaseRankMap;
  playoffs: PhaseRankMap;
  playoffRounds: Partial<Record<PlayoffRoundKey, PhaseRankMap>>;
};

type SnapshotRow = BaseRow & {
  rank: number;
  rankDeltaPlaces: number | null;
};

function computeRankDeltaPlaces(
  prevRank: number | null,
  currentRank: number
): number | null {
  if (prevRank == null || currentRank < 1) return null;
  const d = prevRank - currentRank;
  if (d === 0) return null;
  return d;
}

/**
 * For each uid, use the first existing rankSnapshotHistory doc when walking back
 * from startKey (usually yesterday) up to maxLookbackDays days.
 */
async function fetchLatestPriorRankMapsForUids(
  uids: string[],
  startKey: string,
  maxLookbackDays: number
): Promise<Map<string, PriorRankBlock | null>> {
  const out = new Map<string, PriorRankBlock | null>();
  if (uids.length === 0) return out;

  const pending = new Set(uids);
  let key = startKey;
  const firestore = db();
  const CHUNK = 200;

  for (let day = 0; day < maxLookbackDays && pending.size > 0; day++) {
    const chunkList = [...pending];
    for (let i = 0; i < chunkList.length; i += CHUNK) {
      const chunk = chunkList.slice(i, i + CHUNK);
      const refs = chunk.map((uid) =>
        firestore
          .collection("cumulative_stats")
          .doc(uid)
          .collection(RANK_SNAPSHOT_HISTORY_SUBCOL)
          .doc(key)
      );
      const snaps = await firestore.getAll(...refs);
      snaps.forEach((s, j) => {
        const uid = chunk[j]!;
        if (!pending.has(uid)) return;
        if (s.exists) {
          const d = s.data() as {
            play_in?: PhaseRankMap;
            playoffs?: PhaseRankMap;
            playoffRounds?: Partial<Record<PlayoffRoundKey, PhaseRankMap>>;
          };
          out.set(uid, {
            play_in: (d?.play_in ?? {}) as PhaseRankMap,
            playoffs: (d?.playoffs ?? {}) as PhaseRankMap,
            playoffRounds: (d?.playoffRounds ??
              {}) as Partial<Record<PlayoffRoundKey, PhaseRankMap>>,
          });
          pending.delete(uid);
        }
      });
    }
    key = subtractOneDayFromDateKeyJST(key);
  }

  for (const uid of pending) {
    out.set(uid, null);
  }
  return out;
}

/**
 * 日次スナップショット doc が無い/空のとき、getCumulativeRanking が一覧を出せるよう
 * cumulative_stats からラウンド別 Top20 をその場で算出する。
 */
export async function loadPlayoffRoundTop20RowsLive(
  round: PlayoffRoundKey,
  metric: Metric
): Promise<SnapshotRow[]> {
  const snap = await db().collection("cumulative_stats").get();
  const baseRows: BaseRow[] = snap.docs
    .map((doc) => {
      const d = doc.data();
      const rr = d.rankingByPlayoffRound?.[round];
      const tp = rr?.totalPosts ?? 0;
      const tw = rr?.totalWins ?? 0;
      return {
        uid: doc.id,
        displayName: d.displayName ?? "user",
        handle: d.handle ?? null,
        photoURL: d.photoURL ?? null,
        countryCode: d.countryCode ?? null,
        plan: (d.plan === "pro" ? "pro" : "free") as BaseRow["plan"],
        totalPosts: tp,
        totalWins: tw,
        winRate: tp > 0 ? tw / tp : rr?.winRate ?? 0,
        totalPoints: rr?.totalPoints ?? 0,
        totalPrecision: rr?.totalPrecision ?? 0,
        totalUpset: rr?.totalUpset ?? 0,
        activeWinStreak: d.activeWinStreak ?? 0,
      };
    })
    .filter((row) => (row.totalPosts ?? 0) > 0);

  const eligibleRows =
    metric === "winRate"
      ? baseRows.filter(
          (row) => (row.totalPosts ?? 0) >= MIN_POSTS_FOR_WIN_RATE
        )
      : baseRows;
  const sortedFull = [...eligibleRows].sort((a, b) =>
    cmpSortRows(a, b, metric)
  );
  const ranks = assignCompetitionRanks(sortedFull, metric);
  return sortedFull.slice(0, 20).map((row) => ({
    ...row,
    rank: ranks.get(row.uid) ?? 0,
    rankDeltaPlaces: null,
  }));
}

/* =========================================================
 * Main
 * =======================================================*/
export async function buildCumulativeRankingSnapshot() {
  const snap = await db().collection("cumulative_stats").get();

  const rankByUid = new Map<
    string,
    { play_in: PhaseRankMap; playoffs: PhaseRankMap }
  >();

  function ensure(uid: string) {
    if (!rankByUid.has(uid)) {
      rankByUid.set(uid, { play_in: {}, playoffs: {} });
    }
    return rankByUid.get(uid)!;
  }

  type Top20Job = {
    phase: RankingPhase;
    metric: Metric;
    rows: Array<BaseRow & { rank: number }>;
  };
  const top20Jobs: Top20Job[] = [];
  const topUidSet = new Set<string>();

  for (const phase of SNAPSHOT_BUILD_PHASES) {
    const baseRows: BaseRow[] = snap.docs
      .map((doc) => {
        const d = doc.data();
        const r = rankingSlice(d, phase);

        return {
          uid: doc.id,
          displayName: d.displayName ?? "user",
          handle: d.handle ?? null,
          photoURL: d.photoURL ?? null,
          countryCode: d.countryCode ?? null,
          plan: (d.plan === "pro" ? "pro" : "free") as BaseRow["plan"],

          totalPosts: r.totalPosts,
          totalWins: r.totalWins,
          winRate: r.winRate,

          totalPoints: r.totalPoints,
          totalPrecision: r.totalPrecision,
          totalUpset: r.totalUpset,
          activeWinStreak: d.activeWinStreak ?? 0,
        };
      })
      .filter((row) => (row.totalPosts ?? 0) > 0);

    for (const metric of METRICS) {
      const eligibleRows =
        metric === "winRate"
          ? baseRows.filter((row) => (row.totalPosts ?? 0) >= MIN_POSTS_FOR_WIN_RATE)
          : baseRows;
      const sortedFull = [...eligibleRows].sort((a, b) =>
        cmpSortRows(a, b, metric)
      );
      const ranks = assignCompetitionRanks(sortedFull, metric);

      for (const [uid, rank] of ranks) {
        ensure(uid)[phase][metric] = rank;
      }

      const top20 = sortedFull.slice(0, 20).map((row) => ({
        ...row,
        rank: ranks.get(row.uid) ?? 0,
      }));
      for (const r of top20) {
        topUidSet.add(r.uid);
      }
      top20Jobs.push({ phase, metric, rows: top20 });
    }
  }

  type RoundTop20Job = {
    round: PlayoffRoundKey;
    metric: Metric;
    rows: Array<BaseRow & { rank: number }>;
  };
  const roundTop20Jobs: RoundTop20Job[] = [];
  const rankByUidPlayoffRound = new Map<
    string,
    Partial<Record<PlayoffRoundKey, PhaseRankMap>>
  >();

  function ensurePlayoffRound(uid: string) {
    if (!rankByUidPlayoffRound.has(uid)) {
      rankByUidPlayoffRound.set(uid, {});
    }
    return rankByUidPlayoffRound.get(uid)!;
  }

  for (const round of PLAYOFF_ROUND_KEYS) {
    const baseRows: BaseRow[] = snap.docs
      .map((doc) => {
        const d = doc.data();
        const rr = d.rankingByPlayoffRound?.[round];
        const tp = rr?.totalPosts ?? 0;
        const tw = rr?.totalWins ?? 0;
        return {
          uid: doc.id,
          displayName: d.displayName ?? "user",
          handle: d.handle ?? null,
          photoURL: d.photoURL ?? null,
          countryCode: d.countryCode ?? null,
          plan: (d.plan === "pro" ? "pro" : "free") as BaseRow["plan"],
          totalPosts: tp,
          totalWins: tw,
          winRate: tp > 0 ? tw / tp : rr?.winRate ?? 0,
          totalPoints: rr?.totalPoints ?? 0,
          totalPrecision: rr?.totalPrecision ?? 0,
          totalUpset: rr?.totalUpset ?? 0,
          activeWinStreak: d.activeWinStreak ?? 0,
        };
      })
      .filter((row) => (row.totalPosts ?? 0) > 0);

    for (const metric of METRICS) {
      const eligibleRows =
        metric === "winRate"
          ? baseRows.filter((row) => (row.totalPosts ?? 0) >= MIN_POSTS_FOR_WIN_RATE)
          : baseRows;
      const sortedFull = [...eligibleRows].sort((a, b) =>
        cmpSortRows(a, b, metric)
      );
      const ranks = assignCompetitionRanks(sortedFull, metric);
      for (const [uid, rank] of ranks) {
        const slot = ensurePlayoffRound(uid);
        if (!slot[round]) slot[round] = {};
        slot[round]![metric] = rank;
      }
      const top20 = sortedFull.slice(0, 20).map((row) => ({
        ...row,
        rank: ranks.get(row.uid) ?? 0,
      }));
      for (const r of top20) {
        topUidSet.add(r.uid);
      }
      roundTop20Jobs.push({ round, metric, rows: top20 });
    }
  }

  const yesterdayKey = getYesterdayDateKeyJST();
  const prevByUid = await fetchLatestPriorRankMapsForUids(
    [...topUidSet],
    yesterdayKey,
    RANK_DELTA_PRIOR_MAX_LOOKBACK_DAYS
  );

  for (const { phase, metric, rows } of top20Jobs) {
    const enriched: SnapshotRow[] = rows.map((row) => {
      const prevBlock = prevByUid.get(row.uid);
      const prevRaw = prevBlock?.[phase]?.[metric];
      const prevRank =
        typeof prevRaw === "number" &&
        Number.isFinite(prevRaw) &&
        prevRaw >= 1
          ? Math.floor(prevRaw)
          : null;
      return {
        ...row,
        rankDeltaPlaces: computeRankDeltaPlaces(prevRank, row.rank),
      };
    });

    await db()
      .collection("cumulative_ranking_snapshots")
      .doc(`${phase}_${metric}`)
      .set(
        {
          phase,
          metric,
          rows: enriched,
          updatedAt: FieldValue.serverTimestamp(),
          rankDeltaBasisDateKey: yesterdayKey,
        },
        { merge: true }
      );
  }

  for (const { round, metric, rows } of roundTop20Jobs) {
    const enriched: SnapshotRow[] = rows.map((row) => {
      const prevBlock = prevByUid.get(row.uid);
      const prevRaw = prevBlock?.playoffRounds?.[round]?.[metric];
      const prevRank =
        typeof prevRaw === "number" &&
        Number.isFinite(prevRaw) &&
        prevRaw >= 1
          ? Math.floor(prevRaw)
          : null;
      return {
        ...row,
        rankDeltaPlaces: computeRankDeltaPlaces(prevRank, row.rank),
      };
    });

    await db()
      .collection("cumulative_ranking_snapshots")
      .doc(`playoffs_${round}_${metric}`)
      .set(
        {
          phase: "playoffs",
          round,
          metric,
          rows: enriched,
          updatedAt: FieldValue.serverTimestamp(),
          rankDeltaBasisDateKey: yesterdayKey,
        },
        { merge: true }
      );
  }

  const firestore = db();
  const dateKey = getTodayJST();
  let batch = firestore.batch();
  let ops = 0;

  const flush = async () => {
    if (ops > 0) {
      await batch.commit();
      batch = firestore.batch();
      ops = 0;
    }
  };

  for (const [uid, per] of rankByUid) {
    const playoffRounds = rankByUidPlayoffRound.get(uid) ?? {};
    /**
     * merge のネストは play_in を消さないよう、更新するフィールドだけドットパスで書く。
     * （プレーインは SNAPSHOT_BUILD_PHASES 外のため per.play_in は空のまま）
     */
    batch.set(
      firestore.doc(`cumulative_stats/${uid}`),
      {
        "snapshotRanks.updatedAt": FieldValue.serverTimestamp(),
        "snapshotRanks.playoffs": per.playoffs,
        "snapshotRanks.playoffRounds": playoffRounds,
      },
      { merge: true }
    );
    batch.set(
      firestore
        .collection("cumulative_stats")
        .doc(uid)
        .collection(RANK_SNAPSHOT_HISTORY_SUBCOL)
        .doc(dateKey),
      {
        dateKey,
        playoffs: per.playoffs,
        playoffRounds,
        writtenAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    ops += 2;
    if (ops >= 500) {
      await flush();
    }
  }
  await flush();

  return {
    ok: true,
    metrics: METRICS.length,
    ranksWritten: rankByUid.size,
    historyDateKey: dateKey,
    rankDeltaBasisDateKey: yesterdayKey,
  };
}
