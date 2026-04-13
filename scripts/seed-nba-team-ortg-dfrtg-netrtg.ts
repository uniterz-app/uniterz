/**
 * teams コレクション（NBA）に ofrtg / dfrtg / netrtg を merge 書き込み
 *
 * 前提: リポジトリルートに service-account.json
 * 実行: npx tsx scripts/seed-nba-team-ortg-dfrtg-netrtg.ts
 */

import adminPkg from "firebase-admin";
import fs from "fs";

const admin = adminPkg;

const serviceAccount = JSON.parse(
  fs.readFileSync("service-account.json", "utf8")
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

/**
 * teamId -> { ofrtg, dfrtg, netrtg } (netrtg は符号付きのまま保存)
 * 全30チーム。East/West 各1–6 は既存シード、7–15 はユーザー提供の表。
 */
const NBA_TEAM_RTG: Record<
  string,
  { ofrtg: number; dfrtg: number; netrtg: number }
> = {
  // East 1–6
  "nba-pistons": { ofrtg: 117.3, dfrtg: 108.9, netrtg: 8.4 },
  "nba-celtics": { ofrtg: 120.0, dfrtg: 111.7, netrtg: 8.3 },
  "nba-knicks": { ofrtg: 118.7, dfrtg: 112.3, netrtg: 6.4 },
  "nba-cavaliers": { ofrtg: 118.3, dfrtg: 114.2, netrtg: 4.1 },
  "nba-raptors": { ofrtg: 115.0, dfrtg: 112.1, netrtg: 2.9 },
  "nba-hawks": { ofrtg: 115.0, dfrtg: 112.9, netrtg: 2.2 },
  // East 7–15
  "nba-76ers": { ofrtg: 114.3, dfrtg: 114.4, netrtg: -0.1 },
  "nba-magic": { ofrtg: 114.2, dfrtg: 113.6, netrtg: 0.6 },
  "nba-hornets": { ofrtg: 118.4, dfrtg: 113.5, netrtg: 4.9 },
  "nba-heat": { ofrtg: 115.8, dfrtg: 113.6, netrtg: 2.1 },
  "nba-bucks": { ofrtg: 112.2, dfrtg: 118.3, netrtg: -6.1 },
  "nba-bulls": { ofrtg: 112.1, dfrtg: 117.4, netrtg: -5.3 },
  "nba-nets": { ofrtg: 108.2, dfrtg: 118.2, netrtg: -10.0 },
  "nba-pacers": { ofrtg: 110.1, dfrtg: 117.9, netrtg: -7.8 },
  "nba-wizards": { ofrtg: 109.7, dfrtg: 121.5, netrtg: -11.8 },
  // West 1–6
  "nba-thunder": { ofrtg: 117.6, dfrtg: 106.5, netrtg: 11.1 },
  "nba-spurs": { ofrtg: 118.7, dfrtg: 110.4, netrtg: 8.4 },
  "nba-nuggets": { ofrtg: 121.2, dfrtg: 116.0, netrtg: 5.2 },
  "nba-lakers": { ofrtg: 117.0, dfrtg: 115.5, netrtg: 1.5 },
  "nba-rockets": { ofrtg: 117.5, dfrtg: 112.1, netrtg: 5.4 },
  "nba-timberwolves": { ofrtg: 115.5, dfrtg: 112.4, netrtg: 3.1 },
  // West 7–15
  "nba-suns": { ofrtg: 114.2, dfrtg: 112.9, netrtg: 1.4 },
  "nba-blazers": { ofrtg: 113.1, dfrtg: 113.5, netrtg: -0.4 },
  "nba-clippers": { ofrtg: 116.3, dfrtg: 115.2, netrtg: 1.1 },
  "nba-warriors": { ofrtg: 113.8, dfrtg: 114.4, netrtg: -0.5 },
  "nba-pelicans": { ofrtg: 113.2, dfrtg: 117.6, netrtg: -4.4 },
  "nba-mavericks": { ofrtg: 110.3, dfrtg: 115.5, netrtg: -5.2 },
  "nba-grizzlies": { ofrtg: 112.4, dfrtg: 118.4, netrtg: -6.0 },
  "nba-kings": { ofrtg: 110.6, dfrtg: 120.3, netrtg: -9.7 },
  "nba-jazz": { ofrtg: 112.7, dfrtg: 120.8, netrtg: -8.2 },
};

async function main() {
  console.log("=== seed NBA ofrtg / dfrtg / netrtg ===");
  let batch = db.batch();
  let n = 0;
  for (const [teamId, rtg] of Object.entries(NBA_TEAM_RTG)) {
    const ref = db.doc(`teams/${teamId}`);
    batch.set(
      ref,
      {
        ...rtg,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    n++;
    if (n % 400 === 0) {
      await batch.commit();
      batch = db.batch();
    }
  }
  await batch.commit();
  console.log(`OK: updated ${Object.keys(NBA_TEAM_RTG).length} teams`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
