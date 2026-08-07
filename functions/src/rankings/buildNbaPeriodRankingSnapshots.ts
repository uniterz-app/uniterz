// functions/src/rankings/buildNbaPeriodRankingSnapshots.ts
// user_stats_v2_daily から NBA Weekly / Monthly ランキングを日次で確定 doc 化する。
// doc: period_ranking_snapshots/nba_{period}_{label}_{metric}
// 無差別級: period_ranking_snapshots/nba_open_{period}_{label}_{metric}（Pro のみ）
// 期間が終わると更新されなくなり、そのまま過去ランキングのアーカイブになる。

import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { CURRENT_NBA_SEASON_KEY } from "./nbaSeason";
import {
  dateKeyJST,
  monthLabelJST,
  periodMinPosts,
  periodWinRateMinPosts,
  previousLabel,
  rangeForLabel,
  weekStartDateKeyJST,
  PERIOD_FINALIZE_GRACE_DAYS,
  type NbaPeriodRange,
  type NbaRankingPeriod,
} from "./nbaPeriod";

function db() {
  return getFirestore();
}

type DailyInc = {
  posts?: number;
  wins?: number;
  pointsSumV3?: number;
  upsetPointsSum?: number;
  goalScorerHitCount?: number;
};

type Agg = {
  posts: number;
  wins: number;
  totalPoints: number;
  totalUpset: number;
  totalGoalScorerHits: number;
};

export type PeriodMetric =
  | "totalPoints"
  | "winRate"
  | "totalUpset"
  | "totalGoalScorerHits";

const PERIOD_METRICS: PeriodMetric[] = [
  "totalPoints",
  "winRate",
  "totalUpset",
  "totalGoalScorerHits",
];

const TOP_ROWS = 50;

type SnapshotRow = {
  uid: string;
  displayName: string;
  handle: string | null;
  photoURL: string | null;
  countryCode: string | null;
  plan: string | null;
  totalPosts: number;
  totalWins: number;
  totalPoints: number;
  totalUpset: number;
  totalGoalScorerHits: number;
  totalPrecision: number;
  activeWinStreak: number;
  winRate: number;
  rank: number;
  /** 前日スナップショット比の順位変動（+ = 上昇）。期間初日・新規参加者は null */
  rankDeltaPlaces: number | null;
};

function emptyAgg(): Agg {
  return {
    posts: 0,
    wins: 0,
    totalPoints: 0,
    totalUpset: 0,
    totalGoalScorerHits: 0,
  };
}

function addInc(agg: Agg, inc: DailyInc | null | undefined) {
  if (!inc || typeof inc !== "object") return;
  agg.posts += Number(inc.posts ?? 0) || 0;
  agg.wins += Number(inc.wins ?? 0) || 0;
  agg.totalPoints += Number(inc.pointsSumV3 ?? 0) || 0;
  agg.totalUpset += Number(inc.upsetPointsSum ?? 0) || 0;
  agg.totalGoalScorerHits += Number(inc.goalScorerHitCount ?? 0) || 0;
}

/** シーズンスライス。standard=Pick Up / open=PRO LEAGUE（未移行日は ranking にフォールバック） */
function pickNbaInc(
  data: Record<string, unknown>,
  division: "standard" | "open"
): DailyInc | null {
  if (division === "open") {
    const openBySeason = data.openRankingBySeason as
      | Record<string, DailyInc>
      | undefined;
    const openInc = openBySeason?.[CURRENT_NBA_SEASON_KEY];
    if (openInc && typeof openInc === "object") return openInc;
  }
  const bySeason = data.rankingBySeason as
    | Record<string, DailyInc>
    | undefined;
  const seasonInc = bySeason?.[CURRENT_NBA_SEASON_KEY];
  if (seasonInc && typeof seasonInc === "object") return seasonInc;
  // Pick Up 導入後は leagues.nba（全試合）へフォールバックしない
  if (division === "open") {
    const leagues = data.leagues as { nba?: DailyInc } | undefined;
    if (leagues?.nba && typeof leagues.nba === "object") return leagues.nba;
  }
  return null;
}

function uidFromDailyDocId(docId: string, dateKey: string): string | null {
  const suffix = `_${dateKey}`;
  if (docId.endsWith(suffix)) return docId.slice(0, -suffix.length);
  const i = docId.lastIndexOf("_");
  if (i <= 0) return null;
  return docId.slice(0, i);
}

