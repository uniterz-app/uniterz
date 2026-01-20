/**
 * npx tsx scripts/init-nba-team-stats.ts
 *
 * NBAチームにのみ stats 初期フィールドを一括追加する
 * 既存フィールドは merge で保持
 */

import adminPkg from "firebase-admin";
const admin = adminPkg;

import fs from "fs";

// ---- service-account.json をロード ----
const serviceAccount = JSON.parse(
  fs.readFileSync("service-account.json", "utf8")
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const INITIAL_STATS = {
  gamesPlayed: 0,

  pointsForTotal: 0,
  pointsAgainstTotal: 0,

  homeGames: 0,
  homeWins: 0,

  awayGames: 0,
  awayWins: 0,

  vsEastGames: 0,
  vsEastWins: 0,

  vsWestGames: 0,
  vsWestWins: 0,

  closeGames: 0,
  closeWins: 0,

  currentStreak: 0,
  lastGames: [],
};

async function init() {
  console.log("=== INIT NBA TEAM STATS START ===");

  const snap = await db
    .collection("teams")
    .where("league", "==", "nba")
    .get();

  let batch = db.batch();
  let batchCount = 0;
  let updated = 0;

  for (const doc of snap.docs) {
    batch.set(doc.ref, INITIAL_STATS, { merge: true });
    batchCount++;
    updated++;

    // batch 上限対策
    if (batchCount >= 450) {
      await batch.commit();
      batch = db.batch();
      batchCount = 0;
    }
  }

  if (batchCount > 0) {
    await batch.commit();
  }

  console.log(`✔ initialized nba teams: ${updated}`);
  console.log("=== INIT FINISHED ===");
  process.exit(0);
}

init().catch((e) => {
  console.error("❌ init failed:", e);
  process.exit(1);
});
