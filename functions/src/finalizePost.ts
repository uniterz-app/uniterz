import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { applyPostToUserStatsV2 } from "./updateUserStatsV2";
import { buildWindowCacheForUser } from "./stats/buildUserStatsWindowCache";
import { computePostSettlement } from "./computePostSettlement";
import type { UpdatedUserStreakResult } from "./updateUserStreak";
import { buildPostMatchGoalScorersFromGame } from "./wc/matchGoalScorersDisplay";
import { resolveWcStageFromGame } from "./wc/resolveWcStage";

export async function finalizePost({
  postDoc,
  game,
  market,
  hadUpsetGame,
  after,
  batch,
  userUpdateTasks,
  streakResultMap,
}: {
  postDoc: FirebaseFirestore.QueryDocumentSnapshot;
  game: any;
  market: any;
  hadUpsetGame: boolean;
  after: any;
  batch: FirebaseFirestore.WriteBatch;
  userUpdateTasks: Promise<any>[];
  streakResultMap: Map<string, UpdatedUserStreakResult>;
}) {
  const p = postDoc.data();
  if (p.settledAt) return;

  const final = { home: game.homeScore!, away: game.awayScore! };

  const {
    totalPoints,
    result,
    baseScore,
    upsetPoints,
    upsetBonus,
    streakBonus,
    goalScorerBonus,
    activeWinStreak,
  } = computePostSettlement({
    p,
    game: {
      homeScore: final.home,
      awayScore: final.away,
      league: game.league,
      homeTeamId: game.homeTeamId,
      awayTeamId: game.awayTeamId,
      regulationEtScore: game.regulationEtScore,
      advancingTeamId: game.advancingTeamId,
      knockout: game.knockout,
      countsForRanking: game.countsForRanking,
      goalScorers: game.goalScorers,
    },
    market,
    hadUpsetGame,
    streakResultMap,
  });

  const countsForRanking = game?.countsForRanking !== false;
  const resolvedWcStage = resolveWcStageFromGame({
    knockout: game?.knockout,
    roundLabel: game?.roundLabel,
    wcStage: game?.wcStage,
  });

  const now = Timestamp.now();

  const isWc = String(game.league ?? "").toLowerCase() === "wc";
  const matchGoalScorers = isWc
    ? buildPostMatchGoalScorersFromGame(
        game.goalScorers,
        game.homeTeamId,
        game.awayTeamId
      )
    : [];

  batch.update(postDoc.ref, {
    result: final,

    ...(isWc ? { matchGoalScorers } : {}),

    marketMeta: {
      majoritySide: market.majoritySide,
      majorityRatio: market.majorityRatio,
    },

    stats: {
      isWin: result.isWin,
      scoreError: result.scoreError,
      scorePrecision: result.scorePrecision,
      scorePrecisionDetail: result.scorePrecisionDetail,
      marketCount: market.total,
      marketMajority: result.marketMajority,
      isMajorityPick: result.isMajorityPick,
      hadUpsetGame,
      upsetHit: result.upsetHit,

      upsetPoints,
      upsetBonus,
      streakBonus,
      goalScorerBonus,

      exactMatch: Boolean((baseScore as { exactMatch?: boolean }).exactMatch),

      countedForRanking: countsForRanking,

      pointsV3: totalPoints,
      pointsV3Detail: {
        basePoints: baseScore.basePoints,
        winnerCorrect: baseScore.winnerCorrect,
        winPoints: baseScore.winPoints,
        diffPoints: baseScore.diffPoints,
        totalPoints: baseScore.totalPoints,
        upsetBonus,
        streakBonus,
        goalScorerBonus,
        activeWinStreak,
        diffError: baseScore.diffError,
        totalError: baseScore.totalError,
        exactMatch: Boolean((baseScore as { exactMatch?: boolean }).exactMatch),
      },
    },

    status: "final",
    settledAt: now,
    updatedAt: FieldValue.serverTimestamp(),

    seasonPhase: game?.seasonPhase ?? null,
    seasonRound: game?.seasonRound ?? null,
    wcStage: resolvedWcStage,
  });

  const uid = p.authorUid;
  userUpdateTasks.push(
    applyPostToUserStatsV2({
      uid,
      postId: postDoc.id,
      createdAt: p.createdAt,
      startAt: after.startAtJst ?? after.startAt ?? p.createdAt,
      league: game.league,

      isWin: result.isWin,
      scoreError: result.scoreError,
      scorePrecision: isWc ? 0 : result.scorePrecision,
      hadUpsetGame,

      upsetHit: result.upsetHit,
      upsetPoints,
      upsetBonus,
      streakBonus,
      goalScorerBonus,
      goalScorerHit: goalScorerBonus > 0,
      exactHit: isWc && Boolean((baseScore as { exactMatch?: boolean }).exactMatch),

      points: totalPoints,
      countsForRanking,
      seasonPhase: game?.seasonPhase ?? null,
      seasonRound: game?.seasonRound ?? null,
      wcStage: resolvedWcStage,
      homeTeamId: game.homeTeamId ?? p.home?.teamId ?? null,
      awayTeamId: game.awayTeamId ?? p.away?.teamId ?? null,
    }).then(() => buildWindowCacheForUser(uid))
  );
}
