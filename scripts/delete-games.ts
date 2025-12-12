/**
 * 指定した gameId の試合データを一括削除するスクリプト
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

// ★ 削除したい試合IDをここに列挙
const TARGET_GAME_IDS = [
  "nba-20251214-002",
  "nba-20251214-003",
  "nba-20251214-004",
  "nba-20251214-005",
  "nba-20251214-006",
  "nba-20251214-007",

  "nba-20251215-001",
  "nba-20251215-002", // 重複しても問題なし
  "nba-20251215-003",
  "nba-20251215-004",
  "nba-20251215-TEST01",

  "nba-20251222-001",
  "nba-20251222-002",
  "nba-20251222-003",
  "nba-20251222-004",
  "nba-20251222-005",
  "nba-20251222-006",
  "nba-20251222-007",

  "nba-20251223-001",
  "nba-20251223-002",
];

(async () => {
  console.log("=== DELETE SELECTED GAMES START ===");

  const batch = db.batch();

  for (const id of TARGET_GAME_IDS) {
    const ref = db.collection("games").doc(id);
    batch.delete(ref);
    console.log(`queued delete: ${id}`);
  }

  await batch.commit();

  console.log("✔ selected games deleted");
  console.log("=== FINISHED ===");
  process.exit(0);
})();
