/**
 * プレーオフ 2025-26 カンファレンスファイナル（総合得点順位想定）用バッジを master_badges に登録。
 * 画像は public/2026-Po-CF/ に配置済み前提。
 *
 *   npm run badges:pocf:seed
 *   npx tsx scripts/seed-po-2026-cf-badges.ts
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

const ICON_BASE = "/2026-Po-CF";

const BADGES: Array<{
  id: string;
  title: string;
  description: string;
  icon: string;
}> = [
  {
    id: "po_2026_cf_total_points_rank1",
    title: "Po CF 総合得点 1st (25-26)",
    description:
      "2025-26 プレーオフ カンファレンスファイナルの総合得点1位に授与されるバッジ。",
    icon: `${ICON_BASE}/CF1st.png`,
  },
  {
    id: "po_2026_cf_total_points_rank2",
    title: "Po CF 総合得点 2nd (25-26)",
    description:
      "2025-26 プレーオフ カンファレンスファイナルの総合得点2位に授与されるバッジ。",
    icon: `${ICON_BASE}/CF2nd.png`,
  },
  {
    id: "po_2026_cf_total_points_rank3",
    title: "Po CF 総合得点 3rd (25-26)",
    description:
      "2025-26 プレーオフ カンファレンスファイナルの総合得点3位に授与されるバッジ。",
    icon: `${ICON_BASE}/CF3rd.png`,
  },
  {
    id: "po_2026_cf_total_points_top20",
    title: "Po CF 総合得点 Top20 (25-26)",
    description:
      "2025-26 プレーオフ カンファレンスファイナルの総合得点4〜20位に授与されるバッジ。",
    icon: `${ICON_BASE}/CF20th.png`,
  },
  {
    id: "po_2026_cf_total_points_top50",
    title: "Po CF 総合得点 Top50 (25-26)",
    description:
      "2025-26 プレーオフ カンファレンスファイナルの総合得点21〜50位に授与されるバッジ。",
    icon: `${ICON_BASE}/CF50th.png`,
  },
];

async function seed() {
  console.log("=== seed PO 2026 CF badges ===");
  for (const b of BADGES) {
    await db.collection("master_badges").doc(b.id).set(
      {
        title: b.title,
        description: b.description,
        icon: b.icon,
        league: "nba",
        season: "2025-26",
        type: "ranking",
        phase: "conference_finals",
      },
      { merge: true }
    );
    console.log(`ok ${b.id}`);
  }
  console.log("=== done ===");
  process.exit(0);
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
