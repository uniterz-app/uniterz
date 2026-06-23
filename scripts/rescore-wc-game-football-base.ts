/**
 * 確定済み WC 試合のサッカー基本点を現在の calcPointsFootball（4-2-2-2）で再計算する。
 * 連勝ボーナスはキックオフ順タイムラインから再算出（二重加算なし）。
 * onGameFinalV2 は呼ばない。
 *
 *   cd functions && npm run build && cd ..
 *   npx tsx scripts/rescore-wc-game-football-base.ts --game-id=wc-2026-K-prt-uzb --dry-run
 *   npx tsx scripts/rescore-wc-game-football-base.ts --game-id=wc-2026-K-prt-uzb
 *
 * 適用後（日次・累積・スナップショット）:
 *   npx tsx scripts/rebuild-wc-daily-for-date-all-users.ts --date=<JST kickoff date>
 *   npx tsx scripts/backfill-wc-cumulative-from-daily.ts
 *   npx tsx scripts/run-cumulative-ranking-snapshot-wc.ts
 */

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createRequire } from "node:module";
import adminPkg from "firebase-admin";
import {
  FieldValue,
  Timestamp,
  type QueryDocumentSnapshot,
} from "firebase-admin/firestore";
import { resolveWcStageFromGame } from "../lib/wc/resolveWcStage";
import {
  buildKickoffTimeline,
  calcStreakBonus,
  loadGamesById,
  loadWcPostRowsForUid,
  replayFootballStreak,
  replayStreakAfterGame,
  toTimestamp,
  type WcPostRow,
} from "./lib/wcStreakReplay";

const require = createRequire(import.meta.url);
const { computePostSettlement } = require(
  "../functions/lib/computePostSettlement.js"
) as {
  computePostSettlement: (args: {
    p: Record<string, unknown>;
    game: Record<string, unknown>;
    market: { majoritySide: string; majorityRatio: number; total: number };
    hadUpsetGame: boolean;
    streakResultMap: Map<string, { activeWinStreak: number }>;
  }) => {
    totalPoints: number;
    result: { isWin: boolean; upsetHit: boolean };
    baseScore: Record<string, unknown>;
    upsetPoints: number;
    upsetBonus: number;
    streakBonus: number;
    goalScorerBonus: number;
    activeWinStreak: number;
  };
};

const admin = adminPkg as typeof import("firebase-admin");

const DRY_RUN = process.argv.includes("--dry-run");
const gameIdArg = process.argv.find((a) => a.startsWith("--game-id="));
const GAME_ID =
  gameIdArg?.slice("--game-id=".length).trim() || "wc-2026-K-prt-uzb";

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

function settlementGameFromDoc(game: Record<string, unknown>) {
  const homeScore = Number(game.homeScore);
  const awayScore = Number(game.awayScore);
  const r = game.regulationEtScore as
    | { home?: unknown; away?: unknown }
    | null
    | undefined;
  const regHome = Number(r?.home);
  const regAway = Number(r?.away);
  return {
    homeScore,
    awayScore,
    league: game.league,
    homeTeamId:
      (game.home as { teamId?: string } | undefined)?.teamId ??
      game.homeTeamId,
    awayTeamId:
      (game.away as { teamId?: string } | undefined)?.teamId ??
      game.awayTeamId,
    regulationEtScore:
      Number.isFinite(regHome) && Number.isFinite(regAway)
        ? { home: regHome, away: regAway }
        : null,
    advancingTeamId: game.advancingTeamId ?? null,
    knockout: game.knockout === true,
    countsForRanking: game.countsForRanking !== false,
    goalScorers: game.goalScorers,
  };
}

function rowsWithPatchedWin(
  rows: WcPostRow[],
  gameId: string,
  isWin: boolean
): WcPostRow[] {
  return rows.map((r) =>
    r.gameId === gameId
      ? { ...r, stats: { ...r.stats, isWin } }
      : r
  );
}

