/**
 * 指定ユーザーの wc-2026-J-jor-dza 予想を元の 1–1（引き分け・jor-olwan）に戻す。
 *
 *   npx tsx scripts/patch-user-wc-prediction-jor-dza.ts --dry-run
 *   npx tsx scripts/patch-user-wc-prediction-jor-dza.ts
 */

import adminPkg from "firebase-admin";
import fs from "fs";
import { FieldValue } from "firebase-admin/firestore";

const admin = adminPkg as typeof import("firebase-admin");

const UID = "Rb3vF67NTLeCxSvrR15brCbiQSD2";
const GAME_ID = "wc-2026-J-jor-dza";
const PREDICTION = {
  winner: "draw" as const,
  score: { home: 1, away: 1 },
  goalScorer: { playerId: "jor-olwan", teamId: "wc-jor" },
};

const DRY_RUN = process.argv.includes("--dry-run");

if (!fs.existsSync("service-account.json")) {
  console.error("service-account.json が見つかりません");
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(
    JSON.parse(fs.readFileSync("service-account.json", "utf8"))
  ),
});

const db = admin.firestore();

(async () => {
  console.log(`=== patch prediction: ${UID} / ${GAME_ID} ===`);
  if (DRY_RUN) console.log(">>> DRY RUN\n");

  const snap = await db
    .collection("posts")
    .where("authorUid", "==", UID)
    .where("gameId", "==", GAME_ID)
    .where("schemaVersion", "==", 2)
    .limit(1)
    .get();

  if (snap.empty) {
    console.error("投稿が見つかりません");
    process.exit(1);
  }

  const doc = snap.docs[0]!;
  const before = doc.data();

  console.log("postId:", doc.id);
  console.log("before:", JSON.stringify(before.prediction, null, 2));

  if (before.settledAt) {
    console.warn(
      "⚠ 精算済み投稿です。スコア・得点者だけ変更します（再精算は別途必要な場合があります）。"
    );
  }

  const patch = {
    "prediction.winner": PREDICTION.winner,
    "prediction.score.home": PREDICTION.score.home,
    "prediction.score.away": PREDICTION.score.away,
    "prediction.goalScorer": PREDICTION.goalScorer,
    updatedAt: FieldValue.serverTimestamp(),
  };

  console.log("after:", PREDICTION);

  if (!DRY_RUN) {
    await doc.ref.update(patch);
    console.log("\n✓ 更新しました");
  }

  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
