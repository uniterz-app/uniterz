/**
 * audit-wc-streak-drift と同じキックオフ順ロジックで、ずれている投稿を一括修正する。
 *
 * 使い方:
 *   npx tsx scripts/fix-wc-streak-drift-all.ts --dry-run \
 *     --game-ids=wc-2026-K-prt-cod,wc-2026-L-eng-hrv,wc-2026-L-gha-pan,wc-2026-K-uzb-col
 *   npx tsx scripts/fix-wc-streak-drift-all.ts \
 *     --game-ids=wc-2026-K-prt-cod,wc-2026-L-eng-hrv,wc-2026-L-gha-pan,wc-2026-K-uzb-col
 */

import adminPkg from "firebase-admin";
import fs from "fs";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { resolveWcStageFromGame } from "../lib/wc/resolveWcStage";
import {
  buildKickoffTimeline,
  expectedPostStreakFields,
  loadGamesById,
  loadWcPostRowsForUid,
  replayFootballStreak,
  toTimestamp,
  type WcPostRow,
} from "./lib/wcStreakReplay";

const admin = adminPkg as typeof import("firebase-admin");

const DRY_RUN = process.argv.includes("--dry-run");
const gameIdsArg = process.argv.find((a) => a.startsWith("--game-ids="));
const FILTER_GAME_IDS = gameIdsArg
  ? gameIdsArg
      .slice("--game-ids=".length)
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
  : null;

