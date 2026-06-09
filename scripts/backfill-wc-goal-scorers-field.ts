/**
 * 全 WC 試合に goalScorers: [] を一括追加（未設定のドキュメントのみ）。
 * 既に得点者データが入っている試合は上書きしません。
 *
 * 使い方（プロジェクトルートに service-account.json または serviceAccount.json）:
 *   npx tsx scripts/backfill-wc-goal-scorers-field.ts --dry-run
 *   npx tsx scripts/backfill-wc-goal-scorers-field.ts
 */

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import adminPkg from "firebase-admin";

const admin = adminPkg as typeof import("firebase-admin");

const DRY_RUN = process.argv.includes("--dry-run");
const BATCH_LIMIT = 400;

const keyPath =
  process.env.GOOGLE_APPLICATION_CREDENTIALS ??
  (existsSync("service-account.json")
    ? resolve("service-account.json")
    : resolve("serviceAccount.json"));

if (!existsSync(keyPath)) {
  console.error(`サービスアカウントが見つかりません: ${keyPath}`);
  process.exit(1);
}

const serviceAccount = JSON.parse(readFileSync(keyPath, "utf-8"));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

(async () => {
  console.log("=== backfill WC games: goalScorers: [] ===");
  if (DRY_RUN) console.log(">>> DRY RUN（Firestore は更新しません）\n");

  const snap = await db.collection("games").where("league", "==", "wc").get();
  console.log(`WC 試合: ${snap.size} 件`);

  let batch = db.batch();
  let pending = 0;
  let wouldUpdate = 0;
  let skippedHasField = 0;

  for (const doc of snap.docs) {
    const data = doc.data();
    if (data.goalScorers !== undefined) {
      skippedHasField++;
      continue;
    }

    wouldUpdate++;
    console.log(`  + ${doc.id}`);

    if (!DRY_RUN) {
      batch.set(doc.ref, { goalScorers: [] }, { merge: true });
      pending++;
      if (pending >= BATCH_LIMIT) {
        await batch.commit();
        batch = db.batch();
        pending = 0;
      }
    }
  }

  if (!DRY_RUN && pending > 0) {
    await batch.commit();
  }

  console.log("\n--- 結果 ---");
  console.log(`追加対象: ${wouldUpdate} 件`);
  console.log(`スキップ（既に goalScorers あり）: ${skippedHasField} 件`);
  if (DRY_RUN && wouldUpdate > 0) {
    console.log("\n本番反映: npx tsx scripts/backfill-wc-goal-scorers-field.ts");
  }
  process.exit(0);
})().catch((e) => {
  console.error("backfill failed:", e);
  process.exit(1);
});
