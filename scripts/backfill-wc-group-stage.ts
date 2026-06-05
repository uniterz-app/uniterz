/**
 * グループリーグ試合の wcStage を qualifying に修正し、
 * 紐づく未確定 posts の wcStage も揃える。
 *
 * 対象 games:
 *   league === "wc" かつ knockout !== true かつ roundLabel が "Group ..." 開始
 *   かつ wcStage !== "qualifying"
 *
 * 対象 posts:
 *   上記 gameId を参照する投稿で status !== "final" かつ wcStage !== "qualifying"
 *
 * 使い方（service-account.json 必須）:
 *   npx tsx scripts/backfill-wc-group-stage.ts --dry-run
 *   npx tsx scripts/backfill-wc-group-stage.ts
 */

import adminPkg from "firebase-admin";
import fs from "fs";
import { resolveWcStageFromGame } from "../lib/wc/resolveWcStage.ts";

const admin = adminPkg as typeof import("firebase-admin");

const DRY_RUN = process.argv.includes("--dry-run");

const serviceAccount = JSON.parse(
  fs.readFileSync("service-account.json", "utf8")
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

function isGroupLeagueGame(data: Record<string, unknown>): boolean {
  return resolveWcStageFromGame({
    knockout: data.knockout === true,
    roundLabel:
      typeof data.roundLabel === "string" ? data.roundLabel : null,
    wcStage: typeof data.wcStage === "string" ? data.wcStage : null,
  }) === "qualifying";
}

(async () => {
  console.log("=== backfill WC group stage (wcStage → qualifying) ===");
  if (DRY_RUN) console.log(">>> DRY RUN（Firestore は更新しません）\n");

  const gamesSnap = await db.collection("games").where("league", "==", "wc").get();

  const gameIdsToFix = new Set<string>();
  let gamesScanned = 0;
  let gamesWouldFix = 0;

  for (const doc of gamesSnap.docs) {
    gamesScanned++;
    const data = doc.data() as Record<string, unknown>;
    if (!isGroupLeagueGame(data)) continue;
    if (data.wcStage === "qualifying") continue;

    gameIdsToFix.add(doc.id);
    gamesWouldFix++;
    console.log(
      `[game] ${doc.id}  roundLabel=${data.roundLabel}  wcStage: ${data.wcStage} → qualifying`
    );

    if (!DRY_RUN) {
      await doc.ref.set({ wcStage: "qualifying" }, { merge: true });
    }
  }

  let postsScanned = 0;
  let postsWouldFix = 0;

  if (gameIdsToFix.size > 0) {
    const postsSnap = await db.collection("posts").where("league", "==", "wc").get();
    for (const doc of postsSnap.docs) {
      postsScanned++;
      const data = doc.data() as Record<string, unknown>;
      const gameId = String(data.gameId ?? "");
      if (!gameIdsToFix.has(gameId)) continue;
      if (data.status === "final") continue;
      if (data.wcStage === "qualifying") continue;

      postsWouldFix++;
      console.log(
        `[post] ${doc.id}  gameId=${gameId}  status=${data.status}  wcStage: ${data.wcStage} → qualifying`
      );

      if (!DRY_RUN) {
        await doc.ref.set({ wcStage: "qualifying" }, { merge: true });
      }
    }
  }

  console.log("\n--- サマリー ---");
  console.log(`games 走査: ${gamesScanned}`);
  console.log(`games 修正対象: ${gamesWouldFix}`);
  console.log(`posts 走査: ${postsScanned}`);
  console.log(`posts 修正対象（未確定のみ）: ${postsWouldFix}`);

  if (DRY_RUN) {
    console.log("\nDRY RUN のため未更新。本番は --dry-run を外して再実行。");
  } else {
    console.log("\n更新完了。試合確定時は rankingByWcStage.qualifying に加算されます。");
  }

  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
