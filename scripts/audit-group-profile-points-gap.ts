/**
 * グループランキング vs プロフィール総合得点の 1〜2 点差を監査。
 *
 *   npx tsx scripts/audit-group-profile-points-gap.ts --group-id=HaHwZlmuXve3hBh634zu
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
import { readDailyWcStageBuckets } from "../lib/rankings/dailyWcStageBuckets";
import { resolveWcProfileSummaryLive } from "../lib/profile/resolveLiveProfileSummary";

const groupIdArg = process.argv.find((a) => a.startsWith("--group-id="));
const GROUP_ID =
  groupIdArg?.slice("--group-id=".length).trim() ||
  "HaHwZlmuXve3hBh634zu";

const admin = adminPkg as typeof import("firebase-admin");
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

async function sumDailyOverRange(
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

async function sumNonRankingMarkers(
  uid: string,
  dateKeys: string[],
  league: string | null
) {
  let pts = 0;
  let count = 0;
  for (const dk of dateKeys) {
    const snap = await db
      .collection(`user_stats_v2_daily/${uid}_${dk}/applied_posts`)
      .get();
    for (const doc of snap.docs) {
      const m = doc.data();
      if (m.countedForRanking !== false) continue;
      if (league && String(m.league ?? "").toLowerCase() !== league) continue;
      pts += num(m.pointsSumV3);
      count += 1;
    }
  }
  return { pts, count };
}

(async () => {
  const groupSnap = await db.doc(`groups/${GROUP_ID}`).get();
  if (!groupSnap.exists) {
    console.error("Group not found:", GROUP_ID);
    process.exit(1);
  }
  const gd = groupSnap.data()!;
  const rankingMetric = parseCommunityMetric(gd.rankingMetric);
  const periodType = parseCommunityPeriod(gd.periodType);
  const rankingLeague = parseCommunityLeague(gd.rankingLeague);
  const rankingTeamIds = readRankingTeamIds(gd);
  const rankingStartDateKey = resolveRankingStartDateKey(gd);
  const dateKeys = dateKeysFromStartToTodayJST(rankingStartDateKey);

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

  console.log("=== Group vs Profile 総合得点（1〜2点差の原因）===\n");
  console.log({
    group: gd.name,
    rankingLeague,
    rankingStartDateKey,
    dateKeys: dateKeys.length,
    rankingTeamIds,
  });

  const gaps: Array<Record<string, unknown>> = [];

  for (const row of rows.slice(0, 25)) {
    const cumSnap = await db.doc(`cumulative_stats/${row.uid}`).get();
    const cumulative = cumSnap.exists
      ? (cumSnap.data() as Record<string, unknown>)
      : null;

    const profile = await resolveWcProfileSummaryLive(
      db,
      row.uid,
      "overall",
      cumulative,
      null
    );

    const dailyLeaguesWc = await sumDailyOverRange(row.uid, dateKeys, (data) =>
      ((data.leagues as Record<string, unknown> | undefined)?.wc ??
        {}) as Record<string, unknown>
    );
    const dailyRankingOverall = await sumDailyOverRange(
      row.uid,
      dateKeys,
      (data) => readDailyWcStageBuckets(data).overall as Record<string, unknown>
    );

    const nonRanking = await sumNonRankingMarkers(
      row.uid,
      dateKeys,
      rankingLeague === "wc" ? "wc" : null
    );

    const groupPts = row.totalPoints;
    const profilePts = profile.pointsSumV3;
    const diff = groupPts - profilePts;

    if (Math.abs(diff) >= 0.05) {
      gaps.push({
        name: (row.displayName ?? "").slice(0, 14),
        groupPts,
        profilePts,
        diff,
        dailyLeaguesWc: dailyLeaguesWc.pts,
        dailyRankingOverall: dailyRankingOverall.pts,
        leaguesMinusRanking:
          dailyLeaguesWc.pts - dailyRankingOverall.pts,
        nonRankingPts: nonRanking.pts,
        nonRankingCount: nonRanking.count,
        profileMinusRankingOverall:
          profilePts - dailyRankingOverall.pts,
      });
    }
  }

  gaps.sort(
    (a, b) => Math.abs(num(b.diff)) - Math.abs(num(a.diff))
  );

  console.log(`\nUsers with |group - profile| > 0: ${gaps.length}`);
  for (const g of gaps.slice(0, 12)) {
    console.log(g);
  }

  const oneTwo = gaps.filter(
    (g) => Math.abs(num(g.diff)) >= 0.5 && Math.abs(num(g.diff)) <= 3
  );
  const explainedByLeagues =
    oneTwo.filter(
      (g) => Math.abs(num(g.leaguesMinusRanking) - num(g.diff)) < 0.05
    ).length;
  console.log(`\n1〜3点差: ${oneTwo.length} 件`);
  console.log(
    `うち leagues.wc − rankingByWcStage.overall が差分と一致: ${explainedByLeagues}/${oneTwo.length}`
  );
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
