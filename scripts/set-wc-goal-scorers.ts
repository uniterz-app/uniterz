/**
 * WC 試合の goalScorers を JSON から一括投入。
 *
 * 前提: プロジェクトルートに service-account.json または serviceAccount.json
 *
 *   npx tsx scripts/set-wc-goal-scorers.ts --game-id=wc-2026-E-deu-cuw --file=scripts/data/wc-goal-scorers-deu-cuw.json --dry-run
 *   npx tsx scripts/set-wc-goal-scorers.ts --game-id=wc-2026-E-deu-cuw --file=scripts/data/wc-goal-scorers-deu-cuw.json --with-score
 *   npx tsx scripts/set-wc-goal-scorers.ts --game-id=wc-2026-E-deu-cuw --file=... --with-score --resettle
 *   npx tsx scripts/set-wc-goal-scorers.ts --game-id=wc-2026-E-deu-cuw --scorers='[{"name":"Havertz","side":"home","minute":88}]'
 *
 * JSON 形式（配列）:
 *   [{ "playerId": "deu-havertz", "teamId": "wc-deu", "minute": 88 }]
 *   [{ "name": "Havertz", "side": "home", "minute": "45+5" }]
 *
 * JSON 形式（オブジェクト）:
 *   { "homeScore": 7, "awayScore": 1, "scorers": [...] }
 *
 * オプション:
 *   --game-id=ID   必須
 *   --file=PATH    得点者 JSON（--scorers と排他、file 優先）
 *   --scorers=JSON 得点者 JSON 文字列
 *   --home-score=N --away-score=N  スコア（JSON 内より CLI が優先）
 *   --with-score   homeScore/awayScore/final/status も更新（スコア必須）
 *   --dry-run      書き込まず内容を表示
 *   --resettle     終了済み試合の精算済み投稿を再計算
 *   --force        既存 goalScorers があっても上書き
 */

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import adminPkg from "firebase-admin";
import {
  resolveWcGameGoalScorers,
  validateWcGoalScorerPickForGame,
  type WcGameGoalScorer,
} from "@/lib/wc/goalScorer";
import { resettleWcGoalScorerBonusesForGame } from "@/lib/wc/resettleGoalScorerBonus";

const admin = adminPkg as typeof import("firebase-admin");

const DRY_RUN = process.argv.includes("--dry-run");
const WITH_SCORE = process.argv.includes("--with-score");
const RESETTLE = process.argv.includes("--resettle");
const FORCE = process.argv.includes("--force");

function argValue(prefix: string): string | undefined {
  const hit = process.argv.find((a) => a.startsWith(prefix));
  return hit?.slice(prefix.length).trim() || undefined;
}

const GAME_ID = argValue("--game-id=");
const FILE_PATH = argValue("--file=");
const SCORERS_JSON = argValue("--scorers=");
const HOME_SCORE_ARG = argValue("--home-score=");
const AWAY_SCORE_ARG = argValue("--away-score=");

if (!GAME_ID) {
  console.error("--game-id=wc-2026-... が必須です");
  process.exit(1);
}

if (!FILE_PATH && !SCORERS_JSON) {
  console.error("--file=PATH または --scorers='[...]' が必須です");
  process.exit(1);
}

