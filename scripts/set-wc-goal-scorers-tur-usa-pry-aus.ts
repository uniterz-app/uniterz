/**
 * グループD 第3節 同時キックオフ 2試合の goalScorers を一括投入。
 *
 * 1. wc-2026-D-tur-usa（トルコ 3–2 アメリカ）
 *    3' オーストン・トラスティー / 10' アルダ・ギュレル /
 *    31' バルシュ・ユルマズ / 49' セバスティアン・ベルハルター /
 *    90+8' カーン・アイハン
 *
 * 2. wc-2026-D-pry-aus（パラグアイ 0–0 オーストラリア）
 *    得点なし
 *
 * キックオフ: 2026-06-25 22:00 ET（両試合同時）
 *
 * 前提: プロジェクトルートに service-account.json または serviceAccount.json
 *
 *   npx tsx scripts/set-wc-goal-scorers-tur-usa-pry-aus.ts --dry-run
 *   npx tsx scripts/set-wc-goal-scorers-tur-usa-pry-aus.ts --with-score --force
 *   npx tsx scripts/set-wc-goal-scorers-tur-usa-pry-aus.ts --with-score --resettle --force
 *
 * オプション:
 *   --dry-run     書き込まず内容を表示
 *   --with-score  homeScore/awayScore/final/status も更新
 *   --resettle    精算済み投稿のゴールスコアラーボーナスを再計算（final のとき）
 *   --force       既存 goalScorers があっても上書き
 *   --only=ID     1試合だけ（wc-2026-D-tur-usa / wc-2026-D-pry-aus）
 *
 * 汎用 JSON 投入:
 *   npx tsx scripts/set-wc-goal-scorers.ts --game-id=wc-2026-D-tur-usa --file=scripts/data/wc-goal-scorers-tur-usa.json --with-score --force
 *   npx tsx scripts/set-wc-goal-scorers.ts --game-id=wc-2026-D-pry-aus --file=scripts/data/wc-goal-scorers-pry-aus.json --with-score --force
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

type MatchJob = {
  gameId: string;
  label: string;
  homeScore: number;
  awayScore: number;
  goalScorers: WcGameGoalScorer[];
};

const MATCHES: MatchJob[] = [
  {
    gameId: "wc-2026-D-tur-usa",
    label: "トルコ 3–2 アメリカ",
    homeScore: 3,
    awayScore: 2,
    goalScorers: [
      { playerId: "usa-trusty", teamId: "wc-usa", minute: 3 },
      { playerId: "tur-guler", teamId: "wc-tur", minute: 10 },
      { playerId: "tur-y-lmaz", teamId: "wc-tur", minute: 31 },
      { playerId: "usa-berhalter", teamId: "wc-usa", minute: 49 },
      { playerId: "tur-ayhan", teamId: "wc-tur", minute: 98 },
    ],
  },
  {
    gameId: "wc-2026-D-pry-aus",
    label: "パラグアイ 0–0 オーストラリア",
    homeScore: 0,
    awayScore: 0,
    goalScorers: [],
  },
];

const DRY_RUN = process.argv.includes("--dry-run");
const WITH_SCORE = process.argv.includes("--with-score");
const RESETTLE = process.argv.includes("--resettle");
const FORCE = process.argv.includes("--force");

const onlyArg = process.argv.find((a) => a.startsWith("--only="));
const ONLY_GAME_ID = onlyArg?.slice("--only=".length).trim() || null;

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

async function applyMatch(job: MatchJob): Promise<void> {
  console.log(`\n=== ${job.gameId}（${job.label}）===`);

  const ref = db.collection("games").doc(job.gameId);
  const snap = await ref.get();
  if (!snap.exists) {
    throw new Error(`試合が見つかりません: games/${job.gameId}`);
  }

  const data = snap.data()!;
  if (String(data.league ?? "").toLowerCase() !== "wc") {
    throw new Error(`league が wc ではありません: ${data.league}`);
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
    throw new Error("home/away teamId が未設定です");
  }

  const existing = data.goalScorers;
  if (
    existing !== undefined &&
    Array.isArray(existing) &&
    existing.length > 0 &&
    !FORCE
  ) {
    throw new Error(
      `既に goalScorers が ${existing.length} 件あります。上書きする場合は --force を付けてください。`
    );
  }

  for (const g of job.goalScorers) {
    const v = validateWcGoalScorerPickForGame(g, homeTeamId, awayTeamId);
    if (!v.ok) {
      throw new Error(`得点者検証エラー (${g.playerId}): ${v.error}`);
    }
  }

  const goalScorersPayload = payloadFromScorers(job.goalScorers);
  const patch: Record<string, unknown> = {
    goalScorers: goalScorersPayload,
    updatedAt: FieldValue.serverTimestamp(),
  };

  if (WITH_SCORE) {
    patch.homeScore = job.homeScore;
    patch.awayScore = job.awayScore;
    patch.final = true;
    patch.status = "final";
    patch.score = { home: job.homeScore, away: job.awayScore };
    patch.pushNotifiedFinalAt = FieldValue.delete();
  }

  console.log("home:", homeTeamId, "away:", awayTeamId);
  console.log("goalScorers:", JSON.stringify(goalScorersPayload, null, 2));
  if (WITH_SCORE) {
    console.log(`score: ${job.homeScore} - ${job.awayScore}, final: true`);
  }

  if (!DRY_RUN) {
    await ref.set(patch, { merge: true });
    console.log("✓ games ドキュメントを更新しました");
  }

  const shouldResettle =
    RESETTLE && (WITH_SCORE || Boolean(data.final) || patch.final === true);

  if (shouldResettle && !DRY_RUN) {
    const result = await resettleWcGoalScorerBonusesForGame(
      db,
      job.gameId,
      job.goalScorers,
      homeTeamId,
      awayTeamId
    );
    console.log(`✓ 精算済み投稿 ${result.updated} 件を再計算しました`);
  } else if (RESETTLE && DRY_RUN) {
    console.log("（--resettle 指定: 本番実行時に精算済み投稿を再計算）");
  }
}

(async () => {
  const jobs = ONLY_GAME_ID
    ? MATCHES.filter((m) => m.gameId === ONLY_GAME_ID)
    : MATCHES;

  if (ONLY_GAME_ID && jobs.length === 0) {
    console.error(`--only=${ONLY_GAME_ID} に該当する試合がありません`);
    process.exit(1);
  }

  console.log("=== WC goalScorers 一括投入（グループD 第3節・同時キックオフ 2試合）===");
  if (DRY_RUN) console.log(">>> DRY RUN（Firestore は更新しません）");

  for (const job of jobs) {
    await applyMatch(job);
  }

  if (DRY_RUN) {
    console.log("\n本番反映:");
    console.log(
      "  npx tsx scripts/set-wc-goal-scorers-tur-usa-pry-aus.ts --with-score --resettle --force"
    );
  }

  process.exit(0);
})().catch((e) => {
  console.error("set goalScorers failed:", e);
  process.exit(1);
});
