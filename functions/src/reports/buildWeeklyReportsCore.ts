// NBA weekly report builder — period ranking snapshots + user_reports.

import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { CURRENT_NBA_SEASON_KEY } from "../rankings/nbaSeason";
import {
  dateKeyJST,
  periodMinPosts,
  periodWinRateMinPosts,
  previousLabel,
  rangeForLabel,
  weekStartDateKeyJST,
} from "../rankings/nbaPeriod";
import {
  MAX_REPORT_RIVALS,
  type WeeklyReportComment,
  type WeeklyReportDivision,
  type WeeklyReportDivisionKey,
  type WeeklyReportRival,
} from "./weeklyReportTypes";

type Status = "live" | "final";
type Metric = "totalPoints" | "winRate" | "totalUpset" | "totalGoalScorerHits";
type Agg = {
  posts: number;
  wins: number;
  totalPoints: number;
  totalUpset: number;
  totalGoalScorerHits: number;
};
type SnapshotRow = Agg & {
  uid: string;
  displayName?: string;
  photoURL?: string | null;
  winRate?: number;
};
type Profile = { displayName: string; photoURL: string | null };
type ExistingReport = {
  status?: Status;
  snapshotDateKey?: string;
  rank?: number;
  totalPoints?: number;
  totalPosts?: number;
  divisions?: WeeklyReportDivision[];
};

const METRICS: Metric[] = [
  "totalPoints",
  "winRate",
  "totalUpset",
  "totalGoalScorerHits",
];
const PROFILE_CHUNK = 80;
const WRITE_CHUNK = 400;

function db() {
  return getFirestore();
}

function emptyAgg(): Agg {
  return {
    posts: 0,
    wins: 0,
    totalPoints: 0,
    totalUpset: 0,
    totalGoalScorerHits: 0,
  };
}

