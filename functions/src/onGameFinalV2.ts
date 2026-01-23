// functions/src/onGameFinalV2.ts
import { onDocumentWritten } from "firebase-functions/v2/firestore";
import { getFirestore, FieldValue, Timestamp } from "firebase-admin/firestore";

import { fetchGameContext } from "./fetchGameContext";
import { marketCalculator } from "./marketCalculator";
import { upsetJudge } from "./upsetJudge";
import { finalizePost } from "./finalizePost";
import { updateUserStreak } from "./updateUserStreak";
import { updateTeamStats } from "./updateTeamStats";

const db = () => getFirestore();

const MIN_MARKET = 10;
const UPSET_MARKET_RATIO = 0.7;
const UPSET_WIN_DIFF = 10;

export const onGameFinalV2 = onDocumentWritten(
  {
    document: "games/{gameId}",
    region: "asia-northeast1",
  },
  async (event) => {
    const before = event.data?.before?.data();
    const after = event.data?.after?.data();
    if (!after) return;

    const gameId = event.params.gameId;

    const becameFinal = !before?.final && !!after?.final;
    const scoreChanged =
      before?.homeScore !== after?.homeScore ||
      before?.awayScore !== after?.awayScore;

    if (!becameFinal && !scoreChanged) return;

    /* ===== ① context 取得 ===== */
    const ctx = await fetchGameContext({
      db: db(),
      gameId,
      after,
    });
    if (!ctx) return;

    const {
      game,
      postsSnap,
      picks,
      homeConference,
      awayConference,
      homeRank,
      awayRank,
      homeWins,
      awayWins,
    } = ctx;

    if (!game.final) return;
    if (game.homeScore == null || game.awayScore == null) return;

    /* ===== ② streak / team stats ===== */
    if (becameFinal) {
      await updateUserStreak({
        db: db(),
        gameId,
        final: { home: game.homeScore, away: game.awayScore },
      });

await updateTeamStats({
  db: db(),
  game: {
    ...game,
    homeRank,
    awayRank,
  },
  homeConference,
  awayConference,
  homeWins,
  awayWins,
});
    }

    /* ===== ③ market / upset ===== */
    let hadUpsetGame = false;

    const market = marketCalculator(picks);

    await db().doc(`games/${gameId}`).set(
      {
        market: {
          homeCount: market.homeCount,
          awayCount: market.awayCount,
          drawCount: market.drawCount,
          total: market.total,
          homeRate: market.homeRate,
          awayRate: market.awayRate,
          majority: market.majoritySide,
        },
      },
      { merge: true }
    );

    const winnerSide =
      game.homeScore > game.awayScore ? "home" : "away";

    const upset = upsetJudge({
      market: {
        total: market.total,
        majoritySide: market.majoritySide,
        majorityRatio: market.majorityRatio,
      },
      result: { winnerSide },
      teams: { homeWins, awayWins },
      thresholds: {
        minMarket: MIN_MARKET,
        marketRatio: UPSET_MARKET_RATIO,
        winDiff: UPSET_WIN_DIFF,
      },
    });

    hadUpsetGame = upset.isUpsetGame;

    if (upset.isUpsetGame && upset.meta) {
      await db().doc(`games/${gameId}`).set(
        {
          upsetMeta: {
            homeRank,
            awayRank,
            homeWins,
            awayWins,
            ...upset.meta,
          },
        },
        { merge: true }
      );
    }

    /* ===== ④ finalize posts ===== */
    const batch = db().batch();
    const userUpdateTasks: Promise<any>[] = [];

    for (const doc of postsSnap.docs) {
      await finalizePost({
        postDoc: doc,
        game,
        market,
        hadUpsetGame,
        after,
        batch,
        userUpdateTasks,
      });
    }

    await batch.commit();
    await Promise.all(userUpdateTasks);

    /* ===== ⑤ finalize game ===== */
    if (becameFinal) {
      await db().doc("trend_jobs/users").set(
        {
          needsRebuild: true,
          requestedAt: FieldValue.serverTimestamp(),
          gameId,
        },
        { merge: true }
      );
    }

    await db().doc(`games/${gameId}`).set(
      {
        "game.status": "final",
        "game.finalScore": {
          home: game.homeScore,
          away: game.awayScore,
        },
        resultComputedAtV2: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  }
);
