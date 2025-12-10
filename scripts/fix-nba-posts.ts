/**
 * NBA 投稿の home / away を反転させるスクリプト（安全版）
 */

import * as admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import * as fs from "fs";

// ==============================
// Firebase Admin 初期化
// ==============================
const serviceAccount = require("../service-account.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = getFirestore();

(async () => {
  console.log("=== NBA posts: home/away swap START ===");

  const snap = await db
    .collection("posts")
    .where("league", "==", "nba")
    .where("schemaVersion", "==", 2)
    .get();

  console.log(`対象投稿数: ${snap.size}`);

  const batch = db.batch();
  let count = 0;

  snap.forEach((docSnap) => {
    const d = docSnap.data();
    const ref = docSnap.ref;

    if (!d.home || !d.away || !d.prediction) return;

    const oldHomeScore = d.prediction.score?.home ?? null;
    const oldAwayScore = d.prediction.score?.away ?? null;

    // winner の反転
    let newWinner = d.prediction.winner;
    if (newWinner === "home") newWinner = "away";
    else if (newWinner === "away") newWinner = "home";

    batch.update(ref, {
      home: d.away,
      away: d.home,

      // prediction の差分更新（安全）
      "prediction.winner": newWinner,
      "prediction.score.home": oldAwayScore,
      "prediction.score.away": oldHomeScore,

      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    count++;
  });

  if (count > 0) {
    await batch.commit();
  }

  console.log(`=== 完了: ${count} 件を反転しました ===`);
  process.exit(0);
})();
