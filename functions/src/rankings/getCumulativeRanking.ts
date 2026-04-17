// functions/src/rankings/getCumulativeRanking.ts

import { onRequest } from "firebase-functions/v2/https";
import type { DocumentSnapshot } from "firebase-admin/firestore";
import { getFirestore, FieldPath } from "firebase-admin/firestore";
import {
  getYesterdayDateKeyJST,
  RANK_SNAPSHOT_HISTORY_SUBCOL,
} from "./buildCumulativeRankingSnapshot";

function db() {
  return getFirestore();
}

type Metric =
  | "winRate"
  | "totalPoints"
  | "totalPrecision"
  | "totalUpset"
  | "activeWinStreak";

type RankingPhase = "play_in" | "playoffs";

type RankingRow = {
  uid: string;
  displayName: string;
  handle: string | null;
  photoURL: string | null;
  countryCode?: string | null;
  plan?: "free" | "pro";

  totalPosts: number;
  totalWins: number;
  winRate: number;

  totalPoints: number;
  totalPrecision: number;
  totalUpset: number;
  activeWinStreak: number;

  rank: number;
  rankDeltaPlaces?: number | null;
};

function isMetric(v: unknown): v is Metric {
  return (
    v === "winRate" ||
    v === "totalPoints" ||
    v === "totalPrecision" ||
    v === "totalUpset" ||
    v === "activeWinStreak"
  );
}

function isRankingPhase(v: unknown): v is RankingPhase {
  return v === "play_in" || v === "playoffs";
}

