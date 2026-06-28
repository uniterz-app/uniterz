/**
 * wc-2026-H-cpv-sau（カーボベルデ 0–0 サウジアラビア）のスコア・goalScorers を Firestore に投入。
 *
 *   npx tsx scripts/set-wc-goal-scorers-cpv-sau.ts --dry-run
 *   npx tsx scripts/set-wc-goal-scorers-cpv-sau.ts --with-score
 *   npx tsx scripts/set-wc-goal-scorers-cpv-sau.ts --with-score --force
 */

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import adminPkg from "firebase-admin";

const admin = adminPkg as typeof import("firebase-admin");

const DEFAULT_GAME_ID = "wc-2026-H-cpv-sau";

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
  console.log(`=== set cpv-sau: ${GAME_ID} ===`);
  if (DRY_RUN) console.log(">>> DRY RUN\n");

  const ref = db.collection("games").doc(GAME_ID);
  const snap = await ref.get();
  if (!snap.exists) {
    console.error(`試合が見つかりません: games/${GAME_ID}`);
    console.error("先に npx tsx scripts/seed-wc-2026-groupstage.ts を実行してください。");
    process.exit(1);
  }

  const data = snap.data()!;
  const existing = data.goalScorers;
  if (
    existing !== undefined &&
    Array.isArray(existing) &&
    existing.length > 0 &&
    !FORCE &&
    !WITH_SCORE
  ) {
    console.error(`既に goalScorers があります。--force を付けてください。`);
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
  console.error("set cpv-sau failed:", e);
  process.exit(1);
});
