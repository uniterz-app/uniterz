/**
 * wc-2026-D-tur-pry（トルコ 0–1 パラグアイ）の goalScorers を Firestore に投入。
 *
 * 前提: プロジェクトルートに service-account.json または serviceAccount.json
 *
 *   npx tsx scripts/set-wc-goal-scorers-tur-pry.ts --dry-run
 *   npx tsx scripts/set-wc-goal-scorers-tur-pry.ts --with-score
 *   npx tsx scripts/set-wc-goal-scorers-tur-pry.ts --with-score --resettle
 *   npx tsx scripts/set-wc-goal-scorers-tur-pry.ts --with-score --kickoff-today-jst
 *
 * オプション:
 *   --dry-run            書き込まず内容を表示
 *   --with-score         homeScore/awayScore/final/status も更新（0–1 確定）
 *   --resettle           終了済み試合の精算済み投稿を再計算
 *   --force              既存 goalScorers があっても上書き
 *   --kickoff-today-jst  startAtJst を今日 15:00 JST に更新（Games の「今日」表示用）
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

const DEFAULT_GAME_ID = "wc-2026-D-tur-pry";

/** パラグアイ 2' ガラルサ */
const GOAL_SCORERS: WcGameGoalScorer[] = [
  { playerId: "pry-galarza", teamId: "wc-pry", minute: 2 },
];

const DRY_RUN = process.argv.includes("--dry-run");
const WITH_SCORE = process.argv.includes("--with-score");
const RESETTLE = process.argv.includes("--resettle");
const FORCE = process.argv.includes("--force");
const KICKOFF_TODAY_JST = process.argv.includes("--kickoff-today-jst");

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
const { FieldValue, Timestamp } = admin.firestore;

function payloadFromScorers(scorers: WcGameGoalScorer[]) {
  return scorers.map((g) => ({
    playerId: g.playerId,
    teamId: g.teamId,
    ...(g.minute != null ? { minute: g.minute } : {}),
    ...(g.ownGoal ? { ownGoal: true } : {}),
  }));
}

function todayAt15JstDate(): Date {
  const now = new Date();
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const y = jst.getUTCFullYear();
  const m = String(jst.getUTCMonth() + 1).padStart(2, "0");
  const d = String(jst.getUTCDate()).padStart(2, "0");
  return new Date(`${y}-${m}-${d}T15:00:00+09:00`);
}

(async () => {
  console.log(`=== set goalScorers: ${GAME_ID} ===`);
  if (DRY_RUN) console.log(">>> DRY RUN（Firestore は更新しません）\n");

  const ref = db.collection("games").doc(GAME_ID);
  const snap = await ref.get();
  if (!snap.exists) {
    console.error(`試合が見つかりません: games/${GAME_ID}`);
    console.error("先に npx tsx scripts/seed-wc-2026-groupstage.ts を実行してください。");
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
    !FORCE &&
    !WITH_SCORE
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
    patch.awayScore = 1;
    patch.final = true;
    patch.status = "final";
    patch.score = { home: 0, away: 1 };
    patch.pushNotifiedFinalAt = FieldValue.delete();
  }

  if (KICKOFF_TODAY_JST) {
    const kickoff = todayAt15JstDate();
    const ts = Timestamp.fromDate(kickoff);
    patch.startAt = ts;
    patch.startAtJst = ts;
    console.log(`kickoff → 今日 15:00 JST (${kickoff.toISOString()})`);
  }

  console.log("home:", homeTeamId, "away:", awayTeamId);
  console.log("goalScorers:", JSON.stringify(goalScorersPayload, null, 2));
  if (WITH_SCORE) {
    console.log("score: 0 - 1, final: true");
  }

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
  } else if (RESETTLE && DRY_RUN) {
    console.log("\n（--resettle 指定: 本番実行時に精算済み投稿を再計算）");
  }

  if (DRY_RUN) {
    console.log("\n本番反映:");
    console.log(
      "  npx tsx scripts/set-wc-goal-scorers-tur-pry.ts --with-score --resettle --force --kickoff-today-jst"
    );
  }

  process.exit(0);
})().catch((e) => {
  console.error("set goalScorers failed:", e);
  process.exit(1);
});