function num(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function addDaily(agg: Agg, data: Record<string, unknown>) {
  const bySeason = data.rankingBySeason as
    | Record<string, Record<string, unknown>>
    | undefined;
  const leagues = data.leagues as
    | { nba?: Record<string, unknown> }
    | undefined;
  const inc = bySeason?.[CURRENT_NBA_SEASON_KEY] ?? leagues?.nba;
  if (!inc || typeof inc !== "object") return;
  agg.posts += num(inc.posts);
  agg.wins += num(inc.wins);
  agg.totalPoints += num(inc.pointsSumV3);
  agg.totalUpset += num(inc.upsetPointsSum);
  agg.totalGoalScorerHits += num(inc.goalScorerHitCount);
}

function uidFromDailyDoc(docId: string, dateKey: string): string | null {
  const suffix = `_${dateKey}`;
  if (dateKey && docId.endsWith(suffix)) return docId.slice(0, -suffix.length);
  const i = docId.lastIndexOf("_");
  return i > 0 ? docId.slice(0, i) : null;
}

function asRanks(data: Record<string, unknown> | undefined): Record<string, number> {
  const source = data?.ranks;
  if (!source || typeof source !== "object") return {};
  const result: Record<string, number> = {};
  for (const [uid, rank] of Object.entries(source)) {
    const n = Number(rank);
    if (Number.isFinite(n) && n > 0) result[uid] = n;
  }
  return result;
}

function asRows(data: Record<string, unknown> | undefined): Map<string, SnapshotRow> {
  const result = new Map<string, SnapshotRow>();
  const rows = Array.isArray(data?.rows) ? data!.rows : [];
  for (const raw of rows) {
    if (!raw || typeof raw !== "object") continue;
    const r = raw as Record<string, unknown>;
    const uid = typeof r.uid === "string" ? r.uid : "";
    if (!uid) continue;
    result.set(uid, {
      uid,
      posts: num(r.totalPosts),
      wins: num(r.totalWins),
      totalPoints: num(r.totalPoints),
      totalUpset: num(r.totalUpset),
      totalGoalScorerHits: num(r.totalGoalScorerHits),
      winRate: num(r.winRate),
      displayName: typeof r.displayName === "string" ? r.displayName : undefined,
      photoURL: typeof r.photoURL === "string" ? r.photoURL : null,
    });
  }
  return result;
}

async function loadPeriodSnapshots(label: string) {
  const refs = METRICS.map((metric) =>
    db().collection("period_ranking_snapshots").doc(`nba_weekly_${label}_${metric}`)
  );
  const snaps = await db().getAll(...refs);
  const ranks = {} as Record<Metric, Record<string, number>>;
  const rows = new Map<string, SnapshotRow>();
  let participantCount = 0;
  snaps.forEach((snap, index) => {
    const data = (snap.exists ? snap.data() : {}) as Record<string, unknown>;
    const metric = METRICS[index]!;
    ranks[metric] = asRanks(data);
    if (metric === "totalPoints") participantCount = num(data.count);
    for (const [uid, row] of asRows(data)) {
      if (!rows.has(uid) || metric === "totalPoints") rows.set(uid, row);
    }
  });
  return { ranks, rows, participantCount };
}

async function loadAggs(
  range: { startKey: string; endKey: string },
  snapshotRows: Map<string, SnapshotRow>
): Promise<Map<string, Agg>> {
  const stats = await db()
    .collection("user_stats_v2_daily")
    .where("date", ">=", range.startKey)
    .where("date", "<=", range.endKey)
    .get();
  const aggs = new Map<string, Agg>();
  for (const doc of stats.docs) {
    const data = doc.data() as Record<string, unknown>;
    const uid = uidFromDailyDoc(doc.id, String(data.date ?? ""));
    if (!uid || snapshotRows.has(uid)) continue;
    if (!aggs.has(uid)) aggs.set(uid, emptyAgg());
    addDaily(aggs.get(uid)!, data);
  }
  for (const [uid, row] of snapshotRows) {
    aggs.set(uid, {
      posts: row.posts,
      wins: row.wins,
      totalPoints: row.totalPoints,
      totalUpset: row.totalUpset,
      totalGoalScorerHits: row.totalGoalScorerHits,
    });
  }
  return aggs;
}

async function loadProfiles(
  uids: string[],
  snapshotRows: Map<string, SnapshotRow>
): Promise<Map<string, Profile>> {
  const profiles = new Map<string, Profile>();
  for (const [uid, row] of snapshotRows) {
    if (row.displayName) {
      profiles.set(uid, {
        displayName: row.displayName,
        photoURL: row.photoURL ?? null,
      });
    }
  }
  for (let i = 0; i < uids.length; i += PROFILE_CHUNK) {
    const slice = uids.slice(i, i + PROFILE_CHUNK);
    const snaps = await db().getAll(
      ...slice.flatMap((uid) => [
        db().collection("cumulative_stats").doc(uid),
        db().collection("users").doc(uid),
      ])
    );
    for (let j = 0; j < slice.length; j++) {
      const cumulative = snaps[j * 2];
      const user = snaps[j * 2 + 1];
      const c = cumulative?.exists ? cumulative.data() ?? {} : {};
      const u = user?.exists ? user.data() ?? {} : {};
      const displayName = String(c.displayName ?? u.displayName ?? profiles.get(slice[j]!)?.displayName ?? "user");
      const photo = c.photoURL ?? u.photoURL ?? profiles.get(slice[j]!)?.photoURL ?? null;
      profiles.set(slice[j]!, {
        displayName,
        photoURL: typeof photo === "string" ? photo : null,
      });
    }
  }
  return profiles;
}

async function loadReports(
  uids: string[],
  label: string,
  previousWeek: string
): Promise<{ existing: Map<string, ExistingReport>; priorFinal: Map<string, ExistingReport> }> {
  const existing = new Map<string, ExistingReport>();
  const priorFinal = new Map<string, ExistingReport>();
  for (let i = 0; i < uids.length; i += PROFILE_CHUNK) {
    const slice = uids.slice(i, i + PROFILE_CHUNK);
    const snaps = await db().getAll(
      ...slice.flatMap((uid) => [
        db().collection("user_reports").doc(`${uid}_weekly_${label}`),
        db().collection("user_reports").doc(`${uid}_weekly_${previousWeek}`),
      ])
    );
    slice.forEach((uid, j) => {
      const current = snaps[j * 2];
      const previous = snaps[j * 2 + 1];
      if (current?.exists) existing.set(uid, current.data() as ExistingReport);
      if (previous?.exists && previous.data()?.status === "final") {
        priorFinal.set(uid, previous.data() as ExistingReport);
      }
    });
  }
  return { existing, priorFinal };
}

function divisions(
  agg: Agg,
  previous: ExistingReport | undefined
): WeeklyReportDivision[] {
  const priorByKey = new Map(
    (Array.isArray(previous?.divisions) ? previous!.divisions : []).map((d) => [d.key, d])
  );
  const winRate = agg.posts > 0 ? (agg.wins / agg.posts) * 100 : 0;
  const division = (
    key: WeeklyReportDivisionKey,
    value: number,
    minPosts: number
  ): WeeklyReportDivision => {
    const qualified = agg.posts >= minPosts;
    return {
      key,
      value,
      prevValue: priorByKey.get(key)?.value ?? null,
      rank: null,
      postsToQualify: qualified ? null : minPosts - agg.posts,
    };
  };
  const result = [
    division("winRate", winRate, periodWinRateMinPosts("weekly")),
    division("goalScorerHits", agg.totalGoalScorerHits, periodMinPosts("weekly")),
    division("upset", agg.totalUpset, periodMinPosts("weekly")),
  ];
  return result;
}

function rival(uid: string, rank: number, profiles: Map<string, Profile>): WeeklyReportRival {
  const profile = profiles.get(uid);
  return { uid, rank, displayName: profile?.displayName ?? "user", photoURL: profile?.photoURL ?? null };
}

function buildComment(input: {
  rankDelta: number | null;
  nextTarget: { rival: WeeklyReportRival; pointsBehind: number } | null;
  overtakenBy: WeeklyReportRival[];
  divisions: WeeklyReportDivision[];
  previousPosts: number | null;
  posts: number;
}): WeeklyReportComment {
  const tone =
    input.rankDelta == null
      ? "firstWeek"
      : input.rankDelta >= 10
        ? "climbedBig"
        : input.rankDelta > 0
          ? "climbed"
          : input.rankDelta < 0
            ? "dropped"
            : "held";
  if (input.nextTarget && input.nextTarget.pointsBehind <= 2) {
    return { tone, factor: { kind: "targetGap", rank: input.nextTarget.rival.rank, displayName: input.nextTarget.rival.displayName, pointsBehind: input.nextTarget.pointsBehind } };
  }
  if (input.rankDelta != null && input.rankDelta < 0 && input.overtakenBy[0]) {
    return { tone, factor: { kind: "overtakenBy", displayName: input.overtakenBy[0].displayName } };
  }
  const changed = input.divisions
    .map((d) => ({ division: d.key, delta: d.prevValue == null ? 0 : d.value - d.prevValue }))
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))[0];
  if (changed && changed.delta > 0) return { tone, factor: { kind: "divisionUp", division: changed.division } };
  if (changed && changed.delta < 0) return { tone, factor: { kind: "divisionDown", division: changed.division } };
  if (input.previousPosts != null && input.previousPosts - input.posts >= 3 && input.posts * 2 <= input.previousPosts) {
    return { tone, factor: { kind: "lowVolume", posts: input.posts } };
  }
  return { tone, factor: { kind: "none" } };
}

