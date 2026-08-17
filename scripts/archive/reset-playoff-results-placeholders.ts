/**
 * 既存の playoffResults/{season} を削除し、
 * 全15シリーズに `winner: ""` と `games: 0` のプレースホルダーを入れたドキュメントを新規作成する。
 *
 * 採点ロジックは「winner が空 or games が 4–7 以外」を公式未確定としてスキップする（lib/score-playoff-bracket.ts）。
 *
 * Usage:
 *   npx tsx scripts/reset-playoff-results-placeholders.ts 2026
 *
 * 要: プロジェクト直下に service-account.json（管理者権限）
 */

import adminPkg from "firebase-admin";
const admin = adminPkg;

import fs from "fs";

import { PLAYOFF_SERIES } from "../lib/playoff-bracket";

const serviceAccount = JSON.parse(
  fs.readFileSync("service-account.json", "utf8")
);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

const SEASON = process.argv[2]?.trim() || "2026";

const PLACEHOLDER = { winner: "", games: 0 };

const results = Object.fromEntries(
  PLAYOFF_SERIES.map((id) => [id, { ...PLACEHOLDER }])
) as Record<string, { winner: string; games: number }>;

async function main() {
  console.log(`=== RESET playoffResults/${SEASON} (delete + placeholders) ===`);

  const ref = db.collection("playoffResults").doc(SEASON);

  await ref.delete();
  console.log(`✔ deleted playoffResults/${SEASON}`);

  await ref.set({
    season: SEASON,
    results,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  console.log(`✔ wrote playoffResults/${SEASON} with ${PLAYOFF_SERIES.length} series placeholders`);
  console.log("=== DONE ===");
  process.exit(0);
}

main().catch((e) => {
  console.error("❌ failed:", e);
  process.exit(1);
});
