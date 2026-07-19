/**
 * テスト付与した WC GP 5バッジを user_badges から削除
 *
 *   npx tsx scripts/revoke-wc-2026-gp-test-grants.ts
 *   TEST_UID=xxxx npx tsx scripts/revoke-wc-2026-gp-test-grants.ts
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
  "wc_2026_gp_total_points_rank1",
  "wc_2026_gp_total_points_rank2",
  "wc_2026_gp_total_points_rank3",
  "wc_2026_gp_total_points_top20",
  "wc_2026_gp_total_points_top50",
] as const;

async function main() {
  console.log(`=== revoke WC GP test grants for ${TEST_UID} ===`);
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