function metricValue(
  row: Omit<SnapshotRow, "rank" | "rankDeltaPlaces">,
  metric: PeriodMetric
): number {
  if (metric === "winRate") return row.winRate;
  if (metric === "totalUpset") return row.totalUpset;
  if (metric === "totalGoalScorerHits") return row.totalGoalScorerHits;
  return row.totalPoints;
}

export function periodSnapshotDocId(
  period: NbaRankingPeriod,
  label: string,
  metric: PeriodMetric,
  division: "standard" | "open" = "standard"
): string {
  const prefix = division === "open" ? "nba_open" : "nba";
  return `${prefix}_${period}_${label}_${metric}`;
}

function periodKeyForDivision(
  period: NbaRankingPeriod,
  division: "standard" | "open"
): string {
  return division === "open" ? `nba_open_${period}` : `nba_${period}`;
}

/** 順位変動の基準となる前日順位マップ（期間内に前日 doc が無ければ null） */
type PrevRankBasis = {
  prevRanks: Record<string, number> | null;
  prevDateKey: string | null;
};

/**
 * 既存 doc から順位変動の基準を決める。
 * - 前日以前に書かれた doc → その ranks を基準にする
 * - 当日すでに書かれた doc（cron 再実行）→ 基準を動かさず既存の prevRanks を引き継ぐ
 * - doc なし（期間リセット直後）→ 基準なし = 変動非表示
 */
function resolvePrevRankBasis(
  existing: FirebaseFirestore.DocumentSnapshot,
  todayKey: string
): PrevRankBasis {
  if (!existing.exists) return { prevRanks: null, prevDateKey: null };
  const data = existing.data() ?? {};
  const snapshotDateKey =
    typeof data.snapshotDateKey === "string" ? data.snapshotDateKey : null;
  if (snapshotDateKey === todayKey) {
    const prev = data.prevRanks;
    return {
      prevRanks:
        prev && typeof prev === "object"
          ? (prev as Record<string, number>)
          : null,
      prevDateKey:
        typeof data.prevDateKey === "string" ? data.prevDateKey : null,
    };
  }
  const ranks = data.ranks;
  return {
    prevRanks:
      ranks && typeof ranks === "object"
        ? (ranks as Record<string, number>)
        : null,
    prevDateKey: snapshotDateKey,
  };
}

