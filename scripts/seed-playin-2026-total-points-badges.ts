/**
 * npx tsx scripts/seed-playin-2026-total-points-badges.ts
 *
 * プレーイン 2025-26 トータルポイント順位用バッジを master_badges に登録。
 * 画像は public/play-in2026badge/ に配置済み前提（本番では同一オリジンのパスで参照）。
 *
 * 一部だけ登録（例: 1位の PNG だけ用意したとき）:
 *   PLAYIN_2026_BADGE_IDS=playin_2026_total_points_rank1 npx tsx scripts/seed-playin-2026-total-points-badges.ts
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

/** デプロイ後のオリジンが決まっているなら https://... に差し替えてもよい */
const ICON_BASE = "/play-in2026badge";

const BADGES: Array<{
  id: string;
  title: string;
  description: string;
  icon: string;
}> = [
  {
    id: "playin_2026_total_points_rank1",
    title: "PLAY IN トータルポイント 1位（2025-26）",
    description:
      "2025-26 プレーイン期間のトータルポイントランキング1位に授与されるバッジ。",
    icon: `${ICON_BASE}/1st.png`,
  },
  {
    id: "playin_2026_total_points_rank2",
    title: "PLAY IN トータルポイント 2位（2025-26）",
    description:
      "2025-26 プレーイン期間のトータルポイントランキング2位に授与されるバッジ。",
    icon: `${ICON_BASE}/2nd.png`,
  },
  {
    id: "playin_2026_total_points_rank3",
    title: "PLAY IN トータルポイント 3位（2025-26）",
    description:
      "2025-26 プレーイン期間のトータルポイントランキング3位に授与されるバッジ。",
    icon: `${ICON_BASE}/3rd.png`,
  },
  {
    id: "playin_2026_total_points_rank4_20",
    title: "PLAY IN トータルポイント TOP20（2025-26）",
    description:
      "2025-26 プレーイン期間のトータルポイントランキング4位〜20位に授与されるバッジ。",
    icon: `${ICON_BASE}/top20.png`,
  },
];

const FILTER_IDS = process.env.PLAYIN_2026_BADGE_IDS?.split(",")
  .map((s) => s.trim())
  .filter(Boolean);

async function seed() {
  const list =
    FILTER_IDS && FILTER_IDS.length > 0
      ? BADGES.filter((b) => FILTER_IDS.includes(b.id))
      : BADGES;

  if (FILTER_IDS?.length && list.length === 0) {
    console.error(
      `PLAYIN_2026_BADGE_IDS に一致する IDがありません。想定: ${BADGES.map((b) => b.id).join(", ")}`
    );
    process.exit(1);
  }

  console.log("=== seed play-in 2026 total points badges ===");
  if (FILTER_IDS?.length) {
    console.log("filter:", FILTER_IDS.join(", "));
  }
  for (const b of list) {
    await db.collection("master_badges").doc(b.id).set(
      {
        title: b.title,
        description: b.description,
        icon: b.icon,
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
