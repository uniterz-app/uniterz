/**
 * World Cup テスト用試合 1 件（Japan vs Brazil）の seed スクリプト
 *
 * 実行:
 *   npx tsx scripts/seed-wc-test-game.ts
 *   または
 *   npx ts-node scripts/seed-wc-test-game.ts
 *
 * 前提:
 *   - service-account.json または serviceAccount.json がプロジェクトルートに存在
 *   - 先に scripts/seed-wc-teams.ts を実行済み
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
// @ts-ignore
import adminPkg from "firebase-admin";
const admin = adminPkg;

const keyPath =
  process.env.GOOGLE_APPLICATION_CREDENTIALS ??
  (existsSync("service-account.json")
    ? resolve("service-account.json")
    : resolve("serviceAccount.json"));
const serviceAccount = JSON.parse(readFileSync(keyPath, "utf-8"));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as any),
});

const db = admin.firestore();
const Timestamp = admin.firestore.Timestamp;

/* ===========================
 *  GAME_SCHEDULE_SEASON と一致させる（packages/shared/src/gameSchedule.ts）
 * =========================== */
const SEASON = "2025-26";

/* ===========================
 *  ここを書き換えれば日付・ステージを変えられる
 *
 *   wcStage:
 *     - "qualifying"  グループステージ
 *     - "main"        ノックアウト
 *
 *   knockout:
 *     - true で延長/PK 判定が有効（"main" のときだけ true 推奨）
 *
 *   startAtJst:
 *     - 既定では「今日 22:00 JST」に投入する（Games の日付ストリップは ±3 日窓を読むため）
 *     - 明示日付を使いたいときは下の関数を文字列リテラルに変える
 * =========================== */
function todayAt22JstIso(): string {
  const now = new Date();
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const y = jst.getUTCFullYear();
  const m = String(jst.getUTCMonth() + 1).padStart(2, "0");
  const d = String(jst.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}T22:00:00+09:00`;
}

const TEST_GAME = {
  id: "wc-test-jpn-bra-001",
  league: "wc",
  status: "scheduled" as const,
  /** JST ISO（既定は今日の 22:00 JST。固定したいなら "2026-06-15T22:00:00+09:00" のように直書き） */
  startAtJst: todayAt22JstIso(),
  venue: "Test Stadium",
  roundLabel: "Group C",
  wcStage: "qualifying" as const,
  knockout: false,
  home: {
    teamId: "wc-jpn",
    name: "Japan",
  },
  away: {
    teamId: "wc-bra",
    name: "Brazil",
  },
};

(async () => {
  console.log("=== WC test game seeding START ===");

  const startAt = Timestamp.fromDate(new Date(TEST_GAME.startAtJst));

  const ref = db.collection("games").doc(TEST_GAME.id);
  await ref.set(
    {
      id: TEST_GAME.id,
      league: TEST_GAME.league,
      season: SEASON,
      status: TEST_GAME.status,
      startAt,
      startAtJst: startAt,

      venue: TEST_GAME.venue,
      roundLabel: TEST_GAME.roundLabel,
      wcStage: TEST_GAME.wcStage,
      knockout: TEST_GAME.knockout,

      home: TEST_GAME.home,
      away: TEST_GAME.away,

      final: false,
      homeScore: null,
      awayScore: null,
      regulationEtScore: null,
      advancingTeamId: null,

      resultComputedAt: null,
      score: null,
      liveMeta: null,
      finalMeta: null,
    },
    { merge: true },
  );

  console.log(`  written: ${TEST_GAME.id} (season=${SEASON})`);
  console.log("=== WC test game seeding COMPLETED ===");
  process.exit(0);
})().catch((e) => {
  console.error("seed failed:", e);
  process.exit(1);
});
