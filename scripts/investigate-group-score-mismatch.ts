/**
 * Compare group leaderboard scores vs global cumulative_stats for a group.
 * Usage: npx tsx scripts/investigate-group-score-mismatch.ts <groupId>
 */
import adminPkg from "firebase-admin";
import fs from "fs";
import { buildMemberLeaderboard } from "../lib/communities/groupStats";
import { readRankingTeamIds } from "../lib/communities/rankingTeams";
import { resolveRankingStartDateKey } from "../lib/communities/rankingStartDate";
import {
  parseCommunityLeague,
  parseCommunityMetric,
  parseCommunityPeriod,
} from "../lib/communities/types";
import { dateKeysFromStartToTodayJST } from "../lib/communities/dateRange";

const groupId = process.argv[2];
if (!groupId) {
  console.error("Usage: npx tsx scripts/investigate-group-score-mismatch.ts <groupId>");
  process.exit(1);
}

const admin = adminPkg;
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(
      JSON.parse(fs.readFileSync("service-account.json", "utf8"))
    ),
  });
}
const db = admin.firestore();

async function main() {
  const groupSnap = await db.doc(`groups/${groupId}`).get();
  if (!groupSnap.exists) {
    console.error("Group not found:", groupId);
    process.exit(1);
  }
  const d = groupSnap.data()!;
  const rankingMetric = parseCommunityMetric(d.rankingMetric);
  const periodType = parseCommunityPeriod(d.periodType);
  const rankingLeague = parseCommunityLeague(d.rankingLeague);
  const rankingTeamIds = readRankingTeamIds(d);
  const rankingStartDateKey = resolveRankingStartDateKey(d);
  const dateKeys = dateKeysFromStartToTodayJST(rankingStartDateKey);

  console.log("=== Group settings ===");
  console.log({
    name: d.name,
    rankingMetric,
    periodType,
    rankingLeague,
    rankingTeamIds,
    rankingStartDateKey,
    dateKeyCount: dateKeys.length,
    createdAt: d.createdAt?.toDate?.()?.toISOString?.(),
  });

  const membersSnap = await db.collection(`groups/${groupId}/members`).get();
  const memberUids = membersSnap.docs.map((x) => x.id);
  console.log("memberCount:", memberUids.length);

  const rows = await buildMemberLeaderboard(
    db,
    memberUids,
    rankingMetric,
    periodType,
    rankingLeague,
    rankingStartDateKey,
    rankingTeamIds
  );

  const cumSnaps = await db.getAll(
    ...memberUids.map((uid) => db.doc(`cumulative_stats/${uid}`))
  );

  type Cum = {
    totalPoints: number;
    wc?: { totalPoints?: number };
    playoffs?: { totalPoints?: number };
    regular?: { totalPoints?: number };
    rankingByPhase?: Record<string, { totalPoints?: number }>;
    rankingByWcStage?: Record<string, { totalPoints?: number }>;
  };

  const cumByUid = new Map<string, Cum>();
  for (const snap of cumSnaps) {
    if (!snap.exists) continue;
    const data = snap.data() as Record<string, unknown>;
    cumByUid.set(snap.id, {
      totalPoints: Number(data.totalPoints ?? 0),
      wc: data.wc as Cum["wc"],
      playoffs: data.playoffs as Cum["playoffs"],
      regular: data.regular as Cum["regular"],
      rankingByPhase: data.rankingByPhase as Cum["rankingByPhase"],
      rankingByWcStage: data.rankingByWcStage as Cum["rankingByWcStage"],
    });
  }

  console.log("\n=== Per-member comparison (group daily agg vs cumulative) ===");
  console.log(
    [
      "displayName".padEnd(20),
      "groupPts".padStart(10),
      "cumAll".padStart(10),
      "cumWC".padStart(10),
      "diff(g-a)".padStart(10),
      "postsG".padStart(8),
      "postsC".padStart(8),
    ].join(" ")
  );

  const mismatches: Array<{
    uid: string;
    name: string;
    groupPts: number;
    cumAll: number;
    cumWc: number;
    diff: number;
  }> = [];

  for (const r of rows) {
    const c = cumByUid.get(r.uid);
    const cumAll = c?.totalPoints ?? 0;
    const cumWc =
      c?.wc?.totalPoints ??
      c?.rankingByPhase?.wc?.totalPoints ??
      0;
    const diff = r.totalPoints - cumAll;
    const line = [
      (r.displayName ?? r.uid).slice(0, 20).padEnd(20),
      String(r.totalPoints.toFixed(1)).padStart(10),
      String(cumAll.toFixed(1)).padStart(10),
      String(cumWc.toFixed(1)).padStart(10),
      String(diff.toFixed(1)).padStart(10),
      String(r.totalPosts).padStart(8),
      String(c?.totalPoints != null ? "—" : "0").padStart(8),
    ].join(" ");
    console.log(line);
    if (Math.abs(diff) > 0.05) {
      mismatches.push({
        uid: r.uid,
        name: r.displayName,
        groupPts: r.totalPoints,
        cumAll,
        cumWc,
        diff,
      });
    }
  }

  if (mismatches.length === 0) {
    console.log("\nNo mismatches vs cumulative_stats.totalPoints (all-time profile total).");
  } else {
    console.log(`\n${mismatches.length} members with group != cumulative all:`);
    for (const m of mismatches.slice(0, 5)) {
      console.log(m);
    }
  }

  // Snapshot check
  const snapshotSnap = await db
    .collection(`groups/${groupId}/leaderboard_snapshots`)
    .orderBy("builtAtMs", "desc")
    .limit(1)
    .get();
  if (!snapshotSnap.empty) {
    const snap = snapshotSnap.docs[0].data();
    console.log("\n=== Latest leaderboard snapshot ===");
    console.log({
      slotKey: snap.slotKey,
      builtAt: new Date(snap.builtAtMs).toISOString(),
      rankingStartDateKey: snap.rankingStartDateKey,
      rankingTeamIds: snap.rankingTeamIds,
      rowCount: snap.rows?.length,
    });
    const sampleUid = rows[0]?.uid;
    if (sampleUid) {
      const live = rows.find((r) => r.uid === sampleUid);
      const cached = (snap.rows as Array<{ uid: string; totalPoints: number }>).find(
        (r) => r.uid === sampleUid
      );
      console.log("Sample compare live vs snapshot:", {
        uid: sampleUid,
        livePts: live?.totalPoints,
        snapshotPts: cached?.totalPoints,
      });
    }
  }

  // If team filter, also sum cumulative from applied_posts for one mismatched user
  if (rankingTeamIds.length > 0 && mismatches.length > 0) {
    const uid = mismatches[0].uid;
    console.log(`\n=== Team-filter debug for ${uid} ===`);
    let teamPts = 0;
    let teamPosts = 0;
    for (const dk of dateKeys) {
      const postsSnap = await db
        .collection(`user_stats_v2_daily/${uid}_${dk}/applied_posts`)
        .get();
      for (const doc of postsSnap.docs) {
        const m = doc.data();
        const home = String(m.homeTeamId ?? "");
        const away = String(m.awayTeamId ?? "");
        const hit = rankingTeamIds.some((t) => t === home || t === away);
        if (!hit) continue;
        if (m.countedForRanking === false) continue;
        teamPts += Number(m.pointsSumV3 ?? 0);
        teamPosts += Number(m.posts ?? 0);
      }
    }
    console.log({ teamPts, teamPosts, rankingTeamIds });
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
