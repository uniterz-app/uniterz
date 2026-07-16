/**
 * WC 2026 グループステージ（総合得点順位想定）用バッジを master_badges に登録。
 * 画像は public/2026-WC-GP/ に配置済み前提。
 *
 *   npx tsx scripts/seed-wc-2026-gp-badges.ts
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

const ICON_BASE = "/2026-WC-GP";

const BADGES: Array<{
  id: string;
  title: string;
  description: string;
  icon: string;
}> = [
  {
    id: "wc_2026_gp_total_points_rank1",
    title: "WC GP 総合得点 1st (2026)",
    description:
      "2026 FIFAワールドカップ グループステージの総合得点1位に授与されるバッジ。",
    icon: `${ICON_BASE}/wc2026GP1st.png`,
  },
  {
    id: "wc_2026_gp_total_points_rank2",
    title: "WC GP 総合得点 2nd (2026)",
    description:
      "2026 FIFAワールドカップ グループステージの総合得点2位に授与されるバッジ。",
    icon: `${ICON_BASE}/wc2026GP2nd.png`,
  },
  {
    id: "wc_2026_gp_total_points_rank3",
    title: "WC GP 総合得点 3rd (2026)",
    description:
      "2026 FIFAワールドカップ グループステージの総合得点3位に授与されるバッジ。",
    icon: `${ICON_BASE}/wc2026GP3rd.png`,
  },
  {
    id: "wc_2026_gp_total_points_top20",
    title: "WC GP 総合得点 Top20 (2026)",
    description:
      "2026 FIFAワールドカップ グループステージの総合得点4〜20位に授与されるバッジ。",
    icon: `${ICON_BASE}/wc2026GPtop20.png`,
  },
  {
    id: "wc_2026_gp_total_points_top50",
    title: "WC GP 総合得点 Top50 (2026)",
    description:
      "2026 FIFAワールドカップ グループステージの総合得点21〜50位に授与されるバッジ。",
    icon: `${ICON_BASE}/wc2026GPTop50.png`,
  },
];

async function seed() {
  console.log("=== seed WC 2026 GP badges ===");
  for (const b of BADGES) {
    await db.collection("master_badges").doc(b.id).set(
      {
        title: b.title,
        description: b.description,
        icon: b.icon,
        league: "wc",
        season: "2026",
        type: "ranking",
        phase: "group_stage",
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