async function buildOne(range: NbaPeriodRange, todayKey: string): Promise<void> {
  const firestore = db();
  const minPosts = periodMinPosts(range.period);
  const winRateMin = periodWinRateMinPosts(range.period);

  const statsSnap = await firestore
    .collection("user_stats_v2_daily")
    .where("date", ">=", range.startKey)
    .where("date", "<=", range.endKey)
    .get();

  const aggByUidStandard = new Map<string, Agg>();
  const aggByUidOpen = new Map<string, Agg>();
  for (const doc of statsSnap.docs) {
    const data = doc.data() as Record<string, unknown>;
    const dateKey = String(data.date ?? "");
    const uid = uidFromDailyDocId(doc.id, dateKey);
    if (!uid) continue;
    const incStandard = pickNbaInc(data, "standard");
    if (incStandard) {
      if (!aggByUidStandard.has(uid)) aggByUidStandard.set(uid, emptyAgg());
      addInc(aggByUidStandard.get(uid)!, incStandard);
    }
    const incOpen = pickNbaInc(data, "open");
    if (incOpen) {
      if (!aggByUidOpen.has(uid)) aggByUidOpen.set(uid, emptyAgg());
      addInc(aggByUidOpen.get(uid)!, incOpen);
    }
  }

  const uidsStandard = [...aggByUidStandard.keys()].filter(
    (uid) => (aggByUidStandard.get(uid)?.posts ?? 0) >= minPosts
  );
  const uidsOpen = [...aggByUidOpen.keys()].filter(
    (uid) => (aggByUidOpen.get(uid)?.posts ?? 0) >= minPosts
  );
  const uids = [...new Set([...uidsStandard, ...uidsOpen])];

  // 表示用プロフィール（cumulative_stats に集約済み）
  const profileByUid = new Map<
    string,
    {
      displayName: string;
      handle: string | null;
      photoURL: string | null;
      countryCode: string | null;
      plan: string | null;
    }
  >();
  const CHUNK = 80;
  for (let i = 0; i < uids.length; i += CHUNK) {
    const slice = uids.slice(i, i + CHUNK);
    const refs = slice.map((uid) =>
      firestore.collection("cumulative_stats").doc(uid)
    );
    const snaps = await firestore.getAll(...refs);
    for (const snap of snaps) {
      if (!snap.exists) continue;
      const d = snap.data() ?? {};
      profileByUid.set(snap.id, {
        displayName: String(d.displayName ?? "user"),
        handle: (d.handle as string | null | undefined) ?? null,
        photoURL: (d.photoURL as string | null | undefined) ?? null,
        countryCode: (d.countryCode as string | null | undefined) ?? null,
        plan: (d.plan as string | null | undefined) ?? null,
      });
    }
  }

  // 無差別級は users.plan を正とする（cumulative_stats の古さを避ける）
  const proUidSet = new Set<string>();
  for (let i = 0; i < uids.length; i += CHUNK) {
    const slice = uids.slice(i, i + CHUNK);
    const refs = slice.map((uid) => firestore.collection("users").doc(uid));
    const snaps = await firestore.getAll(...refs);
    const nowMs = Date.now();
    for (let j = 0; j < snaps.length; j++) {
      const snap = snaps[j];
      if (!snap.exists) continue;
      const d = snap.data() ?? {};
      if (d.plan !== "pro") continue;
      const until = d.proUntil as { toMillis?: () => number } | undefined;
      if (until && typeof until.toMillis === "function" && until.toMillis() <= nowMs) {
        continue;
      }
      proUidSet.add(slice[j]!);
      const profile = profileByUid.get(slice[j]!);
      if (profile) profile.plan = "pro";
    }
  }

  const toBaseRows = (
    targetUids: string[],
    aggByUid: Map<string, Agg>
  ): Array<Omit<SnapshotRow, "rank" | "rankDeltaPlaces">> =>
    targetUids.map((uid) => {
      const agg = aggByUid.get(uid)!;
      const profile = profileByUid.get(uid);
      return {
        uid,
        displayName: profile?.displayName ?? "user",
        handle: profile?.handle ?? null,
        photoURL: profile?.photoURL ?? null,
        countryCode: profile?.countryCode ?? null,
        plan: profile?.plan ?? null,
        totalPosts: agg.posts,
        totalWins: agg.wins,
        totalPoints: agg.totalPoints,
        totalUpset: agg.totalUpset,
        totalGoalScorerHits: agg.totalGoalScorerHits,
        totalPrecision: 0,
        activeWinStreak: 0,
        winRate: agg.posts > 0 ? agg.wins / agg.posts : 0,
      };
    });

  const standardBaseRows = toBaseRows(uidsStandard, aggByUidStandard);
  const openBaseRows = toBaseRows(uidsOpen, aggByUidOpen).filter((r) =>
    proUidSet.has(r.uid)
  );

  await writePeriodDivisionSnapshots({
    firestore,
    range,
    todayKey,
    division: "standard",
    baseRows: standardBaseRows,
    winRateMin,
  });
  await writePeriodDivisionSnapshots({
    firestore,
    range,
    todayKey,
    division: "open",
    baseRows: openBaseRows,
    winRateMin,
  });

  console.log(
    `[buildNbaPeriodRankingSnapshots] ${range.period} ${range.labelKey} standard=${standardBaseRows.length} open=${openBaseRows.length}`
  );
}

