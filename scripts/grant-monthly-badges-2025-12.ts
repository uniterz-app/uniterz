/**
 * npx tsx scripts/grant-monthly-badges-2025-12.ts
 *
 * 2025年12月 月次Top3バッジ配布スクリプト
 */

import admin from "firebase-admin";
import fs from "fs";

// ==============================
// Firebase Admin 初期化
// ==============================
if (!admin.apps.length) {
  const serviceAccount = JSON.parse(
    fs.readFileSync("service-account.json", "utf8")
  );

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();
const { FieldValue } = admin.firestore;

// ==============================
// 配布データ（確定版）
// ==============================
const GRANTS = [
  // ===== WIN RATE =====
  { uid: "EixKEATkb9XZ3cSgepxR2xRfIiw2", badgeId: "monthly_2025_12_win_rate_rank1" },
  { uid: "AicTZa7bGlWtuPNh9i9HJeG6fOb2", badgeId: "monthly_2025_12_win_rate_rank2" },
  { uid: "Rb3vF67NTLeCxSvrR15brCbiQSD2", badgeId: "monthly_2025_12_win_rate_rank3" },

  // ===== PREDICTION ACCURACY =====
  { uid: "EixKEATkb9XZ3cSgepxR2xRfIiw2", badgeId: "monthly_2025_12_prediction_accuracy_rank1" },
  { uid: "AicTZa7bGlWtuPNh9i9HJeG6fOb2", badgeId: "monthly_2025_12_prediction_accuracy_rank2" },
  { uid: "Rb3vF67NTLeCxSvrR15brCbiQSD2", badgeId: "monthly_2025_12_prediction_accuracy_rank3" },

  // ===== SCORE MARGIN ACCURACY =====
  { uid: "AicTZa7bGlWtuPNh9i9HJeG6fOb2", badgeId: "monthly_2025_12_score_margin_accuracy_rank1" },
  { uid: "WrW24A4n4OZZoqaM365DGj7s9XB2", badgeId: "monthly_2025_12_score_margin_accuracy_rank2" },
  { uid: "PfZ5GCBZRfTe1ERKCxiyXQhryl53", badgeId: "monthly_2025_12_score_margin_accuracy_rank3" },

  // ===== CALIBRATION ACCURACY =====
  { uid: "EixKEATkb9XZ3cSgepxR2xRfIiw2", badgeId: "monthly_2025_12_calibration_accuracy_rank1" },
  { uid: "Rb3vF67NTLeCxSvrR15brCbiQSD2", badgeId: "monthly_2025_12_calibration_accuracy_rank2" },
  { uid: "AicTZa7bGlWtuPNh9i9HJeG6fOb2", badgeId: "monthly_2025_12_calibration_accuracy_rank3" },

  // ===== UPSET RATE =====
  { uid: "Quue5ponCoela7lxjfLJhaaQ2Cg2", badgeId: "monthly_2025_12_upset_rate_rank1" },
  { uid: "dOOdlZx8EDNjZujJBDNFhUSx6742", badgeId: "monthly_2025_12_upset_rate_rank2" },
  { uid: "HwF6T5xdAuUygCiNIUvl840OcCE3", badgeId: "monthly_2025_12_upset_rate_rank3" },
];

// ==============================
// 実行
// ==============================
async function grantBadges() {
  console.log("=== GRANT MONTHLY BADGES START ===");

  let batch = db.batch();
  let ops = 0;
  let total = 0;

  for (const g of GRANTS) {
    const ref = db
      .collection("user_badges")
      .doc(g.uid)
      .collection("badges")
      .doc(g.badgeId);

    batch.set(
      ref,
      {
        badgeId: g.badgeId,
        grantedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    ops++;
    total++;

    // Firestore batch 上限対策
    if (ops >= 450) {
      await batch.commit();
      batch = db.batch();
      ops = 0;
    }
  }

  if (ops > 0) {
    await batch.commit();
  }

  console.log(`✔ granted badges: ${total}`);
  console.log("=== GRANT FINISHED ===");
  process.exit(0);
}

grantBadges().catch((e) => {
  console.error("❌ grant failed:", e);
  process.exit(1);
});
