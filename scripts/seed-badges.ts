/**
 * npx ts-node scripts/seed-badges.ts
 */

import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "fs";
import { resolve } from "path";

const serviceAccountPath = resolve(process.cwd(), "serviceAccount.json");
const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, "utf8"));

initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();

const badges = [
  {
    id: "monthly_champion",
    title: "月間王者（ALL 1位）",
    description: "その月の総合ランキング1位に授与される称号。",
    icon: "https://your-badge-icon/all_1.png"
  },
  { id: "monthly_all_2", title: "月間 ALL 2位", description: "その月の総合ランキング2位に授与される称号。", icon: "https://your-badge-icon/all_2.png" },
  { id: "monthly_all_3", title: "月間 ALL 3位", description: "その月の総合ランキング3位に授与される称号。", icon: "https://your-badge-icon/all_3.png" },
  { id: "monthly_all_4", title: "月間 ALL 4位", description: "その月の総合ランキング4位に授与される称号。", icon: "https://your-badge-icon/all_4.png" },
  { id: "monthly_all_5", title: "月間 ALL 5位", description: "その月の総合ランキング5位に授与される称号。", icon: "https://your-badge-icon/all_5.png" },
  { id: "monthly_all_6", title: "月間 ALL 6位", description: "その月の総合ランキング6位に授与される称号。", icon: "https://your-badge-icon/all_6.png" },
  { id: "monthly_all_7", title: "月間 ALL 7位", description: "その月の総合ランキング7位に授与される称号。", icon: "https://your-badge-icon/all_7.png" },
  { id: "monthly_all_8", title: "月間 ALL 8位", description: "その月の総合ランキング8位に授与される称号。", icon: "https://your-badge-icon/all_8.png" },
  { id: "monthly_all_9", title: "月間 ALL 9位", description: "その月の総合ランキング9位に授与される称号。", icon: "https://your-badge-icon/all_9.png" },
  { id: "monthly_all_10", title: "月間 ALL 10位", description: "その月の総合ランキング10位に授与される称号。", icon: "https://your-badge-icon/all_10.png" },
  { id: "monthly_all_11_20", title: "月間 ALL 11〜20位", description: "その月の総合ランキング11〜20位に授与される称号。", icon: "https://your-badge-icon/all_11_20.png" },

  { id: "monthly_b_1", title: "月間 B1 1位", description: "その月のBリーグランキング1位に授与される称号。", icon: "https://your-badge-icon/b_1.png" },
  { id: "monthly_b_2", title: "月間 B1 2位", description: "その月のBリーグランキング2位に授与される称号。", icon: "https://your-badge-icon/b_2.png" },
  { id: "monthly_b_3", title: "月間 B1 3位", description: "その月のBリーグランキング3位に授与される称号。", icon: "https://your-badge-icon/b_3.png" },
  { id: "monthly_b_4", title: "月間 B1 4位", description: "その月のBリーグランキング4位に授与される称号。", icon: "https://your-badge-icon/b_4.png" },
  { id: "monthly_b_5", title: "月間 B1 5位", description: "その月のBリーグランキング5位に授与される称号。", icon: "https://your-badge-icon/b_5.png" },
  { id: "monthly_b_6_10", title: "月間 B1 6〜10位", description: "その月のBリーグランキング6〜10位に授与される称号。", icon: "https://your-badge-icon/b_6_10.png" },

  { id: "monthly_j_1", title: "月間 J1 1位", description: "その月のJリーグランキング1位に授与される称号。", icon: "https://your-badge-icon/j_1.png" },
  { id: "monthly_j_2", title: "月間 J1 2位", description: "その月のJリーグランキング2位に授与される称号。", icon: "https://your-badge-icon/j_2.png" },
  { id: "monthly_j_3", title: "月間 J1 3位", description: "その月のJリーグランキング3位に授与される称号。", icon: "https://your-badge-icon/j_3.png" },
  { id: "monthly_j_4", title: "月間 J1 4位", description: "その月のJリーグランキング4位に授与される称号。", icon: "https://your-badge-icon/j_4.png" },
  { id: "monthly_j_5", title: "月間 J1 5位", description: "その月のJリーグランキング5位に授与される称号。", icon: "https://your-badge-icon/j_5.png" },
  { id: "monthly_j_6_10", title: "月間 J1 6〜10位", description: "その月のJリーグランキング6〜10位に授与される称号。", icon: "https://your-badge-icon/j_6_10.png" }
];

async function seed() {
  console.log("=== master_badges seeding start ===");

  for (const badge of badges) {
    await db.collection("master_badges").doc(badge.id).set(badge, { merge: true });
    console.log(`✔ Created: ${badge.id}`);
  }

  console.log("=== master_badges seeding completed ===");
}

seed();