async function writePeriodDivisionSnapshots(opts: {
  firestore: ReturnType<typeof getFirestore>;
  range: NbaPeriodRange;
  todayKey: string;
  division: "standard" | "open";
  baseRows: Array<Omit<SnapshotRow, "rank" | "rankDeltaPlaces">>;
  winRateMin: number;
}): Promise<void> {
  const { firestore, range, todayKey, division, baseRows, winRateMin } = opts;

  const metricRefs = PERIOD_METRICS.map((metric) =>
    firestore
      .collection("period_ranking_snapshots")
      .doc(periodSnapshotDocId(range.period, range.labelKey, metric, division))
  );
  const existingSnaps = await firestore.getAll(...metricRefs);
  const prevBasisByMetric = new Map<PeriodMetric, PrevRankBasis>();
  PERIOD_METRICS.forEach((metric, i) => {
    prevBasisByMetric.set(
      metric,
      resolvePrevRankBasis(existingSnaps[i], todayKey)
    );
  });

  const batch = firestore.batch();
  PERIOD_METRICS.forEach((metric, metricIndex) => {
    const eligible =
      metric === "winRate"
        ? baseRows.filter((r) => r.totalPosts >= winRateMin)
        : baseRows;
    const sorted = [...eligible].sort((a, b) => {
      const diff = metricValue(b, metric) - metricValue(a, metric);
      if (diff !== 0) return diff;
      if (metric === "winRate") {
        const postsDiff = b.totalPosts - a.totalPosts;
        if (postsDiff !== 0) return postsDiff;
      }
      return b.totalPoints - a.totalPoints;
    });

    const basis = prevBasisByMetric.get(metric) ?? {
      prevRanks: null,
      prevDateKey: null,
    };

    // 同値は同順位
    const ranks: Record<string, number> = {};
    let lastVal: number | null = null;
    let lastRank = 0;
    const rankedRows: SnapshotRow[] = [];
    sorted.forEach((row, i) => {
      const v = metricValue(row, metric);
      const rank = lastVal != null && v === lastVal ? lastRank : i + 1;
      lastVal = v;
      lastRank = rank;
      ranks[row.uid] = rank;
      if (rankedRows.length < TOP_ROWS) {
        const prevRank = basis.prevRanks?.[row.uid];
        rankedRows.push({
          ...row,
          rank,
          rankDeltaPlaces:
            typeof prevRank === "number" && Number.isFinite(prevRank)
              ? prevRank - rank
              : null,
        });
      }
    });

    batch.set(metricRefs[metricIndex], {
      league: "nba",
      division,
      period: range.period,
      periodKey: periodKeyForDivision(range.period, division),
      label: range.labelKey,
      metric,
      range: { startKey: range.startKey, endKey: range.endKey },
      count: sorted.length,
      rows: rankedRows,
      ranks,
      // 圏外ユーザーの変動計算・翌日の基準引き継ぎ用
      prevRanks: basis.prevRanks,
      prevDateKey: basis.prevDateKey,
      snapshotDateKey: todayKey,
      updatedAt: FieldValue.serverTimestamp(),
    });
  });
  await batch.commit();
}

/**
 * 現在の週・月のスナップショットを再構築する。
 * 期間開始直後（猶予日数内）は前期間も再集計して遅延精算を反映する。
 */
export async function buildNbaPeriodRankingSnapshots(
  now: Date = new Date()
): Promise<void> {
  const todayKey = dateKeyJST(now);
  const targets: NbaPeriodRange[] = [];

  const weekLabel = weekStartDateKeyJST(now);
  targets.push(rangeForLabel("weekly", weekLabel, now));
  if (todayKey <= addGrace(weekLabel)) {
    targets.push(rangeForLabel("weekly", previousLabel("weekly", weekLabel), now));
  }

  const monthLabel = monthLabelJST(now);
  targets.push(rangeForLabel("monthly", monthLabel, now));
  if (todayKey <= addGrace(`${monthLabel}-01`)) {
    targets.push(
      rangeForLabel("monthly", previousLabel("monthly", monthLabel), now)
    );
  }

  for (const range of targets) {
    try {
      await buildOne(range, todayKey);
    } catch (err) {
      console.error(
        `[buildNbaPeriodRankingSnapshots] failed ${range.period} ${range.labelKey}`,
        err
      );
    }
  }

  try {
    const { grantProSkinRankUnlocksAfterPeriodSnapshots } = await import(
      "../profile/grantProSkinRankUnlocksOnPeriodFinal"
    );
    await grantProSkinRankUnlocksAfterPeriodSnapshots(now);
  } catch (err) {
    console.error(
      "[buildNbaPeriodRankingSnapshots] pro skin rank grants failed",
      err
    );
  }

  try {
    const { grantPeriodRankingUnitsAfterPeriodSnapshots } = await import(
      "../units/grantPeriodRankingUnits"
    );
    await grantPeriodRankingUnitsAfterPeriodSnapshots(now);
  } catch (err) {
    console.error(
      "[buildNbaPeriodRankingSnapshots] period ranking unit grants failed",
      err
    );
  }
}

/** 期間開始日 + 猶予日数の dateKey */
function addGrace(periodStartKey: string): string {
  const [y, m, d] = periodStartKey.split("-").map(Number);
  const base = new Date(Date.UTC(y, m - 1, d + PERIOD_FINALIZE_GRACE_DAYS));
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${base.getUTCFullYear()}-${pad(base.getUTCMonth() + 1)}-${pad(
    base.getUTCDate()
  )}`;
}