export async function buildWeeklyReportsCore(opts?: {
  weekLabel?: string;
  status?: Status;
  limit?: number;
  now?: Date;
}): Promise<{ weekLabel: string; status: Status; written: number }> {
  const now = opts?.now ?? new Date();
  const status = opts?.status ?? "live";
  const weekLabel = opts?.weekLabel ?? weekStartDateKeyJST(now);
  const range = rangeForLabel("weekly", weekLabel, now);
  const previousWeek = previousLabel("weekly", weekLabel);
  const [current, prior] = await Promise.all([
    loadPeriodSnapshots(weekLabel),
    loadPeriodSnapshots(previousWeek),
  ]);
  if (Object.keys(current.ranks.totalPoints).length === 0) {
    console.warn(`[buildWeeklyReportsCore] no totalPoints snapshot for ${weekLabel}`);
    return { weekLabel, status, written: 0 };
  }

  const aggs = await loadAggs(range, current.rows);
  let uids = Object.keys(current.ranks.totalPoints).filter(
    (uid) => (aggs.get(uid)?.posts ?? 0) >= periodMinPosts("weekly")
  );
  if (opts?.limit != null) uids = uids.slice(0, Math.max(0, opts.limit));
  const [profiles, reportHistory] = await Promise.all([
    loadProfiles(uids, current.rows),
    loadReports(uids, weekLabel, previousWeek),
  ]);
  const todayKey = dateKeyJST(now);
  const ranked = [...uids].sort(
    (a, b) => current.ranks.totalPoints[a]! - current.ranks.totalPoints[b]!
  );
  const indexByUid = new Map(ranked.map((uid, index) => [uid, index]));
  let written = 0;

  for (let offset = 0; offset < uids.length; offset += WRITE_CHUNK) {
    const batch = db().batch();
    for (const uid of uids.slice(offset, offset + WRITE_CHUNK)) {
      const agg = aggs.get(uid)!;
      const existing = reportHistory.existing.get(uid);
      const priorFinal = reportHistory.priorFinal.get(uid);
      const yesterdayLive =
        status === "live" &&
        existing?.status === "live" &&
        existing.snapshotDateKey &&
        existing.snapshotDateKey < todayKey
          ? existing
          : undefined;
      const priorSnapshotRow = prior.rows.get(uid);
      const snapshotComparison: ExistingReport | undefined = priorSnapshotRow
        ? {
            totalPoints: priorSnapshotRow.totalPoints,
            totalPosts: priorSnapshotRow.posts,
            divisions: [
              {
                key: "winRate",
                value:
                  priorSnapshotRow.posts > 0
                    ? (priorSnapshotRow.wins / priorSnapshotRow.posts) * 100
                    : 0,
                prevValue: null,
                rank: null,
                postsToQualify: null,
              },
              {
                key: "goalScorerHits",
                value: priorSnapshotRow.totalGoalScorerHits,
                prevValue: null,
                rank: null,
                postsToQualify: null,
              },
              {
                key: "upset",
                value: priorSnapshotRow.totalUpset,
                prevValue: null,
                rank: null,
                postsToQualify: null,
              },
            ],
          }
        : undefined;
      const comparison =
        status === "final"
          ? priorFinal ?? snapshotComparison
          : yesterdayLive ?? priorFinal ?? snapshotComparison;
      const rank = current.ranks.totalPoints[uid]!;
      const prevRank =
        comparison?.rank ?? prior.ranks.totalPoints[uid] ?? null;
      const rankDeltaPlaces = prevRank == null ? null : prevRank - rank;
      const divs = divisions(agg, comparison);
      divs[0]!.rank = agg.posts >= periodWinRateMinPosts("weekly") ? current.ranks.winRate[uid] ?? null : null;
      divs[1]!.rank = agg.posts >= periodMinPosts("weekly") ? current.ranks.totalGoalScorerHits[uid] ?? null : null;
      divs[2]!.rank = agg.posts >= periodMinPosts("weekly") ? current.ranks.totalUpset[uid] ?? null : null;

      const prevRanks = prior.ranks.totalPoints;
      const overtakenIds = ranked.filter((other) => other !== uid && prevRanks[other] != null && prevRanks[uid] != null && prevRanks[other]! < prevRanks[uid]! && current.ranks.totalPoints[other]! > rank);
      const overtakenByIds = ranked.filter((other) => other !== uid && prevRanks[other] != null && prevRanks[uid] != null && prevRanks[other]! > prevRanks[uid]! && current.ranks.totalPoints[other]! < rank);
      const overtaken = overtakenIds.slice(0, MAX_REPORT_RIVALS).map((other) => rival(other, current.ranks.totalPoints[other]!, profiles));
      const overtakenBy = overtakenByIds.slice(0, MAX_REPORT_RIVALS).map((other) => rival(other, current.ranks.totalPoints[other]!, profiles));
      const rankIndex = indexByUid.get(uid)!;
      const above = ranked[rankIndex - 1];
      const below = ranked[rankIndex + 1];
      const nextTarget = above == null ? null : {
        rival: rival(above, current.ranks.totalPoints[above]!, profiles),
        pointsBehind: Math.max(0, aggs.get(above)!.totalPoints - agg.totalPoints),
      };
      const threat = below == null ? null : {
        rival: rival(below, current.ranks.totalPoints[below]!, profiles),
        pointsGap: Math.max(0, agg.totalPoints - aggs.get(below)!.totalPoints),
      };
      const report = {
        uid,
        type: "weekly" as const,
        league: "nba" as const,
        label: weekLabel,
        range: { startKey: range.startKey, endKey: range.endKey },
        status,
        snapshotDateKey: todayKey,
        participantCount: current.participantCount || ranked.length,
        rank,
        prevRank,
        rankDeltaPlaces,
        topPercent:
          (current.participantCount || ranked.length) > 0
            ? (rank / (current.participantCount || ranked.length)) * 100
            : null,
        totalPoints: agg.totalPoints,
        prevTotalPoints: comparison?.totalPoints ?? null,
        totalPosts: agg.posts,
        totalWins: agg.wins,
        divisions: divs,
        overtaken,
        overtakenCount: overtakenIds.length,
        overtakenBy,
        overtakenByCount: overtakenByIds.length,
        nextTarget,
        threat,
        comment: buildComment({ rankDelta: rankDeltaPlaces, nextTarget, overtakenBy, divisions: divs, previousPosts: comparison?.totalPosts ?? null, posts: agg.posts }),
        builtAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      };
      batch.set(db().collection("user_reports").doc(`${uid}_weekly_${weekLabel}`), report, { merge: true });
      written++;
    }
    await batch.commit();
  }
  return { weekLabel, status, written };
}
