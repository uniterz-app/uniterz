/**
 * cumulative_stats に WC ステージ別連勝（qualifying / main）を書き戻す。
 * ノックアウト連勝ランキングのスナップショット前に実行する。
 *
 *   npx tsx scripts/backfill-wc-stage-streak-on-cumulative.ts --dry-run
 *   npx tsx scripts/backfill-wc-stage-streak-on-cumulative.ts
 *   npx tsx scripts/backfill-wc-stage-streak-on-cumulative.ts --uid=<UID>
 */

import adminPkg from "firebase-admin";
import fs from "fs";
import { resolveWcStageFromGame } from "../lib/wc/resolveWcStage";
import {
  buildTimelineUnits,
  buildWcGamesByKickoff,
  replayFootballStreakWithSlots,
  type WcSlotReplayPost,
} from "../lib/wc/wcSlotStreakReplay";
import { resolveKickoffMsFromFields } from "../lib/wc/wcKickoffSlot";
import { loadGamesById } from "./lib/wcStreakReplay";

const admin = adminPkg as typeof import("firebase-admin");

const DRY_RUN = process.argv.includes("--dry-run");
const uidArg = process.argv.find((a) => a.startsWith("--uid="));
const targetUid = uidArg ? uidArg.slice("--uid=".length).trim() : "";

if (!fs.existsSync("service-account.json")) {
  console.error("service-account.json が見つかりません（プロジェクトルートで実行）");
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(
    JSON.parse(fs.readFileSync("service-account.json", "utf8"))
  ),
});

const db = admin.firestore();

type GameWcStage = "qualifying" | "main";

function replayStageActive(
  posts: WcSlotReplayPost[],
  gamesByKickoff: Map<number, string[]>,
  stage: GameWcStage | null
): number {
  const filtered =
    stage == null
      ? posts
      : posts.filter((p) => p.wcStage === stage);
  if (filtered.length === 0) return 0;
  const units = buildTimelineUnits(filtered, gamesByKickoff);
  return replayFootballStreakWithSlots(units).activeWinStreakFootball;
}

(async () => {
  console.log("=== backfill WC stage streak on cumulative_stats ===");
  if (DRY_RUN) console.log(">>> DRY RUN\n");

  const postsSnap = await db
    .collection("posts")
    .where("league", "==", "wc")
    .where("status", "==", "final")
    .where("schemaVersion", "==", 2)
    .get();

  const rowsByUid = new Map<string, WcSlotReplayPost[]>();
  const allGameIds = new Set<string>();

  for (const doc of postsSnap.docs) {
    const p = doc.data() as Record<string, unknown>;
    const uid = String(p.authorUid ?? "").trim();
    if (!uid || (targetUid && uid !== targetUid)) continue;

    const stats = p.stats as Record<string, unknown> | undefined;
    if (!stats || stats.countedForRanking === false) continue;
    if (typeof stats.isWin !== "boolean") continue;

    const gameId = String(p.gameId ?? "").trim();
    if (!gameId) continue;

    allGameIds.add(gameId);
    const row: WcSlotReplayPost = {
      gameId,
      isWin: stats.isWin === true,
      kickoffMs: 0,
      wcStage: null,
    };
    if (!rowsByUid.has(uid)) rowsByUid.set(uid, []);
    rowsByUid.get(uid)!.push(row);
  }

  const gameById = await loadGamesById(db, allGameIds);
  const wcGames = [...gameById.entries()].map(([gameId, g]) => ({
    gameId,
    kickoffMs: resolveKickoffMsFromFields(g) ?? 0,
    league: String(g.league ?? "wc"),
  }));
  const gamesByKickoff = buildWcGamesByKickoff(wcGames);

  for (const posts of rowsByUid.values()) {
    for (const post of posts) {
      const game = gameById.get(post.gameId);
      post.kickoffMs = resolveKickoffMsFromFields(game) ?? 0;
      post.wcStage = resolveWcStageFromGame({
        knockout: game?.knockout === true,
        roundLabel:
          typeof game?.roundLabel === "string" ? game.roundLabel : null,
        wcStage: typeof game?.wcStage === "string" ? game.wcStage : null,
      });
    }
    posts.sort((a, b) => a.kickoffMs - b.kickoffMs || a.gameId.localeCompare(b.gameId));
  }

  console.log(`targets: ${rowsByUid.size} user(s)\n`);

  let updated = 0;
  for (const [uid, posts] of rowsByUid) {
    const qualifying = replayStageActive(posts, gamesByKickoff, "qualifying");
    const main = replayStageActive(posts, gamesByKickoff, "main");
    const overall = replayStageActive(posts, gamesByKickoff, null);

    const cumSnap = await db.doc(`cumulative_stats/${uid}`).get();
    const prev = cumSnap.data() as Record<string, unknown> | undefined;
    const prevMain = (
      (prev?.rankingByWcStage as Record<string, { activeWinStreak?: number }> | undefined)
        ?.main?.activeWinStreak
    );

    if (qualifying === 0 && main === 0 && overall === 0) continue;

    console.log(
      [
        uid,
        `overall=${overall}`,
        `qualifying=${qualifying}`,
        `main ${prevMain ?? "?"} → ${main}`,
      ].join(" | ")
    );

    if (DRY_RUN) {
      updated++;
      continue;
    }

    await db.doc(`cumulative_stats/${uid}`).set(
      {
        activeWinStreakFootball: overall,
        activeWinStreakByWcStage: {
          qualifying,
          main,
        },
        rankingByWcStage: {
          qualifying: { activeWinStreak: qualifying },
          main: { activeWinStreak: main },
        },
        wcStageStreakBackfilledAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    updated++;
  }

  console.log(
    `\nDone. ${updated} user(s) ${DRY_RUN ? "would be " : ""}updated.`
  );
  if (!DRY_RUN && updated > 0) {
    console.log(
      "\nnext: cd functions && npm run build && npx tsx scripts/run-cumulative-ranking-snapshot-wc.ts --streak-all"
    );
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
