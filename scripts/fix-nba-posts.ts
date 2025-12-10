/**
 * NBA 投稿の home / away を反転させるスクリプト（安全版）
 */

// ---- firebase-admin を ESM で使う安定版 ----
// @ts-ignore
import adminPkg from "firebase-admin";
const admin = adminPkg;

import fs from "fs";

const serviceAccount = JSON.parse(
  fs.readFileSync("service-account.json", "utf8")
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// dry-run
const DRY_RUN = process.argv.includes("--dry-run");

(async () => {
  console.log("=== NBA posts: home/away swap START ===");
  if (DRY_RUN) console.log(">>> DRY RUN モード\n");

  const snap = await db
    .collection("posts")
    .where("league", "==", "nba")
    .where("schemaVersion", "==", 2)
    .get();

  console.log(`対象投稿数: ${snap.size}`);

  let count = 0;

  for (const docSnap of snap.docs) {
    const d = docSnap.data();
    const ref = docSnap.ref;

    if (!d.home || !d.away || !d.prediction) continue;

    const oldHomeScore = d.prediction.score?.home ?? null;
    const oldAwayScore = d.prediction.score?.away ?? null;

    // winner 反転
    let newWinner = d.prediction.winner;
    if (newWinner === "home") newWinner = "away";
    else if (newWinner === "away") newWinner = "home";

    const updateData = {
      home: d.away,
      away: d.home,
      "prediction.winner": newWinner,
      "prediction.score.home": oldAwayScore,
      "prediction.score.away": oldHomeScore,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    console.log(`--- ${docSnap.id} 更新内容 ---`);
    console.log(updateData);

    if (!DRY_RUN) {
      await ref.update(updateData);
    }

    count++;
  }

  console.log(`\n=== 完了: ${count} 件を処理しました ===`);
  process.exit(0);
})();
