/**
 * 同時キックオフスロット連勝ルールに基づき、ずれている WC 投稿を一括修正する。
 *
 *   npx tsx scripts/fix-wc-slot-streak-posts.ts --dry-run \
 *     --game-ids=wc-2026-B-bih-qat,wc-2026-B-che-can,wc-2026-C-mar-hti,wc-2026-C-sct-bra
 *   npx tsx scripts/fix-wc-slot-streak-posts.ts --game-ids=...
 *
 * 修正後に user_stats を直す場合:
 *   npx tsx scripts/backfill-wc-football-streak.ts
 */

import adminPkg from "firebase-admin";
import fs from "fs";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { resolveWcStageFromGame } from "../lib/wc/resolveWcStage";
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

admin.initializeApp({
  credential: admin.credential.cert(
    JSON.parse(fs.readFileSync("service-account.json", "utf8"))
  ),
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
  const toTs = (v: unknown) => {
    if (v instanceof Timestamp) return v;
    if (v && typeof (v as { toDate?: unknown }).toDate === "function") {
      return v as Timestamp;
    }
    return null;
  };
  return (
    toTs(game?.startAtJst) ??
    toTs(game?.startAt) ??
    toTs(post.startAtJst) ??
    toTs(post.startAt) ??
    toTs(post.createdAt)
  );
}

function expectedForRow(
  row: WcPostRow,
  replay: ReturnType<typeof replayFootballStreakWithSlots>
) {
  const activeWinStreak = replay.perGameActive.get(row.gameId) ?? 0;
  const streakBonus = calcStreakBonus(activeWinStreak);
  const basePoints = Number(row.detail.basePoints ?? 0);
  const upsetBonus = Number(row.detail.upsetBonus ?? row.stats.upsetBonus ?? 0);
  const goalScorerBonus = Number(
    row.detail.goalScorerBonus ?? row.stats.goalScorerBonus ?? 0
  );
  const pointsV3 = basePoints + upsetBonus + streakBonus + goalScorerBonus;
  return { activeWinStreak, streakBonus, pointsV3 };
}

(async () => {
  console.log("=== fix WC slot streak posts ===");
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

  let postsFixed = 0;
  let totalDelta = 0;

  for (const uid of uids) {
    const allRows = await loadWcPostRowsForUid(db, uid);
    const gameById = await loadGamesById(
      db,
      allRows.map((r) => r.gameId)
    );

    for (const ms of [...new Set(allRows.map((r) => resolveKickoffMs(r, gameById.get(r.gameId))))]) {
      if (!ms) continue;
      const snap = await db
        .collection("games")
        .where("league", "==", "wc")
        .where("startAtJst", "==", Timestamp.fromMillis(ms))
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

    const replayPosts: WcSlotReplayPost[] = allRows.map((row) => ({
      gameId: row.gameId,
      isWin: row.stats.isWin === true,
      kickoffMs: resolveKickoffMs(row, gameById.get(row.gameId)),
    }));
    const replay = replayFootballStreakWithSlots(
      buildTimelineUnits(replayPosts, gamesByKickoff)
    );

    const targetRows = FILTER_GAME_IDS
      ? allRows.filter((r) => FILTER_GAME_IDS.includes(r.gameId))
      : allRows;

    const toFix: Array<{
      row: WcPostRow;
      expected: ReturnType<typeof expectedForRow>;
      dPoints: number;
      dStreakBonus: number;
    }> = [];

    for (const row of targetRows) {
      const expected = expectedForRow(row, replay);
      const storedActive = Number(row.detail.activeWinStreak ?? 0);
      const storedBonus = Number(row.stats.streakBonus ?? 0);
      const storedPoints = Number(row.stats.pointsV3 ?? 0);
      if (
        storedActive === expected.activeWinStreak &&
        storedBonus === expected.streakBonus &&
        storedPoints === expected.pointsV3
      ) {
        continue;
      }
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
      console.log(
        `  ${fix.row.gameId}  streak ${fix.row.detail.activeWinStreak}→${fix.expected.activeWinStreak}  pts ${fix.row.stats.pointsV3}→${fix.expected.pointsV3} (Δ${fix.dPoints})`
      );
      totalDelta += fix.dPoints;
      postsFixed++;
    }

    if (DRY_RUN) continue;

    const dailyDeltas = new Map<
      string,
      { dPoints: number; dStreakBonus: number; wcStage: string | null }
    >();

    for (const fix of toFix) {
      const { row, expected, dPoints, dStreakBonus } = fix;
      const postSnap = await db.doc(`posts/${row.postId}`).get();
      if (!postSnap.exists) continue;

      const post = postSnap.data() as Record<string, unknown>;
      const stats = post.stats as Record<string, unknown>;
      const detail = stats.pointsV3Detail as Record<string, unknown>;

      await postSnap.ref.update({
        stats: {
          ...stats,
          streakBonus: expected.streakBonus,
          pointsV3: expected.pointsV3,
          pointsV3Detail: {
            ...detail,
            streakBonus: expected.streakBonus,
            activeWinStreak: expected.activeWinStreak,
          },
        },
        updatedAt: FieldValue.serverTimestamp(),
      });

      const game = gameById.get(row.gameId);
      const startAt = resolveStatsStartAt(row, game);
      if (!startAt || (dPoints === 0 && dStreakBonus === 0)) continue;

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
      if (dPoints === 0 && dStreakBonus === 0) continue;
      const inc: Record<string, FirebaseFirestore.FieldValue> = {};
      if (dPoints !== 0) inc.pointsSumV3 = FieldValue.increment(dPoints);
      if (dStreakBonus !== 0) inc.streakBonusSum = FieldValue.increment(dStreakBonus);
      const patch: Record<string, unknown> = {
        date: dateKey,
        updatedAt: FieldValue.serverTimestamp(),
        all: inc,
        ranking: inc,
      };
      if (wcStage) {
        patch.rankingByWcStage = {
          overall: inc,
          ...(wcStage === "qualifying" ? { qualifying: inc } : {}),
          ...(wcStage === "main" ? { main: inc } : {}),
        };
      }
      await db.doc(`user_stats_v2_daily/${uid}_${dateKey}`).set(patch, {
        merge: true,
      });
    }
  }

  console.log("\n--- summary ---");
  console.log(`posts fixed: ${postsFixed}`);
  console.log(`total pointsV3 delta: ${totalDelta}`);
  if (!DRY_RUN && postsFixed > 0) {
    console.log("\nnext: npx tsx scripts/backfill-wc-football-streak.ts");
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
