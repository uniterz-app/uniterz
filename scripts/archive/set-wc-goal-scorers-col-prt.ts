/**
 * wc-2026-K-col-prt（コロンビア 0–0 ポルトガル）のスコア・goalScorers を Firestore に投入。
 *
 *   npx tsx scripts/set-wc-goal-scorers-col-prt.ts --with-score
 *   npx tsx scripts/set-wc-goal-scorers-col-prt.ts --force
 */

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import adminPkg from "firebase-admin";

const admin = adminPkg as typeof import("firebase-admin");

const DEFAULT_GAME_ID = "wc-2026-K-col-prt";

const DRY_RUN = process.argv.includes("--dry-run");
const WITH_SCORE = process.argv.includes("--with-score");
const FORCE = process.argv.includes("--force");

const gameIdArg = process.argv.find((a) => a.startsWith("--game-id="));
const GAME_ID = gameIdArg?.slice("--game-id=".length).trim() || DEFAULT_GAME_ID;

const keyPath =
  process.env.GOOGLE_APPLICATION_CREDENTIALS ??
  (existsSync("service-account.json")
    ? resolve("service-account.json")
    : resolve("serviceAccount.json"));

if (!existsSync(keyPath)) {
  console.error(`サービスアカウントが見つかりません: ${keyPath}`);
  process.exit(1);
}

const serviceAccount = JSON.parse(readFileSync(keyPath, "utf-8"));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const { FieldValue } = admin.firestore;

(async () => {
  console.log(`=== set col-prt: ${GAME_ID} ===`);
  if (DRY_RUN) console.log(">>> DRY RUN\n");

  const ref = db.collection("games").doc(GAME_ID);
  const snap = await ref.get();
  if (!snap.exists) {
    console.error(`試合が見つかりません: games/${GAME_ID}`);
    process.exit(1);
  }

  const patch: Record<string, unknown> = {
    goalScorers: [],
    updatedAt: FieldValue.serverTimestamp(),
  };

  if (WITH_SCORE) {
    patch.homeScore = 0;
    patch.awayScore = 0;
    patch.final = true;
    patch.status = "final";
    patch.score = { home: 0, away: 0 };
    patch.pushNotifiedFinalAt = FieldValue.delete();
  }

  console.log("score: 0 - 0, goalScorers: []");
  if (WITH_SCORE) console.log("final: true");

  if (!DRY_RUN) {
    await ref.set(patch, { merge: true });
    console.log("\n✓ games ドキュメントを更新しました");
  }

  process.exit(0);
})().catch((e) => {
  console.error("set col-prt failed:", e);
  process.exit(1);
});
