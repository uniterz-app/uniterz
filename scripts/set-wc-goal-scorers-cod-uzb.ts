/**
 * wc-2026-K-cod-uzb（コンゴ 3–1 ウズベキスタン）の goalScorers を Firestore に投入。
 *
 * 得点:
 *   10' エルドル・ショムロドフ（ウズベキスタン）
 *   68' ヨアネ・ウィサ（コンゴ）— PK
 *   78' フィストン・マイエル（コンゴ）
 *   90+1' ヨアネ・ウィサ（コンゴ）
 *
 *   npx tsx scripts/set-wc-goal-scorers-cod-uzb.ts --with-score --resettle
 *   npx tsx scripts/set-wc-goal-scorers-cod-uzb.ts --force
 */

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import adminPkg from "firebase-admin";
import {
  validateWcGoalScorerPickForGame,
  type WcGameGoalScorer,
} from "@/lib/wc/goalScorer";
import { resettleWcGoalScorerBonusesForGame } from "@/lib/wc/resettleGoalScorerBonus";

const admin = adminPkg as typeof import("firebase-admin");

const DEFAULT_GAME_ID = "wc-2026-K-cod-uzb";

const GOAL_SCORERS: WcGameGoalScorer[] = [
  { playerId: "uzb-shomurodov", teamId: "wc-uzb", minute: 10 },
  { playerId: "cod-wissa", teamId: "wc-cod", minute: 68 },
  { playerId: "cod-mayele", teamId: "wc-cod", minute: 78 },
  { playerId: "cod-wissa", teamId: "wc-cod", minute: 91 },
];

const DRY_RUN = process.argv.includes("--dry-run");
const WITH_SCORE = process.argv.includes("--with-score");
const RESETTLE = process.argv.includes("--resettle");
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

function payloadFromScorers(scorers: WcGameGoalScorer[]) {
  return scorers.map((g) => ({
    playerId: g.playerId,
    teamId: g.teamId,
    ...(g.minute != null ? { minute: g.minute } : {}),
    ...(g.ownGoal ? { ownGoal: true } : {}),
  }));
}

(async () => {
  console.log(`=== set goalScorers: ${GAME_ID} ===`);
  if (DRY_RUN) console.log(">>> DRY RUN\n");

  const ref = db.collection("games").doc(GAME_ID);
  const snap = await ref.get();
  if (!snap.exists) {
    console.error(`試合が見つかりません: games/${GAME_ID}`);
    process.exit(1);
  }

  const data = snap.data()!;
  const homeTeamId =
    (data.home as { teamId?: string } | undefined)?.teamId ??
    (data.homeTeamId as string | undefined) ??
    null;
  const awayTeamId =
    (data.away as { teamId?: string } | undefined)?.teamId ??
    (data.awayTeamId as string | undefined) ??
    null;

  if (!homeTeamId || !awayTeamId) {
    console.error("home/away teamId が未設定です");
    process.exit(1);
  }

  const existing = data.goalScorers;
  if (
    existing !== undefined &&
    Array.isArray(existing) &&
    existing.length > 0 &&
    !FORCE
  ) {
    console.error(
      `既に goalScorers が ${existing.length} 件あります。--force を付けてください。`
    );
    process.exit(1);
  }

  for (const g of GOAL_SCORERS) {
    const v = validateWcGoalScorerPickForGame(g, homeTeamId, awayTeamId);
    if (!v.ok) {
      console.error(`得点者検証エラー (${g.playerId}): ${v.error}`);
      process.exit(1);
    }
  }

  const goalScorersPayload = payloadFromScorers(GOAL_SCORERS);
  const patch: Record<string, unknown> = {
    goalScorers: goalScorersPayload,
    updatedAt: FieldValue.serverTimestamp(),
  };

  if (WITH_SCORE) {
    patch.homeScore = 3;
    patch.awayScore = 1;
    patch.final = true;
    patch.status = "final";
    patch.score = { home: 3, away: 1 };
  }

  console.log("home:", homeTeamId, "away:", awayTeamId);
  console.log("goalScorers:", JSON.stringify(goalScorersPayload, null, 2));
  if (WITH_SCORE) console.log("score: 3 - 1, final: true");

  if (!DRY_RUN) {
    await ref.set(patch, { merge: true });
    console.log("\n✓ games ドキュメントを更新しました");
  }

  const shouldResettle =
    RESETTLE && (WITH_SCORE || Boolean(data.final) || patch.final === true);

  if (shouldResettle && !DRY_RUN) {
    const result = await resettleWcGoalScorerBonusesForGame(
      db,
      GAME_ID,
      GOAL_SCORERS,
      homeTeamId,
      awayTeamId
    );
    console.log(`✓ 精算済み投稿 ${result.updated} 件を再計算しました`);
  }

  process.exit(0);
})().catch((e) => {
  console.error("set goalScorers failed:", e);
  process.exit(1);
});
