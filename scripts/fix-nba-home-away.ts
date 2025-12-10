/**
 * NBA の試合データ（games コレクション）で
 * home / away を完全に反転させるスクリプト（finalScore 無視）
 *
 * 実行方法:
 *   # dry-run（書き込まない）
 *   npx ts-node --transpile-only scripts/fix-nba-games.ts --dry-run
 *
 *   # 実際に反映
 *   npx ts-node --transpile-only scripts/fix-nba-games.ts
 */

import * as admin from "firebase-admin";
import fs from "fs";

const serviceAccount = JSON.parse(
  fs.readFileSync("service-account.json", "utf8")
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// DRY RUN
const DRY_RUN = process.argv.includes("--dry-run");

async function main() {
  console.log("=== NBA 試合の home/away 反転スクリプト ===");
  console.log(DRY_RUN ? ">>> DRY RUN モード\n" : "");

  const snap = await db
    .collection("games")
    .where("league", "==", "nba")
    .get();

  console.log(`対象試合数: ${snap.size} 件`);

  for (const docSnap of snap.docs) {
    const game = docSnap.data();
    const id = docSnap.id;

    console.log(`\n--- 処理中: ${id} ---`);

    // バックアップ
    const original = JSON.parse(JSON.stringify(game));

    // 1. home / away
    const newHome = { ...game.away };
    const newAway = { ...game.home };

    // 2. homeScore / awayScore
    const newHomeScore = game.awayScore ?? null;
    const newAwayScore = game.homeScore ?? null;

    // 3. score（存在する場合）
    const newScore = game.score
      ? {
          home: game.score.away ?? null,
          away: game.score.home ?? null,
        }
      : null;

    const updateData = {
      home: newHome,
      away: newAway,
      homeScore: newHomeScore,
      awayScore: newAwayScore,
      score: newScore,
    };

    console.log("更新内容:", updateData);

    if (DRY_RUN) {
      console.log("→ DRY RUN のため Firestore は更新しません");
      continue;
    }

    await db.collection("games").doc(id).update(updateData);

    fs.writeFileSync(
      `./backup-game-${id}.json`,
      JSON.stringify(original, null, 2),
      "utf8"
    );

    console.log(`更新完了: ${id}`);
  }

  console.log("\n=== 全試合の反転が完了しました ===");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
