/**
 * プレーオフ 2025-26 全体（総合得点順位想定）用バッジを master_badges に登録。
 * 画像は public/2026-Po-All/ に配置済み前提。
 *
 *   npx tsx scripts/seed-po-2026-all-badges.ts
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

const ICON_BASE = "/2026-Po-All";

const BADGES: Array<{
  id: string;
  title: string;
  description: string;
  icon: string;
}> = [
  {
    id: "po_2026_all_total_points_rank1",
    title: "Po All 総合得点 1st (25-26)",
    description:
      "2025-26 プレーオフ全体の総合得点1位に授与されるバッジ。",
    icon: `${ICON_BASE}/nbaPlayoffAll20261st.png`,
  },
  {
    id: "po_2026_all_total_points_rank2",
    title: "Po All 総合得点 2nd (25-26)",
    description:
      "2025-26 プレーオフ全体の総合得点2位に授与されるバッジ。",
    icon: `${ICON_BASE}/nbaPlayoffAll20262nd.png`,
  },
  {
    id: "po_2026_all_total_points_rank3",
    title: "Po All 総合得点 3rd (25-26)",
    description:
      "2025-26 プレーオフ全体の総合得点3位に授与されるバッジ。",
    icon: `${ICON_BASE}/nbaPlayoffAll20263rd.png`,
  },
  {
    id: "po_2026_all_total_points_top20",
    title: "Po All 総合得点 Top20 (25-26)",
    description:
      "2025-26 プレーオフ全体の総合得点4〜20位に授与されるバッジ。",
    icon: `${ICON_BASE}/nbaPlayoffAll2026top20.png`,
  },
  {
    id: "po_2026_all_total_points_top50",
    title: "Po All 総合得点 Top50 (25-26)",
    description:
      "2025-26 プレーオフ全体の総合得点21〜50位に授与されるバッジ。",
    icon: `${ICON_BASE}/nbaPlayoffAll2026Top50.png`,
  },
];

async function seed() {
  console.log("=== seed PO 2026 All badges ===");
  for (const b of BADGES) {
    await db.collection("master_badges").doc(b.id).set(
      {
        title: b.title,
        description: b.description,
        icon: b.icon,
        league: "nba",
        season: "2025-26",
        type: "ranking",
        phase: "playoffs_all",
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
