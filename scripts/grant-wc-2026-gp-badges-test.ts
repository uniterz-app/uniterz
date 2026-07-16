/**
 * WC GP 用バッジを1ユーザーに5つまとめて付与（表示・サイズ確認用）
 *
 *   npx tsx scripts/grant-wc-2026-gp-badges-test.ts
 *
 * 別 UID:
 *   TEST_UID=xxxx npx tsx scripts/grant-wc-2026-gp-badges-test.ts
 *
 * 前提: scripts/seed-wc-2026-gp-badges.ts を実行済み（master_badges に icon あり）
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
  console.log(`=== grant WC GP badges (test) -> ${TEST_UID} ===`);

  for (const badgeId of BADGE_IDS) {
    const master = await db.collection("master_badges").doc(badgeId).get();
    if (!master.exists) {
      console.warn(
        `master_badges/${badgeId} がありません。先に npx tsx scripts/seed-wc-2026-gp-badges.ts を実行してください。`
      );
    } else {
      const d = master.data();
      console.log(`${badgeId}:`, { title: d?.title, icon: d?.icon });
    }

    const ref = db
      .collection("user_badges")
      .doc(TEST_UID)
      .collection("badges")
      .doc(badgeId);

    await ref.set(
      {
        badgeId,
        grantedAt: admin.firestore.FieldValue.serverTimestamp(),
        meta: {
          phase: "group_stage",
          metric: "totalPoints",
          source: "wc_2026_gp_test_grant",
        },
      },
      { merge: true }
    );
    console.log(`ok granted ${badgeId}`);
  }

  console.log("=== done ===");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
