/**
 * 提出忘れ分として playoffBrackets にドキュメントを1件だけ追加する（他コレクションは触らない）。
 * 公式結果がまだない前提で、クライアント提出直後と同様にスコアはすべて 0。
 *
 *   npx tsx scripts/admin-import-playoff-bracket-user.ts
 *
 * 前提: リポジトリ直下に service-account.json
 * 既存ドキュメントがある場合: --overwrite
 */

import adminPkg from "firebase-admin";
import fs from "fs";
import type { SeriesId } from "../lib/playoff-bracket";
import type { BracketState } from "../lib/playoff-bracket-firestore";
import { isPlayoffBracketComplete } from "../lib/playoff-bracket";

const admin = adminPkg;

const SEASON = "2026";
const UID = "RwJLVZq3R9hMAoaS6EG92pyyn1p1";

const BRACKET: BracketState = {
  R1_E1: { winner: "DET", games: 5 },
  R1_E2: { winner: "TOR", games: 6 },
  R1_E3: { winner: "BOS", games: 4 },
  R1_E4: { winner: "NYK", games: 7 },
  R1_W1: { winner: "OKC", games: 4 },
  R1_W2: { winner: "HOU", games: 5 },
  R1_W3: { winner: "SAS", games: 6 },
  R1_W4: { winner: "DEN", games: 7 },
  R2_E1: { winner: "DET", games: 6 },
  R2_E2: { winner: "BOS", games: 5 },
  R2_W1: { winner: "OKC", games: 4 },
  R2_W2: { winner: "DEN", games: 7 },
  CF_E: { winner: "DET", games: 7 },
  CF_W: { winner: "OKC", games: 7 },
  FINALS: { winner: "OKC", games: 6 },
};

async function main() {
  const overwrite = process.argv.includes("--overwrite");

  const serviceAccount = JSON.parse(
    fs.readFileSync("service-account.json", "utf8")
  );

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }

  const db = admin.firestore();
  const docId = `${SEASON}_${UID}`;
  const ref = db.collection("playoffBrackets").doc(docId);

  const existing = await ref.get();
  if (existing.exists && !overwrite) {
    console.error(
      `❌ ${docId} は既に存在します。上書きする場合は --overwrite を付けてください。`
    );
    process.exit(1);
  }

  if (
    !isPlayoffBracketComplete(
      BRACKET as Partial<Record<SeriesId, { winner: string; games: number }>>
    )
  ) {
    console.error("❌ ブラケットが未完成です。");
    process.exit(1);
  }

  const championPick = BRACKET.FINALS?.winner ?? null;

  await ref.set(
    {
      uid: UID,
      season: SEASON,
      bracket: BRACKET,
      championPick,
      isSubmitted: true,
      submittedAt: admin.firestore.FieldValue.serverTimestamp(),
      totalScore: 0,
      winnerPoints: 0,
      gamesPoints: 0,
      alive: true,
      firstMissSeriesId: null,
    },
    { merge: false }
  );

  console.log(`✔ playoffBrackets/${docId} のみ作成（他コレクション・タスクは未操作）`);
  process.exit(0);
}

main().catch((e) => {
  console.error("❌ failed:", e);
  process.exit(1);
});
