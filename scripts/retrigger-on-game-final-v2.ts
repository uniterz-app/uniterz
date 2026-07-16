/**
 * onGameFinalV2 を再実行させる（投稿精算が走っていないとき）。
 *
 * Cloud Functions の onGameFinalV2 は `final: false → true` の遷移時のみ動く。
 * 既に final=true の試合に --with-score だけしても精算は走らない。
 *
 *   npx tsx scripts/retrigger-on-game-final-v2.ts --game-id=wc-2026-ko-M97
 *   npx tsx scripts/retrigger-on-game-final-v2.ts --game-id=wc-2026-ko-M97 --dry-run
 */

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import adminPkg from "firebase-admin";

const admin = adminPkg as typeof import("firebase-admin");

const DRY_RUN = process.argv.includes("--dry-run");
const gameIdArg = process.argv.find((a) => a.startsWith("--game-id="));
const GAME_ID = gameIdArg?.slice("--game-id=".length).trim();

if (!GAME_ID) {
  console.error("--game-id=wc-2026-... が必須です");
  process.exit(1);
}

const keyPath =
  process.env.GOOGLE_APPLICATION_CREDENTIALS ??
  (existsSync("service-account.json")
    ? resolve("service-account.json")
    : resolve("serviceAccount.json"));

if (!existsSync(keyPath)) {
  console.error(`サービスアカウントが見つかりません: ${keyPath}`);
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(JSON.parse(readFileSync(keyPath, "utf-8"))),
});

const db = admin.firestore();
const { FieldValue } = admin.firestore;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const ref = db.collection("games").doc(GAME_ID);
  const snap = await ref.get();
  if (!snap.exists) {
    console.error(`試合が見つかりません: games/${GAME_ID}`);
    process.exit(1);
  }

  const data = snap.data()!;
  if (data.homeScore == null || data.awayScore == null) {
    console.error("homeScore / awayScore が未設定です。先に --with-score で投入してください。");
    process.exit(1);
  }

  const postsSnap = await db
    .collection("posts")
    .where("gameId", "==", GAME_ID)
    .where("schemaVersion", "==", 2)
    .get();

  const unsettled = postsSnap.docs.filter((d) => !d.data().settledAt).length;
  const settled = postsSnap.size - unsettled;

  console.log(`=== retrigger onGameFinalV2: ${GAME_ID} ===`);
  console.log(`posts: ${settled} settled / ${postsSnap.size} total`);
  console.log(`resultComputedAtV2: ${data.resultComputedAtV2 ? "yes" : "no"}`);
  console.log(`score: ${data.homeScore} - ${data.awayScore}, final: ${data.final}`);

  if (unsettled === 0 && postsSnap.size > 0) {
    console.log("未精算投稿なし。再トリガーは不要です。");
    process.exit(0);
  }

  if (DRY_RUN) {
    console.log("\n>>> DRY RUN: final=false → 待機 → final=true を実行します");
    process.exit(0);
  }

  await ref.set(
    {
      final: false,
      status: "scheduled",
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
  console.log("✓ final=false");
  await sleep(3000);

  const patch: Record<string, unknown> = {
    final: true,
    status: "final",
    homeScore: data.homeScore,
    awayScore: data.awayScore,
    updatedAt: FieldValue.serverTimestamp(),
  };
  if (data.goalScorers != null) patch.goalScorers = data.goalScorers;
  if (data.advancingTeamId != null) patch.advancingTeamId = data.advancingTeamId;

  await ref.set(patch, { merge: true });
  console.log("✓ final=true（onGameFinalV2 待ち）");

  for (let i = 0; i < 45; i++) {
    await sleep(4000);
    const g = (await ref.get()).data()!;
    const check = await db
      .collection("posts")
      .where("gameId", "==", GAME_ID)
      .where("schemaVersion", "==", 2)
      .limit(200)
      .get();
    let done = 0;
    for (const d of check.docs) if (d.data().settledAt) done += 1;
    console.log(
      `poll ${i + 1}: settled ${done}/${check.size >= 200 ? "200+" : check.size}, resultComputedAtV2=${g.resultComputedAtV2 ? "yes" : "no"}`
    );
    if (g.resultComputedAtV2 && done > 0) {
      console.log("\n✓ 精算が開始されました。Firebase Console で全件完了を確認してください。");
      process.exit(0);
    }
  }

  console.error(
    "\nタイムアウト: Cloud Functions ログ（onGameFinalV2）を確認してください。"
  );
  process.exit(1);
})().catch((e) => {
  console.error("retrigger failed:", e);
  process.exit(1);
});
