/**
 * npx tsx scripts/migrate-users-plan.ts
 *
 * 既存ユーザー全員に
 *   plan: "free"
 *   proUntil: null
 * を付与する（既存があればスキップ）
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

async function migrate() {
  console.log("=== MIGRATE USERS PLAN START ===");

  const snap = await db.collection("users").get();

  let batch = db.batch();
  let batchCount = 0;
  let updated = 0;

  for (const doc of snap.docs) {
    const data = doc.data();

    // plan が無いユーザーだけ対象
    if (!("plan" in data)) {
      batch.update(doc.ref, {
        plan: "free",
        proUntil: null,
      });
      batchCount++;
      updated++;
    }

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

  console.log(`✔ updated users: ${updated}`);
  console.log("=== MIGRATE FINISHED ===");
  process.exit(0);
}

migrate().catch((e) => {
  console.error("❌ migrate failed:", e);
  process.exit(1);
});
