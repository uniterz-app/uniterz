/**
 * テスト付与した PO CF 5バッジを user_badges から削除
 *
 *   npm run badges:pocf:revoke-test
 *   TEST_UID=xxxx npx tsx scripts/revoke-po-2026-cf-test-grants.ts
 */

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

const TEST_UID =
  process.env.TEST_UID ?? "Rb3vF67NTLeCxSvrR15brCbiQSD2";

const BADGE_IDS = [
  "po_2026_cf_total_points_rank1",
  "po_2026_cf_total_points_rank2",
  "po_2026_cf_total_points_rank3",
  "po_2026_cf_total_points_top20",
  "po_2026_cf_total_points_top50",
] as const;

async function main() {
  console.log(`=== revoke PO CF test grants for ${TEST_UID} ===`);
  for (const badgeId of BADGE_IDS) {
    const ref = db
      .collection("user_badges")
      .doc(TEST_UID)
      .collection("badges")
      .doc(badgeId);
    await ref.delete();
    console.log(`deleted ${badgeId}`);
  }
  console.log("=== done ===");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
