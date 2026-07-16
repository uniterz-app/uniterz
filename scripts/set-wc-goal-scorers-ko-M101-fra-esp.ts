/**
 * wc-2026-ko-M101（フランス 0–2 スペイン / 準決勝）の goalScorers を Firestore に投入。
 *
 * 得点:
 *   22' ミケル・オヤルサバル（スペイン・PK）— esp-oyarzabal
 *   58' ペドロ・ポロ（スペイン）— esp-porro
 *
 * 前提: プロジェクトルートに service-account.json または serviceAccount.json
 *
 *   npx tsx scripts/set-wc-goal-scorers-ko-M101-fra-esp.ts --dry-run
 *   npx tsx scripts/set-wc-goal-scorers-ko-M101-fra-esp.ts --with-score
 *   npx tsx scripts/set-wc-goal-scorers-ko-M101-fra-esp.ts --with-score --bracket-chain
 *   npx tsx scripts/set-wc-goal-scorers-ko-M101-fra-esp.ts --with-score --resettle --force
 *
 * 注意: 試合が既に final=true の状態で投入すると onGameFinalV2（投稿精算）が走りません。
 *       投稿が未精算のときは scripts/retrigger-on-game-final-v2.ts を実行してください。
 *
 * 汎用 JSON 投入:
 *   npx tsx scripts/set-wc-goal-scorers.ts --game-id=wc-2026-ko-M101 --file=scripts/data/wc-goal-scorers-ko-M101-fra-esp.json --with-score
 */

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import adminPkg from "firebase-admin";
import {
  validateWcGoalScorerPickForGame,
  type WcGameGoalScorer,
} from "@/lib/wc/goalScorer";
import { resettleWcGoalScorerBonusesForGame } from "@/lib/wc/resettleGoalScorerBonus";
import { finalizeWcKnockoutFromScript } from "./lib/finalizeWcKnockoutFromScript";

const admin = adminPkg as typeof import("firebase-admin");

const DEFAULT_GAME_ID = "wc-2026-ko-M101";

/** フランス（ホーム）0 – 2 スペイン（アウェイ） */
const GOAL_SCORERS: WcGameGoalScorer[] = [
  { playerId: "esp-oyarzabal", teamId: "wc-esp", minute: 22 },
  { playerId: "esp-porro", teamId: "wc-esp", minute: 58 },
];

const DRY_RUN = process.argv.includes("--dry-run");
const WITH_SCORE = process.argv.includes("--with-score");
const RESETTLE = process.argv.includes("--resettle");
const FORCE = process.argv.includes("--force");
const BRACKET_CHAIN = process.argv.includes("--bracket-chain");

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
  if (DRY_RUN) console.log(">>> DRY RUN（Firestore は更新しません）\n");

  const ref = db.collection("games").doc(GAME_ID);
  const snap = await ref.get();
  if (!snap.exists) {
    console.error(`試合が見つかりません: games/${GAME_ID}`);
    process.exit(1);
  }

  const data = snap.data()!;
  if (String(data.league ?? "").toLowerCase() !== "wc") {
    console.error(`league が wc ではありません: ${data.league}`);
    process.exit(1);
  }

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
      `既に goalScorers が ${existing.length} 件あります。上書きする場合は --force を付けてください。`
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
    patch.homeScore = 0;
    patch.awayScore = 2;
    patch.final = true;
    patch.status = "final";
  }

  console.log("home:", homeTeamId, "away:", awayTeamId);
  console.log("goalScorers:", JSON.stringify(goalScorersPayload, null, 2));
  if (WITH_SCORE) {
    console.log("score: 0 - 2, final: true");
  }

  if (!DRY_RUN) {
    await ref.set(patch, { merge: true });
    console.log("\n✓ games ドキュメントを更新しました");
  }

  if (BRACKET_CHAIN) {
    await finalizeWcKnockoutFromScript(db, {
      gameId: GAME_ID,
      data: { ...data, ...patch },
      dryRun: DRY_RUN,
    });
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
  } else if (RESETTLE && DRY_RUN) {
    console.log("\n（--resettle 指定: 本番実行時に精算済み投稿を再計算）");
  } else if (!shouldResettle && RESETTLE) {
    console.log(
      "\n⚠ --resettle は final 試合向けです。--with-score を付けるか、先に final を設定してください。"
    );
  }

  if (DRY_RUN) {
    console.log("\n本番反映:");
    console.log(
      "  npx tsx scripts/set-wc-goal-scorers-ko-M101-fra-esp.ts --with-score --bracket-chain"
    );
  }

  process.exit(0);
})().catch((e) => {
  console.error("set goalScorers failed:", e);
  process.exit(1);
});
