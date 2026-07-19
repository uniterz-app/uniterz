/**
 * WC 総合得点: グループ集計 vs cumulative vs スナップショットのずれを監査。
 *
 *   npx tsx scripts/audit-wc-ranking-alignment.ts
 *   npx tsx scripts/audit-wc-ranking-alignment.ts --group-id=<GROUP_ID>
 */
import adminPkg from "firebase-admin";
import fs from "fs";
import { readDailyWcStageBuckets } from "../lib/rankings/dailyWcStageBuckets";
import { dateKeysFromStartToTodayJST } from "../lib/communities/dateRange";
import { buildMemberLeaderboard } from "../lib/communities/groupStats";
import {
  parseCommunityLeague,
  parseCommunityMetric,
  parseCommunityPeriod,
} from "../lib/communities/types";
import { readRankingTeamIds } from "../lib/communities/rankingTeams";
import { resolveRankingStartDateKey } from "../lib/communities/rankingStartDate";

const admin = adminPkg as typeof import("firebase-admin");
const groupIdArg = process.argv.find((a) => a.startsWith("--group-id="));
const GROUP_ID = groupIdArg?.slice("--group-id=".length).trim() || "";

admin.initializeApp({
  credential: admin.credential.cert(
    JSON.parse(fs.readFileSync("service-account.json", "utf8"))
  ),
});
const db = admin.firestore();

function num(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

async function sumDailyBucket(
  uid: string,
  dateKeys: string[],
  pick: (data: Record<string, unknown>) => Record<string, unknown>
) {
  let pts = 0;
  let posts = 0;
  for (const dk of dateKeys) {
    const snap = await db.doc(`user_stats_v2_daily/${uid}_${dk}`).get();
    if (!snap.exists) continue;
    const b = pick(snap.data() as Record<string, unknown>);
    pts += num(b.pointsSumV3);
    posts += num(b.posts);
  }
  return { pts, posts };
}

(async () => {
  const wcDateKeys = dateKeysFromStartToTodayJST("2026-06-11");
  console.log("=== WC cumulative vs daily (rankingByWcStage.overall) ===\n");

  const cumSnap = await db.collection("cumulative_stats").get();
  let checked = 0;
  let drift = 0;
  const driftRows: Array<Record<string, unknown>> = [];

  for (const doc of cumSnap.docs) {
    const d = doc.data();
    const cum = d.rankingByWcStage?.overall;
    if (!cum || num(cum.totalPosts) === 0) continue;
    checked++;

    const dailyOverall = await sumDailyBucket(doc.id, wcDateKeys, (data) =>
      readDailyWcStageBuckets(data).overall as Record<string, unknown>
    );
    const dailyLeaguesWc = await sumDailyBucket(doc.id, wcDateKeys, (data) =>
      ((data.leagues as Record<string, unknown> | undefined)?.wc ??
        {}) as Record<string, unknown>
    );

    const cumPts = num(cum.totalPoints);
    const ptsDiff = cumPts - dailyOverall.pts;
    const postsDiff = num(cum.totalPosts) - dailyOverall.posts;

    if (Math.abs(ptsDiff) > 0.05 || postsDiff !== 0) {
      drift++;
      if (driftRows.length < 10) {
        driftRows.push({
          uid: doc.id,
          displayName: d.displayName,
          cumPts,
          dailyOverallPts: dailyOverall.pts,
          leaguesWcPts: dailyLeaguesWc.pts,
          ptsDiff,
          cumPosts: num(cum.totalPosts),
          dailyPosts: dailyOverall.posts,
          lastAggregatedDate: d.lastAggregatedDate,
        });
      }
    }
  }

  console.log({ checked, drift });
  if (driftRows.length) {
    console.log("sample drift:");
    for (const r of driftRows) console.log(r);
  } else {
    console.log("No cumulative vs daily overall drift detected.");
  }

  const snapDoc = await db
    .doc("cumulative_ranking_snapshots/wc_overall_totalPoints")
    .get();
  const snapData = snapDoc.data();
  console.log("\n=== Global snapshot (wc_overall_totalPoints) ===");
  console.log({
    exists: snapDoc.exists,
    dateKey: snapData?.dateKey,
    builtAt: snapData?.builtAt?.toDate?.()?.toISOString?.() ?? null,
    rowCount: snapData?.rows?.length ?? 0,
  });

  const snapRows = (snapData?.rows ?? []) as Array<{
    uid: string;
    totalPoints: number;
    rank: number;
    displayName?: string;
  }>;

  let snapDrift = 0;
  for (const row of snapRows.slice(0, 20)) {
    const live = (await db.doc(`cumulative_stats/${row.uid}`).get()).data();
    const livePts = num(live?.rankingByWcStage?.overall?.totalPoints);
    if (Math.abs(livePts - num(row.totalPoints)) > 0.05) {
      snapDrift++;
      if (snapDrift <= 5) {
        console.log({
          uid: row.uid,
          name: row.displayName,
          snapPts: row.totalPoints,
          livePts,
          lastAgg: live?.lastAggregatedDate,
        });
      }
    }
  }
  console.log({ snapTop20Drift: snapDrift });

  if (GROUP_ID) {
    console.log(`\n=== Group ${GROUP_ID} vs global WC overall ===\n`);
    const groupSnap = await db.doc(`groups/${GROUP_ID}`).get();
    if (!groupSnap.exists) {
      console.error("Group not found");
      process.exit(1);
    }
    const gd = groupSnap.data()!;
    const rankingMetric = parseCommunityMetric(gd.rankingMetric);
    const periodType = parseCommunityPeriod(gd.periodType);
    const rankingLeague = parseCommunityLeague(gd.rankingLeague);
    const rankingTeamIds = readRankingTeamIds(gd);
    const rankingStartDateKey = resolveRankingStartDateKey(gd);
    const members = await db.collection(`groups/${GROUP_ID}/members`).get();
    const memberUids = members.docs.map((x) => x.id);

    const rows = await buildMemberLeaderboard(
      db,
      memberUids,
      rankingMetric,
      periodType,
      rankingLeague,
      rankingStartDateKey,
      rankingTeamIds
    );

    console.log({
      name: gd.name,
      rankingMetric,
      rankingLeague,
      rankingStartDateKey,
      rankingTeamIds,
    });

    let groupMismatch = 0;
    for (const r of rows.slice(0, 15)) {
      const cum = (await db.doc(`cumulative_stats/${r.uid}`).get()).data();
      const globalWc = num(cum?.rankingByWcStage?.overall?.totalPoints);
      const globalMain = num(cum?.rankingByWcStage?.main?.totalPoints);
      const diffGlobal = r.totalPoints - globalWc;
      if (Math.abs(diffGlobal) > 0.05) groupMismatch++;
      console.log({
        name: (r.displayName ?? "").slice(0, 16),
        groupPts: r.totalPoints,
        globalWcOverall: globalWc,
        globalWcMain: globalMain,
        diffGroupVsGlobalOverall: diffGlobal,
        groupRank: rows.indexOf(r) + 1,
      });
    }
    console.log({ groupMismatchInTop15: groupMismatch });
  } else {
    console.log(
      "\nTip: pass --group-id=<ID> to compare a specific group leaderboard."
    );
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
