/**
 * WC 同時キックオフスロット単位の連勝が投稿に正しく反映されているか監査する。
 *
 *   npx tsx scripts/audit-wc-slot-streak.ts
 *   npx tsx scripts/audit-wc-slot-streak.ts --game-ids=wc-2026-B-bih-qat,wc-2026-B-che-can
 */

import adminPkg from "firebase-admin";
import fs from "fs";
import {
  buildTimelineUnits,
  buildWcGamesByKickoff,
  replayFootballStreakWithSlots,
  type WcSlotReplayPost,
} from "../lib/wc/wcSlotStreakReplay";
import {
  calcStreakBonus,
  loadGamesById,
  loadWcPostRowsForUid,
  resolveKickoffMs,
} from "./lib/wcStreakReplay";

const admin = adminPkg as typeof import("firebase-admin");

const ONLY_MISMATCHES = process.argv.includes("--only-mismatches");
const gameIdsArg = process.argv.find((a) => a.startsWith("--game-ids="));
const FILTER_GAME_IDS = gameIdsArg
  ? gameIdsArg
      .slice("--game-ids=".length)
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
  : null;

admin.initializeApp({
  credential: admin.credential.cert(
    JSON.parse(fs.readFileSync("service-account.json", "utf8"))
  ),
});

const db = admin.firestore();

(async () => {
  console.log("=== audit WC slot streak ===");
  if (FILTER_GAME_IDS?.length) {
    console.log("filter gameIds:", FILTER_GAME_IDS.join(", "));
  }

  const postsSnap = await db
    .collection("posts")
    .where("league", "==", "wc")
    .where("status", "==", "final")
    .where("schemaVersion", "==", 2)
    .get();

  const uids = new Set<string>();
  for (const doc of postsSnap.docs) {
    const p = doc.data() as Record<string, unknown>;
    const stats = p.stats as Record<string, unknown> | undefined;
    if (!stats || stats.countedForRanking === false) continue;
    if (typeof stats.isWin !== "boolean") continue;
    const uid = String(p.authorUid ?? "").trim();
    const gameId = String(p.gameId ?? "").trim();
    if (!uid || !gameId) continue;
    if (FILTER_GAME_IDS && !FILTER_GAME_IDS.includes(gameId)) continue;
    uids.add(uid);
  }

  const allGameIds = new Set<string>();
  const rowsByUid = new Map<
    string,
    Awaited<ReturnType<typeof loadWcPostRowsForUid>>
  >();
  for (const uid of uids) {
    const rows = await loadWcPostRowsForUid(db, uid);
    rowsByUid.set(uid, rows);
    rows.forEach((r) => allGameIds.add(r.gameId));
  }

  const gameById = await loadGamesById(db, allGameIds);

  const kickoffs = new Set<number>();
  for (const game of gameById.values()) {
    const ms = resolveKickoffMs({}, game);
    if (ms) kickoffs.add(ms);
  }
  for (const ms of kickoffs) {
    const snap = await db
      .collection("games")
      .where("league", "==", "wc")
      .where("startAtJst", "==", admin.firestore.Timestamp.fromMillis(ms))
      .get();
    for (const doc of snap.docs) {
      if (!gameById.has(doc.id)) {
        gameById.set(doc.id, doc.data() as Record<string, unknown>);
      }
    }
  }

  const gamesByKickoff = buildWcGamesByKickoff(
    [...gameById.entries()].map(([gameId, game]) => ({
      gameId,
      kickoffMs: resolveKickoffMs({}, game),
      league: String(game.league ?? "wc"),
    }))
  );

  let mismatches = 0;
  let postsChecked = 0;

  for (const [uid, rows] of rowsByUid) {
    const targetRows = FILTER_GAME_IDS
      ? rows.filter((r) => FILTER_GAME_IDS.includes(r.gameId))
      : rows;
    if (targetRows.length === 0) continue;

    const replayPosts: WcSlotReplayPost[] = rows.map((row) => ({
      gameId: row.gameId,
      isWin: row.stats.isWin === true,
      kickoffMs: resolveKickoffMs(row, gameById.get(row.gameId)),
    }));
    const units = buildTimelineUnits(replayPosts, gamesByKickoff);
    const replay = replayFootballStreakWithSlots(units);

    for (const row of targetRows) {
      postsChecked++;
      const expectedActive = replay.perGameActive.get(row.gameId) ?? 0;
      const expectedBonus = calcStreakBonus(expectedActive);
      const basePoints = Number(row.detail.basePoints ?? 0);
      const upsetBonus = Number(row.detail.upsetBonus ?? row.stats.upsetBonus ?? 0);
      const goalScorerBonus = Number(
        row.detail.goalScorerBonus ?? row.stats.goalScorerBonus ?? 0
      );
      const expectedPoints =
        basePoints + upsetBonus + expectedBonus + goalScorerBonus;

      const storedActive = Number(row.detail.activeWinStreak ?? 0);
      const storedBonus = Number(row.stats.streakBonus ?? 0);
      const storedPoints = Number(row.stats.pointsV3 ?? 0);

      const drift =
        storedActive !== expectedActive ||
        storedBonus !== expectedBonus ||
        storedPoints !== expectedPoints;

      if (!drift) {
        if (!ONLY_MISMATCHES) console.log(`OK  ${uid}  ${row.gameId}`);
        continue;
      }

      mismatches++;
      console.log(
        [
          "DRIFT",
          uid,
          row.gameId,
          row.stats.isWin ? "W" : "L",
          `streak ${storedActive}→${expectedActive}`,
          `bonus ${storedBonus}→${expectedBonus}`,
          `pts ${storedPoints}→${expectedPoints} (Δ${expectedPoints - storedPoints})`,
        ].join("  ")
      );
    }
  }

  console.log("\n--- summary ---");
  console.log(`users: ${uids.size}`);
  console.log(`posts checked: ${postsChecked}`);
  console.log(`mismatches: ${mismatches}`);
  if (mismatches > 0) {
    console.log("\nfix:");
  console.log(
      "  npx tsx scripts/fix-wc-slot-streak-posts.ts --dry-run --game-ids=..."
    );
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
