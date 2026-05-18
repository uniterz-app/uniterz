/**
 * プレーオフ 2025-26 第2ラウンド（総合得点順位想定）用バッジを master_badges に登録。
 * 画像は public/2026-Po-2ndRound/ に配置済み前提。
 *
 *   npm run badges:po2:seed
 *   npx tsx scripts/seed-po-2026-2nd-round-badges.ts
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

const ICON_BASE = "/2026-Po-2ndRound";

const BADGES: Array<{
  id: string;
  title: string;
  description: string;
  icon: string;
}> = [
  {
    id: "po_2026_2nd_round_total_points_rank1",
    title: "Po 2nd Round 総合得点 1st (25-26)",
    description:
      "2025-26 プレーオフ 2ndRoundの総合得点1位に授与されるバッジ。",
    icon: `${ICON_BASE}/2ndRound-1st.png`,
  },
  {
    id: "po_2026_2nd_round_total_points_rank2",
    title: "Po 2nd Round 総合得点 2nd (25-26)",
    description:
      "2025-26 プレーオフ 2ndRoundの総合得点2位に授与されるバッジ。",
    icon: `${ICON_BASE}/2ndRound-2nd.png`,
  },
  {
    id: "po_2026_2nd_round_total_points_rank3",
    title: "Po 2nd Round 総合得点 3rd (25-26)",
    description:
      "2025-26 プレーオフ 2ndRoundの総合得点3位に授与されるバッジ。",
    icon: `${ICON_BASE}/2ndRound-3rd.png`,
  },
  {
    id: "po_2026_2nd_round_total_points_top20",
    title: "Po 2nd Round 総合得点 Top20 (25-26)",
    description:
      "2025-26 プレーオフ 2ndRoundの総合得点4〜20位に授与されるバッジ。",
    icon: `${ICON_BASE}/2ndRound-20th.png`,
  },
  {
    id: "po_2026_2nd_round_total_points_top50",
    title: "Po 2nd Round 総合得点 Top50 (25-26)",
    description:
      "2025-26 プレーオフ 2ndRoundの総合得点21〜50位に授与されるバッジ。",
    icon: `${ICON_BASE}/2ndRound-50th.png`,
  },
];

async function seed() {
  console.log("=== seed PO 2026 2nd round badges ===");
  for (const b of BADGES) {
    await db.collection("master_badges").doc(b.id).set(
      {
        title: b.title,
        description: b.description,
        icon: b.icon,
        league: "nba",
        season: "2025-26",
        type: "ranking",
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
