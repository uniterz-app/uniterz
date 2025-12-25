/**
 * Premier League teams を teams コレクションに一括投入するスクリプト
 *
 * 実行:
 *   npx ts-node scripts/seed-pl-teams.ts
 *
 * 前提:
 *   - service-account.json がプロジェクトルートに存在
 *   - teamId は絶対に変更しない
 */

// ---- firebase-admin を ESM で使う安定版 ----
// @ts-ignore
import adminPkg from "firebase-admin";
const admin = adminPkg;

import fs from "fs";

// ===== Firebase Admin 初期化 =====
const serviceAccount = JSON.parse(
  fs.readFileSync("service-account.json", "utf8")
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// ===== Premier League Teams =====
// ⚠ teamId は絶対に変更しない
const PL_TEAMS = [
  { id: "pl-arsenal", name: "Arsenal" },
  { id: "pl-aston-villa", name: "Aston Villa" },
  { id: "pl-bournemouth", name: "Bournemouth" },
  { id: "pl-brentford", name: "Brentford" },
  { id: "pl-brighton", name: "Brighton & Hove Albion" },
  { id: "pl-chelsea", name: "Chelsea" },
  { id: "pl-crystal-palace", name: "Crystal Palace" },
  { id: "pl-everton", name: "Everton" },
  { id: "pl-fulham", name: "Fulham" },
  { id: "pl-ipswich", name: "Ipswich Town" },
  { id: "pl-leicester", name: "Leicester City" },
  { id: "pl-liverpool", name: "Liverpool" },
  { id: "pl-man-city", name: "Manchester City" },
  { id: "pl-man-united", name: "Manchester United" },
  { id: "pl-newcastle", name: "Newcastle United" },
  { id: "pl-nottingham", name: "Nottingham Forest" },
  { id: "pl-southampton", name: "Southampton" },
  { id: "pl-tottenham", name: "Tottenham Hotspur" },
  { id: "pl-west-ham", name: "West Ham United" },
  { id: "pl-wolves", name: "Wolverhampton Wanderers" },
];

// ===== Seed 処理 =====
(async () => {
  console.log("=== Premier League teams seeding START ===");

  const batch = db.batch();

  for (const team of PL_TEAMS) {
    const ref = db.collection("teams").doc(team.id);

    batch.set(
      ref,
      {
        teamId: team.id,
        league: "pl",

        name: team.name,

        // ---- 成績（サッカー対応）----
        wins: 0,
        losses: 0,
        draws: 0, // ← ★ draw は d ではなく draws 推奨

        // ---- ランキング用 ----
        winRate: 0,
        rank: null,

        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true } // 何度実行しても安全
    );

    console.log(`✔ queued: ${team.id}`);
  }

  await batch.commit();

  console.log("=== Premier League teams seeding COMPLETED ===");
  process.exit(0);
})().catch((e) => {
  console.error("❌ seed failed:", e);
  process.exit(1);
});
