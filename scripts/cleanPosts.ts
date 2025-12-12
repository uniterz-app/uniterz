/**
 * 特定の gameId の投稿から
 *   - stats
 *   - result
 *   - settledAt
 *   - status
 * を削除するだけのスクリプト（gameId の書き換えなし）
 */

import adminPkg from "firebase-admin";
const admin = adminPkg;

import fs from "fs";

// service-account.json を使う
const serviceAccount = JSON.parse(
  fs.readFileSync("service-account.json", "utf8")
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

/** 
 * 対象とする gameId
 */
const TARGET_GAME_ID = "nba-20251211-01";  // ← ここを書き換えるだけで OK

(async () => {
  console.log("=== CLEAN TARGET GAME POSTS START ===");

  const snap = await db
    .collection("posts")
    .where("gameId", "==", TARGET_GAME_ID)
    .where("schemaVersion", "==", 2)
    .get();

  if (snap.empty) {
    console.log(`no posts found for ${TARGET_GAME_ID}`);
    process.exit(0);
  }

  console.log(`found ${snap.size} posts. Cleaning...`);

  const batch = db.batch();

  snap.forEach((doc) => {
    batch.update(doc.ref, {
      // ← 削除するフィールド
      stats: admin.firestore.FieldValue.delete(),
      result: admin.firestore.FieldValue.delete(),
      settledAt: admin.firestore.FieldValue.delete(),
      status: admin.firestore.FieldValue.delete(),
    });
  });

  await batch.commit();

  console.log(
    `✔ ${snap.size} posts cleaned: stats/result/settledAt/status removed`
  );

  console.log("\n=== CLEAN FINISHED ===");
  process.exit(0);
})();
