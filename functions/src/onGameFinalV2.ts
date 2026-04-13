// functions/src/onGameFinalV2.ts
import { onDocumentWritten } from "firebase-functions/v2/firestore";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

import { fetchGameContext } from "./fetchGameContext";
import { marketCalculator } from "./marketCalculator";
import { upsetJudge } from "./upsetJudge";
import { finalizePost } from "./finalizePost";
import { aggregateGamePointsDistributionFromPostsSnap } from "./aggregateGamePointsDistribution";
import { updateUserStreak } from "./updateUserStreak";
import { updateTeamStats } from "./updateTeamStats";
import { updateTeamSeasonRecord } from "./updateTeamSeasonRecord";
import {
  countsTowardPlayoffTeamStats,
  countsTowardRegularSeasonTeamStats,
} from "./teamStandingsSeasonPhase";

const db = () => getFirestore();

const MIN_MARKET = 10;
const UPSET_MARKET_RATIO = 0.6;
const UPSET_WIN_DIFF = 10;

export const onGameFinalV2 = onDocumentWritten(
  {
    document: "games/{gameId}",
    region: "asia-northeast1",
  },
  async (event) => {
    const firestore = db();
    const before = event.data?.before?.data();
    const after = event.data?.after?.data();
    if (!after) return;

    const gameId = event.params.gameId;

    const becameFinal = !before?.final && !!after?.final;
    if (!becameFinal) return;

    /* ===== ① context 取得 ===== */
    const ctx = await fetchGameContext({
      db: firestore,
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
    let streakResultMap = new Map();

    if (becameFinal) {
      streakResultMap = await updateUserStreak({
        db: firestore,
        gameId,
        final: { home: game.homeScore, away: game.awayScore },
      });

      if (countsTowardRegularSeasonTeamStats(game.seasonPhase)) {
        await updateTeamSeasonRecord({
          db: firestore,
          league: game.league,
          homeTeamId: game.homeTeamId,
          awayTeamId: game.awayTeamId,
          homeScore: game.homeScore,
          awayScore: game.awayScore,
          target: "regular",
        });

        await updateTeamStats({
          db: firestore,
          game: {
            ...game,
            homeRank,
            awayRank,
          },
          homeConference,
          awayConference,
          homeWins,
          awayWins,
          target: "regular",
        });
      }

      if (countsTowardPlayoffTeamStats(game.seasonPhase)) {
        await updateTeamSeasonRecord({
          db: firestore,
          league: game.league,
          homeTeamId: game.homeTeamId,
          awayTeamId: game.awayTeamId,
          homeScore: game.homeScore,
          awayScore: game.awayScore,
          target: "playoffs",
        });

        await updateTeamStats({
          db: firestore,
          game: {
            ...game,
            homeRank,
            awayRank,
          },
          homeConference,
          awayConference,
          homeWins,
          awayWins,
          target: "playoffs",
        });
      }
    }

    /* ===== ③ market / upset ===== */
    let hadUpsetGame = false;

    const market = marketCalculator(picks);

    const winnerSide = game.homeScore > game.awayScore ? "home" : "away";

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

    /* ===== ④ finalize posts ===== */
    const batch = firestore.batch();
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
        streakResultMap,
      });
    }

    const pointsDistribution = aggregateGamePointsDistributionFromPostsSnap({
      postsSnap,
      game: {
        homeScore: game.homeScore!,
        awayScore: game.awayScore!,
        league: game.league,
      },
      market,
      hadUpsetGame,
      streakResultMap,
    });

    await batch.commit();
    await Promise.all(userUpdateTasks);

    /* ===== ⑤ finalize game ===== */
    const gamePatch: Record<string, any> = {
      market: {
        homeCount: market.homeCount,
        awayCount: market.awayCount,
        drawCount: market.drawCount,
        total: market.total,
        homeRate: market.homeRate,
        awayRate: market.awayRate,
        majority: market.majoritySide,
        majorityRatio: market.majorityRatio,
      },
      pointsDistribution: {
        ...pointsDistribution,
        updatedAtMillis: Date.now(),
      },
      "game.status": "final",
      "game.finalScore": {
        home: game.homeScore,
        away: game.awayScore,
      },
      resultComputedAtV2: FieldValue.serverTimestamp(),
    };

    if (upset.isUpsetGame && upset.meta) {
      gamePatch.upsetMeta = {
        homeRank,
        awayRank,
        homeWins,
        awayWins,
        ...upset.meta,
      };
    }

    await firestore.doc(`games/${gameId}`).set(gamePatch, { merge: true });

    if (becameFinal) {
      await firestore.doc("trend_jobs/users").set(
        {
          needsRebuild: true,
          requestedAt: FieldValue.serverTimestamp(),
          gameId,
        },
        { merge: true }
      );
    }
  }
);