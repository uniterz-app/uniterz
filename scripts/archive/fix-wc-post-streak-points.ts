/**
 * WC 投稿1件の連勝表示・連勝ボーナス・総合得点を正しい WC 連勝から再計算して修正する。
 * 対象ユーザーの WC 連勝（football）も再計算し、NBA は触らない。
 *
 * 使い方（プロジェクトルート、service-account.json 必須）:
 *   npx tsx scripts/fix-wc-post-streak-points.ts --dry-run \
 *     --uid=Rb3vF67NTLeCxSvrR15brCbiQSD2 --game-id=wc-2026-A-kor-cze
 */

import adminPkg from "firebase-admin";
import fs from "fs";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { resolveWcStageFromGame } from "../lib/wc/resolveWcStage";
import {
  buildKickoffTimeline,
  calcStreakBonus,
  loadGamesById,
  loadWcPostRowsForUid,
  replayFootballStreak,
  replayStreakAfterGame,
  toTimestamp,
} from "./lib/wcStreakReplay";

const admin = adminPkg as typeof import("firebase-admin");

const DRY_RUN = process.argv.includes("--dry-run");
const uidArg = process.argv.find((a) => a.startsWith("--uid="));
const gameIdArg = process.argv.find((a) => a.startsWith("--game-id="));
const UID = uidArg?.slice("--uid=".length).trim() ?? "";
const GAME_ID = gameIdArg?.slice("--game-id=".length).trim() ?? "";

