/**
 * npx tsx scripts/grant-winrate-rank3-test.ts
 *
 * 2025年12月 勝率3位バッジを
 * 特定ユーザー1名にのみ付与（動作確認用）
 */

import adminPkg from "firebase-admin";
const admin = adminPkg;

import fs from "fs";

// ===== Firebase Admin 初期化 =====
const serviceAccount = JSON.parse(
  fs.readFileSync("service-account.json", "utf8")
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function grant() {
  const uid = "Rb3vF67NTLeCxSvrR15brCbiQSD2";
  const badgeId = "monthly_2025_12_win_rate_rank3";

  const ref = db
    .collection("user_badges")
    .doc(uid)
    .collection("badges")
    .doc(badgeId);

  await ref.set(
    {
      badgeId,
      grantedAt: admin.firestore.FieldValue.serverTimestamp(),
      meta: {
        metric: "win_rate",
        rank: 3,
        yearMonth: "2025-12",
        source: "monthly_ranking",
      },
    },
    { merge: true }
  );

  console.log(`✔ granted ${badgeId} to ${uid}`);
}

grant()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("❌ grant failed:", e);
    process.exit(1);
  });