(async () => {
  console.log(`=== rescore WC football base (4-2-2-2): ${GAME_ID} ===`);
  if (DRY_RUN) console.log(">>> DRY RUN\n");

  const gameSnap = await db.doc(`games/${GAME_ID}`).get();
  if (!gameSnap.exists) {
    console.error("試合が見つかりません");
    process.exit(1);
  }
  const game = gameSnap.data() as Record<string, unknown>;
  if (String(game.league ?? "").toLowerCase() !== "wc") {
    console.error("WC 試合ではありません");
    process.exit(1);
  }
  if (game.homeScore == null || game.awayScore == null) {
    console.error("スコア未確定です");
    process.exit(1);
  }

  const settlementGame = settlementGameFromDoc(game);
  const kickoffTs = resolveStatsStartAt({}, game);
  const kickoffDateKey = kickoffTs ? toDateKeyJST(kickoffTs) : "?";

  const postsSnap = await db
    .collection("posts")
    .where("gameId", "==", GAME_ID)
    .where("schemaVersion", "==", 2)
    .where("status", "==", "final")
    .get();

  if (postsSnap.empty) {
    console.log("精算済み投稿がありません");
    process.exit(0);
  }

  const byUid = new Map<string, QueryDocumentSnapshot[]>();
  for (const doc of postsSnap.docs) {
    const uid = String(doc.data().authorUid ?? "").trim();
    if (!uid) continue;
    const list = byUid.get(uid) ?? [];
    list.push(doc);
    byUid.set(uid, list);
  }

  let postsUpdated = 0;
  let postsUnchanged = 0;
  let totalDelta = 0;

  for (const [uid, docs] of byUid) {
    const allRows = await loadWcPostRowsForUid(db, uid);
    const gameById = await loadGamesById(
      db,
      allRows.map((r) => r.gameId)
    );

    let userDelta = 0;
    const dailyDeltas = new Map<
      string,
      {
        dPoints: number;
        dStreakBonus: number;
        dWins: number;
        dExactHit: number;
        wcStage: string | null;
      }
    >();

    for (const postDoc of docs) {
      const p = postDoc.data() as Record<string, unknown>;
      const stats = p.stats as Record<string, unknown>;
      const detail = (stats.pointsV3Detail as Record<string, unknown>) ?? {};
      const marketMeta = (p.marketMeta as Record<string, unknown>) ?? {};

      const market = {
        majoritySide: String(marketMeta.majoritySide ?? stats.marketMajority ?? "home"),
        majorityRatio: Number(
          marketMeta.majorityRatio ?? 0.5
        ),
        total: Number(stats.marketCount ?? 0),
      };
      const hadUpsetGame = stats.hadUpsetGame === true;

      const patchedRows = rowsWithPatchedWin(allRows, GAME_ID, stats.isWin === true);
      let events = buildKickoffTimeline(patchedRows, gameById);

      const streakResultMap = new Map<string, { activeWinStreak: number }>();
      const preStreak = replayStreakAfterGame(events, GAME_ID);
      streakResultMap.set(uid, { activeWinStreak: preStreak });

      let computed = computePostSettlement({
        p,
        game: settlementGame,
        market,
        hadUpsetGame,
        streakResultMap,
      });

      if (computed.result.isWin !== (stats.isWin === true)) {
        const patchedRows2 = rowsWithPatchedWin(
          allRows,
          GAME_ID,
          computed.result.isWin
        );
        events = buildKickoffTimeline(patchedRows2, gameById);
        const activeWinStreak = replayStreakAfterGame(events, GAME_ID);
        streakResultMap.set(uid, { activeWinStreak });
        computed = computePostSettlement({
          p,
          game: settlementGame,
          market,
          hadUpsetGame,
          streakResultMap,
        });
      }

      const oldPoints = Number(stats.pointsV3 ?? 0);
      const newPoints = computed.totalPoints;
      const dPoints = newPoints - oldPoints;

      const oldBase = Number(detail.basePoints ?? 0);
      const newBase = Number(computed.baseScore.basePoints ?? 0);
      const oldExact = stats.exactMatch === true;
      const newExact = Boolean(computed.baseScore.exactMatch);
      const oldWin = stats.isWin === true;
      const newWin = computed.result.isWin;

      if (
        dPoints === 0 &&
        oldBase === newBase &&
        oldExact === newExact &&
        oldWin === newWin &&
        Number(stats.streakBonus ?? 0) === computed.streakBonus
      ) {
        postsUnchanged++;
        continue;
      }

      console.log(
        `  ${postDoc.id}  base ${oldBase}→${newBase}  streak ${stats.streakBonus}→${computed.streakBonus}  pts ${oldPoints}→${newPoints} (Δ${dPoints})`
      );

      postsUpdated++;
      userDelta += dPoints;
      totalDelta += dPoints;

      if (DRY_RUN) continue;

      const baseScore = computed.baseScore;
      const newStats = {
        ...stats,
        isWin: computed.result.isWin,
        upsetHit: computed.result.upsetHit,
        upsetPoints: computed.upsetPoints,
        upsetBonus: computed.upsetBonus,
        streakBonus: computed.streakBonus,
        goalScorerBonus: computed.goalScorerBonus,
        exactMatch: Boolean(baseScore.exactMatch),
        pointsV3: newPoints,
        pointsV3Detail: {
          ...detail,
          basePoints: baseScore.basePoints,
          winnerCorrect: baseScore.winnerCorrect,
          winPoints: baseScore.winPoints,
          diffPoints: baseScore.diffPoints,
          totalPoints: baseScore.totalPoints,
          goalDiffPoints:
            "goalDiffPoints" in baseScore
              ? (baseScore as { goalDiffPoints: number }).goalDiffPoints
              : 0,
          upsetBonus: computed.upsetBonus,
          streakBonus: computed.streakBonus,
          goalScorerBonus: computed.goalScorerBonus,
          activeWinStreak: computed.activeWinStreak,
          diffError: baseScore.diffError,
          totalError: baseScore.totalError,
          exactMatch: Boolean(baseScore.exactMatch),
        },
      };

      await postDoc.ref.update({
        stats: newStats,
        updatedAt: FieldValue.serverTimestamp(),
      });

      const startAt = resolveStatsStartAt(p, game);
      if (!startAt) continue;

      const dateKey = toDateKeyJST(startAt);
      const wcStage = resolveWcStageFromGame({
        knockout: game.knockout === true,
        roundLabel:
          typeof game.roundLabel === "string" ? game.roundLabel : null,
        wcStage: typeof game.wcStage === "string" ? game.wcStage : null,
      });

      const prev = dailyDeltas.get(dateKey) ?? {
        dPoints: 0,
        dStreakBonus: 0,
        dWins: 0,
        dExactHit: 0,
        wcStage,
      };
      prev.dPoints += dPoints;
      prev.dStreakBonus +=
        computed.streakBonus - Number(stats.streakBonus ?? 0);
      prev.dWins += (newWin ? 1 : 0) - (oldWin ? 1 : 0);
      prev.dExactHit += (newExact ? 1 : 0) - (oldExact ? 1 : 0);
      dailyDeltas.set(dateKey, prev);
    }

    if (DRY_RUN || userDelta === 0) continue;

    const finalRows = await loadWcPostRowsForUid(db, uid);
    const finalGameById = await loadGamesById(
      db,
      finalRows.map((r) => r.gameId)
    );
    const events = buildKickoffTimeline(finalRows, finalGameById);
    const replay = replayFootballStreak(events);

    for (const [dateKey, d] of dailyDeltas) {
      const bucketDelta = incFields({
        pointsSumV3: d.dPoints,
        streakBonusSum: d.dStreakBonus,
        wins: d.dWins,
        exactHitCount: d.dExactHit,
      });
      if (Object.keys(bucketDelta).length === 0) continue;

      await db.doc(`user_stats_v2_daily/${uid}_${dateKey}`).set(
        {
          date: dateKey,
          updatedAt: FieldValue.serverTimestamp(),
          all: bucketDelta,
          ranking: bucketDelta,
          leagues: { wc: bucketDelta },
          rankingByWcStage: {
            overall: bucketDelta,
            ...(d.wcStage === "qualifying" ? { qualifying: bucketDelta } : {}),
            ...(d.wcStage === "main" ? { main: bucketDelta } : {}),
          },
        },
        { merge: true }
      );
    }

    const userSnap = await db.doc(`user_stats_v2/${uid}`).get();
    const userData = userSnap.data() as Record<string, unknown> | undefined;
    const { basketball, maxBasketball } = readBasketballState(userData);
    const streakBySport = { basketball, football: replay.football };
    const maxWinStreakBySport = {
      basketball: maxBasketball,
      football: replay.maxFootball,
    };

    const batch = db.batch();
    batch.set(
      db.doc(`user_stats_v2/${uid}`),
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
      db.doc(`users/${uid}`),
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
      db.doc(`cumulative_stats/${uid}`),
      {
        streakBySport,
        streakFootball: replay.football,
        currentStreak: basketball,
        activeWinStreakFootball: replay.activeWinStreakFootball,
        activeWinStreakBasketball: basketball > 0 ? basketball : 0,
        totalPoints: FieldValue.increment(userDelta),
        ranking: { totalPoints: FieldValue.increment(userDelta) },
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    await batch.commit();
    console.log(`  ✓ uid ${uid} daily/cumulative Δ${userDelta}`);
  }

  console.log(`
Done.
  posts updated: ${postsUpdated}${DRY_RUN ? " (dry-run)" : ""}
  posts unchanged: ${postsUnchanged}
  total pointsV3 delta: ${totalDelta}
  kickoff date (JST): ${kickoffDateKey}
`);

  if (!DRY_RUN && postsUpdated > 0) {
    console.log(
      "推奨:\n" +
        `  npx tsx scripts/rebuild-wc-daily-for-date-all-users.ts --date=${kickoffDateKey}\n` +
        "  npx tsx scripts/backfill-wc-cumulative-from-daily.ts\n" +
        "  npx tsx scripts/run-cumulative-ranking-snapshot-wc.ts"
    );
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