/** "45+5" / "90+5" / 50 → 数値分 */
function parseGoalMinute(raw: unknown): number | null {
  if (raw == null || raw === "") return null;
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  const s = String(raw).trim();
  if (!s) return null;
  const plus = s.match(/^(\d+)\+(\d+)$/);
  if (plus) return Number(plus[1]) + Number(plus[2]);
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

type ScorerInput = Record<string, unknown>;

function normalizeScorerMinutes(raw: ScorerInput[]): ScorerInput[] {
  return raw.map((item) => {
    if (!item || typeof item !== "object") return item;
    const minute = parseGoalMinute(item.minute);
    return minute != null ? { ...item, minute } : item;
  });
}

type ParsedInput = {
  scorersRaw: ScorerInput[];
  homeScore?: number;
  awayScore?: number;
};

function parseInput(): ParsedInput {
  let parsed: unknown;
  if (FILE_PATH) {
    const path = resolve(FILE_PATH);
    if (!existsSync(path)) {
      console.error(`ファイルが見つかりません: ${path}`);
      process.exit(1);
    }
    parsed = JSON.parse(readFileSync(path, "utf-8"));
  } else {
    parsed = JSON.parse(SCORERS_JSON!);
  }

  if (Array.isArray(parsed)) {
    return { scorersRaw: normalizeScorerMinutes(parsed as ScorerInput[]) };
  }

  if (parsed && typeof parsed === "object") {
    const obj = parsed as {
      scorers?: ScorerInput[];
      goalScorers?: ScorerInput[];
      homeScore?: number;
      awayScore?: number;
    };
    const list = obj.scorers ?? obj.goalScorers;
    if (!Array.isArray(list)) {
      console.error("JSON は配列、または scorers / goalScorers 配列を含むオブジェクトである必要があります");
      process.exit(1);
    }
    return {
      scorersRaw: normalizeScorerMinutes(list),
      homeScore: obj.homeScore,
      awayScore: obj.awayScore,
    };
  }

  console.error("JSON の形式が不正です");
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

function parseScoreArg(raw: string | undefined): number | undefined {
  if (!raw) return undefined;
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 0) {
    console.error(`スコアが不正です: ${raw}`);
    process.exit(1);
  }
  return n;
}

(async () => {
  console.log(`=== set goalScorers: ${GAME_ID} ===`);
  if (DRY_RUN) console.log(">>> DRY RUN（Firestore は更新しません）\n");

  const input = parseInput();
  const homeScore =
    parseScoreArg(HOME_SCORE_ARG) ?? input.homeScore;
  const awayScore =
    parseScoreArg(AWAY_SCORE_ARG) ?? input.awayScore;

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

  const resolved = resolveWcGameGoalScorers(input.scorersRaw, {
    homeTeamId,
    awayTeamId,
  });
  if (!resolved.ok) {
    console.error(`得点者の解決に失敗: ${resolved.error}`);
    process.exit(1);
  }

  const GOAL_SCORERS = resolved.scorers;
  if (GOAL_SCORERS.length === 0) {
    console.error("得点者が 0 件です");
    process.exit(1);
  }

  for (const g of GOAL_SCORERS) {
    const v = validateWcGoalScorerPickForGame(g, homeTeamId, awayTeamId);
    if (!v.ok) {
      console.error(`得点者検証エラー (${g.playerId}): ${v.error}`);
      process.exit(1);
    }
  }

  if (WITH_SCORE) {
    if (homeScore == null || awayScore == null) {
      console.error("--with-score には homeScore/awayScore（JSON または --home-score / --away-score）が必要です");
      process.exit(1);
    }
    const goalCount = GOAL_SCORERS.filter((g) => !g.ownGoal).length;
    if (homeScore + awayScore !== goalCount) {
      console.warn(
        `⚠ スコア合計 ${homeScore + awayScore} と得点者数 ${goalCount}（OG 除く）が一致しません`
      );
    }
  }

  const goalScorersPayload = payloadFromScorers(GOAL_SCORERS);

  const patch: Record<string, unknown> = {
    goalScorers: goalScorersPayload,
    updatedAt: FieldValue.serverTimestamp(),
  };

  if (WITH_SCORE && homeScore != null && awayScore != null) {
    patch.homeScore = homeScore;
    patch.awayScore = awayScore;
    patch.final = true;
    patch.status = "final";
  }

  console.log("home:", homeTeamId, "away:", awayTeamId);
  console.log("goalScorers:", JSON.stringify(goalScorersPayload, null, 2));
  if (WITH_SCORE && homeScore != null && awayScore != null) {
    console.log(`score: ${homeScore} - ${awayScore}, final: true`);
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
  } else if (!shouldResettle && RESETTLE) {
    console.log(
      "\n⚠ --resettle は final 試合向けです。--with-score を付けるか、先に final を設定してください。"
    );
  }

  if (DRY_RUN) {
    console.log("\n本番反映例:");
    console.log(
      `  npx tsx scripts/set-wc-goal-scorers.ts --game-id=${GAME_ID} --file=${FILE_PATH ?? "..."} --with-score --resettle`
    );
  }

  process.exit(0);
})().catch((e) => {
  console.error("set goalScorers failed:", e);
  process.exit(1);
});