function rankingSlice(d: any, phase: RankingPhase) {
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

type UserRankingSnaps = {
  mySnap: DocumentSnapshot | null;
  histSnap: DocumentSnapshot | null;
};

async function loadUserRankingSnaps(uid: string | undefined): Promise<UserRankingSnaps> {
  if (!uid) return { mySnap: null, histSnap: null };
  const mySnap = await db().collection("cumulative_stats").doc(uid).get();
  if (!mySnap.exists) return { mySnap, histSnap: null };
  const yKey = getYesterdayDateKeyJST();
  const histSnap = await db()
    .collection("cumulative_stats")
    .doc(uid)
    .collection(RANK_SNAPSHOT_HISTORY_SUBCOL)
    .doc(yKey)
    .get();
  return { mySnap, histSnap };
}

function parseMetricsParam(raw: unknown): Metric[] | null {
  if (typeof raw !== "string" || !raw.trim()) return null;
  const parts = raw.split(",").map((s) => s.trim()).filter(Boolean);
  const out: Metric[] = [];
  for (const p of parts) {
    if (isMetric(p)) out.push(p);
  }
  if (out.length === 0) return null;
  return [...new Set(out)];
}

type MetricPayload = {
  count: number;
  rows: RankingRow[];
  myRank: number | null;
  myRow: RankingRow | null;
  myRankDeltaPlaces: number | null;
};

async function rankingPayloadForMetric(
  metric: Metric,
  phase: RankingPhase,
  uid: string | undefined,
  snaps: UserRankingSnaps
): Promise<MetricPayload> {
  const snapDoc = await db()
    .collection("cumulative_ranking_snapshots")
    .doc(`${phase}_${metric}`)
    .get();

  const rawRows: RankingRow[] = snapDoc.exists
    ? (snapDoc.data()?.rows ?? [])
    : [];
  let rows: RankingRow[] = rawRows.map((row) => ({
    ...row,
    plan: row.plan === "pro" ? "pro" : "free",
  }));

  const missingPlanUids = rawRows
    .filter((r) => r?.uid && r.plan !== "pro" && r.plan !== "free")
    .map((r) => r.uid as string);
  const rowUids = [...new Set(missingPlanUids)];
  const planByUid = new Map<string, "free" | "pro">();
  if (rowUids.length > 0) {
    const refs = rowUids.map((id) => db().collection("users").doc(id));
    const userSnaps = await db().getAll(...refs);
    userSnaps.forEach((s, i) => {
      const id = rowUids[i];
      if (!id) return;
      if (!s.exists) {
        planByUid.set(id, "free");
        return;
      }
      const u = s.data() as { plan?: string };
      planByUid.set(id, u?.plan === "pro" ? "pro" : "free");
    });
    rows = rows.map((r) => ({
      ...r,
      plan: planByUid.get(r.uid) ?? r.plan,
    }));
  }

  // 住んでいる国は users が最新（プロフィール保存直後も国旗表示できるよう反映）
  const rowUidsForCountry = [
    ...new Set(rows.map((r) => r.uid).filter(Boolean)),
  ] as string[];
  if (uid && !rowUidsForCountry.includes(uid)) {
    rowUidsForCountry.push(uid);
  }
  const countryByUid = new Map<string, string | null | undefined>();
  if (rowUidsForCountry.length > 0) {
    const userRefs = rowUidsForCountry.map((id) =>
      db().collection("users").doc(id)
    );
    const countrySnaps = await db().getAll(...userRefs);
    countrySnaps.forEach((s, i) => {
      const id = rowUidsForCountry[i];
      if (!id) return;
      if (!s.exists) {
        countryByUid.set(id, undefined);
        return;
      }
      const u = s.data() as { countryCode?: unknown };
      const raw = u?.countryCode;
      const c =
        typeof raw === "string" && raw.trim() !== ""
          ? raw.trim().slice(0, 8)
          : null;
      countryByUid.set(id, c);
    });
    rows = rows.map((r) => {
      const v = countryByUid.get(r.uid);
      if (v === undefined) return r;
      return { ...r, countryCode: v };
    });
  }

  let myRank: number | null = null;
  let myRow: RankingRow | null = null;
  let myRankDeltaPlaces: number | null = null;

  if (uid && snaps.mySnap?.exists) {
    const mySnap = snaps.mySnap;
    const me = mySnap.data() as any;
    const rk = rankingSlice(me, phase);

    if ((rk.totalPosts ?? 0) <= 0) {
      return {
        count: rows.length,
        rows,
        myRank: null,
        myRow: null,
        myRankDeltaPlaces: null,
      };
    }

    const storedRankRaw = me.snapshotRanks?.[phase]?.[metric];
    const storedRank =
      typeof storedRankRaw === "number" &&
      Number.isFinite(storedRankRaw) &&
      storedRankRaw >= 1
        ? Math.floor(storedRankRaw)
        : null;

    if (storedRank != null) {
      myRank = storedRank;
    } else {
      const myValue =
        metric === "activeWinStreak"
          ? me.activeWinStreak ?? 0
          : metric === "winRate"
            ? rk.winRate ?? 0
            : rk[metric] ?? 0;

      const hasRankingObj =
        me.rankingByPhase?.[phase] &&
        typeof me.rankingByPhase[phase] === "object" &&
        (me.rankingByPhase[phase].totalPosts != null ||
          me.rankingByPhase[phase].totalPoints != null);

      const rankField =
        metric === "activeWinStreak"
          ? new FieldPath("activeWinStreak")
          : hasRankingObj
            ? metric === "winRate"
              ? new FieldPath("rankingByPhase", phase, "winRate")
              : new FieldPath("rankingByPhase", phase, metric)
            : metric === "winRate"
              ? "winRate"
              : metric;

      const higherSnap = await db()
        .collection("cumulative_stats")
        .where(rankField as any, ">", myValue)
        .count()
        .get();

      myRank = (higherSnap.data().count ?? 0) + 1;
    }

    const histSnap = snaps.histSnap;
    if (histSnap?.exists && myRank != null) {
      const hd = histSnap.data() as Record<string, unknown> | undefined;
      const phaseBlock = hd?.[phase] as
        | Partial<Record<Metric, number>>
        | undefined;
      const prevRaw = phaseBlock?.[metric];
      const prevRank =
        typeof prevRaw === "number" &&
        Number.isFinite(prevRaw) &&
        prevRaw >= 1
          ? Math.floor(prevRaw)
          : null;
      if (prevRank != null) {
        const d = prevRank - myRank;
        if (d !== 0) {
          myRankDeltaPlaces = d;
        }
      }
    }

    const myPlanResolved: "free" | "pro" =
      me.plan === "pro" ? "pro" : "free";

    const myCountryFresh = uid ? countryByUid.get(uid) : undefined;

    myRow = {
      uid,
      displayName: me.displayName ?? "",
      handle: me.handle ?? null,
      photoURL: me.photoURL ?? null,
      countryCode:
        myCountryFresh !== undefined
          ? myCountryFresh
          : (me.countryCode ?? null),
      plan: myPlanResolved,

      totalPosts: rk.totalPosts,
      totalWins: rk.totalWins,
      winRate: rk.winRate,

      totalPoints: rk.totalPoints,
      totalPrecision: rk.totalPrecision,
      totalUpset: rk.totalUpset,
      activeWinStreak: me.activeWinStreak ?? 0,

      rank: myRank,
      rankDeltaPlaces: myRankDeltaPlaces,
    };
  }

  return {
    count: rows.length,
    rows,
    myRank,
    myRow,
    myRankDeltaPlaces,
  };
}

export const getCumulativeRanking = onRequest(async (req, res) => {
  try {
    const uid = req.query.uid as string | undefined;
    const rawPhase = req.query.phase;
    const phase: RankingPhase = isRankingPhase(rawPhase) ? rawPhase : "playoffs";

    const bulkMetrics = parseMetricsParam(req.query.metrics);
    if (bulkMetrics) {
      const snaps = await loadUserRankingSnaps(uid);
      const byMetric: Record<string, MetricPayload> = {};
      for (const m of bulkMetrics) {
        byMetric[m] = await rankingPayloadForMetric(m, phase, uid, snaps);
      }
      res.status(200).json({ ok: true, phase, byMetric });
      return;
    }

    const rawMetric = req.query.metric;
    const metric: Metric = isMetric(rawMetric) ? rawMetric : "totalPoints";
    const snaps = await loadUserRankingSnaps(uid);
    const payload = await rankingPayloadForMetric(metric, phase, uid, snaps);

    res.status(200).json({
      ok: true,
      metric,
      phase,
      count: payload.count,
      rows: payload.rows,
      myRank: payload.myRank,
      myRow: payload.myRow,
      myRankDeltaPlaces: payload.myRankDeltaPlaces,
    });
    return;
  } catch (e: any) {
    res.status(500).json({
      ok: false,
      error: e?.message ?? "unknown error",
    });
    return;
  }
});
