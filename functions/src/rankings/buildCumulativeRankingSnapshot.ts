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

const METRICS: Metric[] = [
  "totalPoints",
  "winRate",
  "totalPrecision",
  "totalUpset",
  "activeWinStreak",
];

type RankingPhase = "play_in" | "playoffs";
const RANKING_PHASES: RankingPhase[] = ["play_in", "playoffs"];

/** Client: list cumulative_stats/{uid}/rankSnapshotHistory ordered by dateKey. */
export const RANK_SNAPSHOT_HISTORY_SUBCOL = "rankSnapshotHistory";

function toDateKeyJST(d: Date) {
  const j = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  const y = j.getUTCFullYear();
  const m = String(j.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(j.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

function getTodayJST() {
  return toDateKeyJST(new Date());
}


/* =========================================================
 * Utils
 * =======================================================*/
/** ランキング掲載用。phase 指定時は rankingByPhase を優先 */
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

  for (const phase of RANKING_PHASES) {
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
      const sortedFull = [...baseRows].sort((a, b) =>
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

      await db()
        .collection("cumulative_ranking_snapshots")
        .doc(`${phase}_${metric}`)
        .set(
          {
            phase,
            metric,
            rows: top20,
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
    }
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
    batch.set(
      firestore.doc(`cumulative_stats/${uid}`),
      {
        snapshotRanks: {
          updatedAt: FieldValue.serverTimestamp(),
          play_in: per.play_in,
          playoffs: per.playoffs,
        },
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
        play_in: per.play_in,
        playoffs: per.playoffs,
        writtenAt: FieldValue.serverTimestamp(),
      }
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
  };
}