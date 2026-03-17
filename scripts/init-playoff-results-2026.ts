/**
 * npx tsx scripts/init-playoff-results-2026.ts
 *
 * playoffResults/2026 に
 * 全15シリーズの空結果データを一括作成する
 */

import adminPkg from "firebase-admin";
const admin = adminPkg;

import fs from "fs";

// ---- service-account.json をロード ----
const serviceAccount = JSON.parse(
  fs.readFileSync("service-account.json", "utf8")
);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

const SEASON = "2026";

const EMPTY_RESULTS = {
  R1_E1: {},
  R1_E2: {},
  R1_E3: {},
  R1_E4: {},
  R1_W1: {},
  R1_W2: {},
  R1_W3: {},
  R1_W4: {},
  R2_E1: {},
  R2_E2: {},
  R2_W1: {},
  R2_W2: {},
  CF_E: {},
  CF_W: {},
  FINALS: {},
};

async function init() {
  console.log(`=== INIT PLAYOFF RESULTS ${SEASON} START ===`);

  const ref = db.collection("playoffResults").doc(SEASON);

  await ref.set(
    {
      season: SEASON,
      results: EMPTY_RESULTS,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  console.log(`✔ initialized playoffResults/${SEASON}`);
  console.log("=== INIT FINISHED ===");
  process.exit(0);
}

init().catch((e) => {
  console.error("❌ init failed:", e);
  process.exit(1);
});