const serviceAccount = JSON.parse(
  fs.readFileSync("service-account.json", "utf8")
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

function toDateKeyJST(ts: Timestamp): string {
  const d = ts.toDate();
  const j = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  const yyyy = j.getUTCFullYear();
  const mm = String(j.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(j.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function resolveStatsStartAt(
  post: WcPostRow,
  game?: Record<string, unknown>
): Timestamp | null {
  return (
    toTimestamp(game?.startAtJst) ??
    toTimestamp(game?.startAt) ??
    toTimestamp(post.startAtJst) ??
    toTimestamp(post.startAt) ??
    toTimestamp(post.createdAt)
  );
}

function incFields(delta: Record<string, number>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(delta)) {
    if (v !== 0) out[k] = FieldValue.increment(v);
  }
  return out;
}

function readBasketballState(data: Record<string, unknown> | undefined) {
  const sb = data?.streakBySport as { basketball?: number } | undefined;
  const mb = data?.maxWinStreakBySport as { basketball?: number } | undefined;
  return {
    basketball:
      typeof sb?.basketball === "number"
        ? sb.basketball
        : typeof data?.currentStreak === "number"
          ? data.currentStreak
          : 0,
    maxBasketball:
      typeof mb?.basketball === "number"
        ? mb.basketball
        : typeof data?.maxWinStreak === "number"
          ? data.maxWinStreak
          : 0,
  };
}

function postDrift(row: WcPostRow, events: ReturnType<typeof buildKickoffTimeline>) {
  const expected = expectedPostStreakFields(row, events);
  const storedActive = Number(row.detail.activeWinStreak ?? 0);
  const storedBonus = Number(row.stats.streakBonus ?? 0);
  const storedPoints = Number(row.stats.pointsV3 ?? 0);
  const drift =
    storedActive !== expected.activeWinStreak ||
    storedBonus !== expected.streakBonus ||
    storedPoints !== expected.pointsV3;
  return { drift, expected, storedPoints, storedBonus, storedActive };
}

(async () => {
  console.log("=== fix WC streak drift (bulk, kickoff-order) ===");
  if (FILTER_GAME_IDS?.length) {
    console.log("filter gameIds:", FILTER_GAME_IDS.join(", "));
  }
  if (DRY_RUN) console.log(">>> DRY RUN");
  console.log("");

  const postsSnap = await db
    .collection("posts")
    .where("league", "==", "wc")
    .where("status", "==", "final")
    .where("schemaVersion", "==", 2)
    .get();

  const uidsToCheck = new Set<string>();
  for (const doc of postsSnap.docs) {
    const p = doc.data() as Record<string, unknown>;
    const stats = p.stats as Record<string, unknown> | undefined;
    if (!stats || stats.countedForRanking === false) continue;
    if (typeof stats.isWin !== "boolean") continue;
    const uid = String(p.authorUid ?? "").trim();
    const gameId = String(p.gameId ?? "").trim();
    if (!uid || !gameId) continue;
    if (FILTER_GAME_IDS && !FILTER_GAME_IDS.includes(gameId)) continue;
    uidsToCheck.add(uid);
  }

  let postsFixed = 0;
  let usersFixed = 0;
  let totalDelta = 0;

  for (const uid of uidsToCheck) {
    const allRows = await loadWcPostRowsForUid(db, uid);
    const gameById = await loadGamesById(
      db,
      allRows.map((r) => r.gameId)
    );
    const events = buildKickoffTimeline(allRows, gameById);

    const targetRows = FILTER_GAME_IDS
      ? allRows.filter((r) => FILTER_GAME_IDS.includes(r.gameId))
      : allRows;

    const toFix: Array<{
      row: WcPostRow;
      expected: ReturnType<typeof expectedPostStreakFields>;
      dPoints: number;
      dStreakBonus: number;
    }> = [];

    for (const row of targetRows) {
      const { drift, expected, storedPoints, storedBonus } = postDrift(
        row,
        events
      );
      if (!drift) continue;
      toFix.push({
        row,
        expected,
        dPoints: expected.pointsV3 - storedPoints,
        dStreakBonus: expected.streakBonus - storedBonus,
      });
    }

    if (toFix.length === 0) continue;

    console.log(`\n${uid}  ${toFix.length} post(s)`);
    for (const fix of toFix) {
      const { row, expected, dPoints } = fix;
      console.log(
        `  ${row.gameId}  streak ${row.detail.activeWinStreak}→${expected.activeWinStreak}  pts ${row.stats.pointsV3}→${expected.pointsV3} (Δ${dPoints})`
      );
      totalDelta += dPoints;
      postsFixed++;
    }

    if (DRY_RUN) {
      usersFixed++;
      continue;
    }

    const dailyDeltas = new Map<
      string,
      { dPoints: number; dStreakBonus: number; wcStage: string | null }
    >();
    let userDPoints = 0;

    for (const fix of toFix) {
      const { row, expected, dPoints, dStreakBonus } = fix;
      userDPoints += dPoints;

      const postSnap = await db.doc(`posts/${row.postId}`).get();
      if (!postSnap.exists) {
        console.error(`  skip missing post ${row.postId}`);
        continue;
      }
      const post = postSnap.data() as Record<string, unknown>;
      const stats = post.stats as Record<string, unknown>;
      const detail = stats.pointsV3Detail as Record<string, unknown>;

      const newStats = {
        ...stats,
        streakBonus: expected.streakBonus,
        pointsV3: expected.pointsV3,
        pointsV3Detail: {
          ...detail,
          streakBonus: expected.streakBonus,
          activeWinStreak: expected.activeWinStreak,
        },
      };

      await postSnap.ref.update({
        stats: newStats,
        updatedAt: FieldValue.serverTimestamp(),
      });

      const game = gameById.get(row.gameId);
      const startAt = resolveStatsStartAt(row, game);
      if (!startAt) continue;

      const dateKey = toDateKeyJST(startAt);
      const wcStage = game
        ? resolveWcStageFromGame({
            knockout: game.knockout === true,
            roundLabel:
              typeof game.roundLabel === "string" ? game.roundLabel : null,
            wcStage: typeof game.wcStage === "string" ? game.wcStage : null,
          })
        : null;

      const prev = dailyDeltas.get(dateKey) ?? {
        dPoints: 0,
        dStreakBonus: 0,
        wcStage,
      };
      prev.dPoints += dPoints;
      prev.dStreakBonus += dStreakBonus;
      dailyDeltas.set(dateKey, prev);
    }

    for (const [dateKey, { dPoints, dStreakBonus, wcStage }] of dailyDeltas) {
      const bucketDelta = incFields({
        pointsSumV3: dPoints,
        streakBonusSum: dStreakBonus,
      });
      if (Object.keys(bucketDelta).length === 0) continue;

      const dailyPatch: Record<string, unknown> = {
        date: dateKey,
        updatedAt: FieldValue.serverTimestamp(),
        all: bucketDelta,
        ranking: bucketDelta,
        leagues: { wc: bucketDelta },
        rankingByWcStage: {
          overall: bucketDelta,
          ...(wcStage === "qualifying" ? { qualifying: bucketDelta } : {}),
          ...(wcStage === "main" ? { main: bucketDelta } : {}),
        },
      };
      await db.doc(`user_stats_v2_daily/${uid}_${dateKey}`).set(dailyPatch, {
        merge: true,
      });
    }

    const replay = replayFootballStreak(events);
    const userSnap = await db.doc(`user_stats_v2/${uid}`).get();
    const userData = userSnap.data() as Record<string, unknown> | undefined;
    const { basketball, maxBasketball } = readBasketballState(userData);
    const streakBySport = { basketball, football: replay.football };
    const maxWinStreakBySport = {
      basketball: maxBasketball,
      football: replay.maxFootball,
    };

    const batch = db.batch();
    batch.set(
      db.doc(`user_stats_v2/${uid}`),
      {
        streakBySport,
        maxWinStreakBySport,
        streakFootball: replay.football,
        maxWinStreakFootball: replay.maxFootball,
        currentStreak: basketball,
        maxWinStreak: maxBasketball,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    batch.set(
      db.doc(`users/${uid}`),
      {
        streakBySport,
        streakFootball: replay.football,
        currentStreak: basketball,
        maxStreak: maxBasketball,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    batch.set(
      db.doc(`cumulative_stats/${uid}`),
      {
        streakBySport,
        streakFootball: replay.football,
        currentStreak: basketball,
        activeWinStreakFootball: replay.activeWinStreakFootball,
        activeWinStreakBasketball: basketball > 0 ? basketball : 0,
        ...(userDPoints !== 0 ? { totalPoints: FieldValue.increment(userDPoints) } : {}),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    if (userDPoints !== 0) {
      const cumSnap = await db.doc(`cumulative_stats/${uid}`).get();
      const ranking = cumSnap.get("ranking") as
        | Record<string, unknown>
        | undefined;
      if (ranking) {
        batch.set(
          db.doc(`cumulative_stats/${uid}`),
          {
            ranking: {
              totalPoints: FieldValue.increment(userDPoints),
            },
          },
          { merge: true }
        );
      }
    }

    await batch.commit();
    console.log(`  ✓ fixed (${userDPoints !== 0 ? `cumulative Δ${userDPoints}` : "no pts delta"})`);
    usersFixed++;
  }

  console.log("\n--- summary ---");
  console.log(`users fixed: ${usersFixed}`);
  console.log(`posts fixed: ${postsFixed}`);
  console.log(`total pointsV3 delta: ${totalDelta}`);

  if (!DRY_RUN && postsFixed > 0) {
    console.log("\n次:");
    console.log("  npx tsx scripts/backfill-wc-football-streak.ts");
    console.log("  npx tsx scripts/backfill-wc-cumulative-from-daily.ts");
    console.log("  npx tsx scripts/run-cumulative-ranking-snapshot.ts");
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
