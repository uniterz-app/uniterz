/**
 * 公開 users に残る旧課金フィールドを secure/billing へ一括移行。
 *
 * Usage:
 *   GOOGLE_APPLICATION_CREDENTIALS=... npx tsx scripts/migrate-legacy-user-billing.ts
 *   DRY_RUN=1 npx tsx scripts/migrate-legacy-user-billing.ts
 */
import { getApps, initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { migrateLegacyUserBillingIfNeeded } from "../lib/billing/userBillingSecure";

const LEGACY_KEYS = [
  "stripeCustomerId",
  "stripeSubscriptionId",
  "googlePurchaseToken",
  "appleOriginalTransactionId",
] as const;

async function main() {
  if (!getApps().length) {
    initializeApp({ credential: applicationDefault() });
  }
  const db = getFirestore();
  const dryRun = process.env.DRY_RUN === "1" || process.env.DRY_RUN === "true";
  let scanned = 0;
  let migrated = 0;
  let last: FirebaseFirestore.QueryDocumentSnapshot | undefined;

  for (;;) {
    let q = db.collection("users").orderBy("__name__").limit(200);
    if (last) q = q.startAfter(last);
    const snap = await q.get();
    if (snap.empty) break;

    for (const doc of snap.docs) {
      scanned += 1;
      const data = doc.data();
      const has = LEGACY_KEYS.some(
        (k) => data[k] != null && String(data[k]).trim()
      );
      if (!has) continue;
      if (dryRun) {
        migrated += 1;
        console.log(`[dry-run] would migrate ${doc.id}`);
        continue;
      }
      const ok = await migrateLegacyUserBillingIfNeeded(db, doc.id, data);
      if (ok) {
        migrated += 1;
        console.log(`migrated ${doc.id}`);
      }
    }

    last = snap.docs[snap.docs.length - 1];
    if (snap.size < 200) break;
  }

  console.log(JSON.stringify({ dryRun, scanned, migrated }, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
