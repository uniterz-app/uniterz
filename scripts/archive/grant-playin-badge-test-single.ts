/**
 * プレーイン用バッジを1ユーザーだけに付与（表示・解像度の確認用）
 *
 * 例（1位バッジ）:
 *   npx tsx scripts/grant-playin-badge-test-single.ts
 *
 * 別バッジ ID を試す:
 *   BADGE_ID=playin_2026_total_points_rank4_20 npx tsx scripts/grant-playin-badge-test-single.ts
 *
 * 別 UID:
 *   TEST_UID=xxxx npx tsx scripts/grant-playin-badge-test-single.ts
 *
 * Prerequisite: run seed-playin-2026-total-points-badges.ts so master_badges has this badgeId (icon URL).
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
  process.env.TEST_UID ?? "S6r5KyS9XcXds3Pm7koLzzELrvs2";
const BADGE_ID =
  process.env.BADGE_ID ?? "playin_2026_total_points_rank1";

const ALLOWED = new Set([
  "playin_2026_total_points_rank1",
  "playin_2026_total_points_rank2",
  "playin_2026_total_points_rank3",
  "playin_2026_total_points_rank4_20",
]);

async function main() {
  if (!ALLOWED.has(BADGE_ID)) {
    console.error(`BADGE_ID must be one of: ${[...ALLOWED].join(", ")}`);
    process.exit(1);
  }

  const master = await db.collection("master_badges").doc(BADGE_ID).get();
  if (!master.exists) {
    console.warn(
      `master_badges/${BADGE_ID} が無いです。先に npx tsx scripts/seed-playin-2026-total-points-badges.ts を実行してください。`
    );
  } else {
    const d = master.data();
    console.log("master:", { title: d?.title, icon: d?.icon });
  }

  const ref = db
    .collection("user_badges")
    .doc(TEST_UID)
    .collection("badges")
    .doc(BADGE_ID);

  await ref.set(
    {
      badgeId: BADGE_ID,
      grantedAt: admin.firestore.FieldValue.serverTimestamp(),
      meta: {
        phase: "play_in",
        metric: "totalPoints",
        source: "playin_2026_test_grant",
      },
    },
    { merge: true }
  );

  console.log(`ok granted ${BADGE_ID} -> ${TEST_UID}`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