const serviceAccount = JSON.parse(
  fs.readFileSync("service-account.json", "utf8")
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

function toDateKeyJST(ts: Timestamp): string {
  const d = ts.toDate();
  const j = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  const yyyy = j.getUTCFullYear();
  const mm = String(j.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(j.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function resolveStatsStartAt(
  post: Record<string, unknown>,
  game?: Record<string, unknown>
): Timestamp | null {
  return (
    toTimestamp(game?.startAtJst) ??
    toTimestamp(game?.startAt) ??
    toTimestamp(post.startAtJst) ??
    toTimestamp(post.startAt) ??
    toTimestamp(post.createdAt)
  );
}

function incFields(delta: Record<string, number>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(delta)) {
    if (v !== 0) out[k] = FieldValue.increment(v);
  }
  return out;
}

function readBasketballState(data: Record<string, unknown> | undefined) {
  const sb = data?.streakBySport as { basketball?: number } | undefined;
  const mb = data?.maxWinStreakBySport as { basketball?: number } | undefined;
  return {
    basketball:
      typeof sb?.basketball === "number"
        ? sb.basketball
        : typeof data?.currentStreak === "number"
          ? data.currentStreak
          : 0,
    maxBasketball:
      typeof mb?.basketball === "number"
        ? mb.basketball
        : typeof data?.maxWinStreak === "number"
          ? data.maxWinStreak
          : 0,
  };
}

(async () => {
  if (!UID || !GAME_ID) {
    console.error("必須: --uid=... --game-id=... （例: wc-2026-A-kor-cze）");
    process.exit(1);
  }

  console.log("=== fix WC post streak + points ===");
  console.log(`uid=${UID} gameId=${GAME_ID}`);
  if (DRY_RUN) console.log(">>> DRY RUN\n");

  const postSnap = await db
    .collection("posts")
    .where("authorUid", "==", UID)
    .where("gameId", "==", GAME_ID)
    .where("schemaVersion", "==", 2)
    .limit(5)
    .get();

  if (postSnap.empty) {
    console.error("投稿が見つかりません");
    process.exit(1);
  }

  const postDoc = postSnap.docs[0];
  const post = postDoc.data() as Record<string, unknown>;
  const stats = post.stats as Record<string, unknown>;
  const detail = stats.pointsV3Detail as Record<string, unknown>;

  const gameSnap = await db.doc(`games/${GAME_ID}`).get();
  if (!gameSnap.exists) {
    console.error("試合が見つかりません");
    process.exit(1);
  }
  const game = gameSnap.data() as Record<string, unknown>;

  const rows = await loadWcPostRowsForUid(db, UID);
  const gameById = await loadGamesById(
    db,
    rows.map((r) => r.gameId)
  );
  const events = buildKickoffTimeline(rows, gameById);
  const correctActiveWinStreak = replayStreakAfterGame(events, GAME_ID);
  const correctStreakBonus = calcStreakBonus(correctActiveWinStreak);

  const basePoints = Number(detail.basePoints ?? 0);
  const upsetBonus = Number(detail.upsetBonus ?? stats.upsetBonus ?? 0);
  const goalScorerBonus = Number(
    detail.goalScorerBonus ?? stats.goalScorerBonus ?? 0
  );
  const oldPointsV3 = Number(stats.pointsV3 ?? 0);
  const oldStreakBonus = Number(stats.streakBonus ?? 0);
  const oldActiveWinStreak = Number(detail.activeWinStreak ?? 0);

  const newPointsV3 =
    basePoints + upsetBonus + correctStreakBonus + goalScorerBonus;

  const dPoints = newPointsV3 - oldPointsV3;
  const dStreakBonus = correctStreakBonus - oldStreakBonus;

  console.log("--- post ---");
  console.log(
    `activeWinStreak: ${oldActiveWinStreak} → ${correctActiveWinStreak}`
  );
  console.log(`streakBonus: ${oldStreakBonus} → ${correctStreakBonus}`);
  console.log(`pointsV3: ${oldPointsV3} → ${newPointsV3} (delta ${dPoints})`);
  console.log(`WC timeline (${events.length} games):`);
  for (const ev of events) {
    console.log(
      `  ${ev.gameId} ${ev.isWin ? "W" : "L"}${ev.gameId === GAME_ID ? "  ← target" : ""}`
    );
  }

  const startAt = resolveStatsStartAt(post, game);
  if (!startAt) {
    console.error("startAt を解決できません");
    process.exit(1);
  }
  const dateKey = toDateKeyJST(startAt);
  const dailyRef = db.doc(`user_stats_v2_daily/${UID}_${dateKey}`);
  const wcStage = resolveWcStageFromGame({
    knockout: game.knockout === true,
    roundLabel: typeof game.roundLabel === "string" ? game.roundLabel : null,
    wcStage: typeof game.wcStage === "string" ? game.wcStage : null,
  });

  const bucketDelta = incFields({
    pointsSumV3: dPoints,
    streakBonusSum: dStreakBonus,
  });

  if (DRY_RUN) {
    console.log(`\n[dry-run] daily ${UID}_${dateKey} patch:`, bucketDelta);
    const replay = replayFootballStreak(events);
    console.log(
      `[dry-run] user streak football → ${replay.football} (activeWin ${replay.activeWinStreakFootball})`
    );
    process.exit(0);
  }

  const newStats = {
    ...stats,
    streakBonus: correctStreakBonus,
    pointsV3: newPointsV3,
    pointsV3Detail: {
      ...detail,
      streakBonus: correctStreakBonus,
      activeWinStreak: correctActiveWinStreak,
    },
  };

  await postDoc.ref.update({
    stats: newStats,
    updatedAt: FieldValue.serverTimestamp(),
  });
  console.log("✓ post updated");

  if (Object.keys(bucketDelta).length > 0) {
    const dailyPatch: Record<string, unknown> = {
      date: dateKey,
      updatedAt: FieldValue.serverTimestamp(),
      all: bucketDelta,
      ranking: bucketDelta,
      leagues: { wc: bucketDelta },
      rankingByWcStage: {
        overall: bucketDelta,
        ...(wcStage === "qualifying" ? { qualifying: bucketDelta } : {}),
        ...(wcStage === "main" ? { main: bucketDelta } : {}),
      },
    };
    await dailyRef.set(dailyPatch, { merge: true });
    console.log(`✓ daily ${UID}_${dateKey} patched`);
  }

  const replay = replayFootballStreak(events);
  const userSnap = await db.doc(`user_stats_v2/${UID}`).get();
  const userData = userSnap.data() as Record<string, unknown> | undefined;
  const { basketball, maxBasketball } = readBasketballState(userData);
  const streakBySport = { basketball, football: replay.football };
  const maxWinStreakBySport = {
    basketball: maxBasketball,
    football: replay.maxFootball,
  };

  const batch = db.batch();
  batch.set(
    db.doc(`user_stats_v2/${UID}`),
    {
      streakBySport,
      maxWinStreakBySport,
      streakFootball: replay.football,
      maxWinStreakFootball: replay.maxFootball,
      currentStreak: basketball,
      maxWinStreak: maxBasketball,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
  batch.set(
    db.doc(`users/${UID}`),
    {
      streakBySport,
      streakFootball: replay.football,
      currentStreak: basketball,
      maxStreak: maxBasketball,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
  batch.set(
    db.doc(`cumulative_stats/${UID}`),
    {
      streakBySport,
      streakFootball: replay.football,
      currentStreak: basketball,
      activeWinStreakFootball: replay.activeWinStreakFootball,
      activeWinStreakBasketball: basketball > 0 ? basketball : 0,
      totalPoints: FieldValue.increment(dPoints),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  const cumSnap = await db.doc(`cumulative_stats/${UID}`).get();
  const ranking = cumSnap.get("ranking") as Record<string, unknown> | undefined;
  if (ranking && dPoints !== 0) {
    batch.set(
      db.doc(`cumulative_stats/${UID}`),
      {
        ranking: {
          totalPoints: FieldValue.increment(dPoints),
        },
      },
      { merge: true }
    );
  }

  await batch.commit();
  console.log(
    `✓ user streak football=${replay.football} (activeWin ${replay.activeWinStreakFootball})`
  );
  console.log(
    "\n次: npx tsx scripts/backfill-wc-cumulative-from-daily.ts --uid=" +
      UID +
      " で WC 累積を再同期し、スナップショットを再生成してください。"
  );
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
