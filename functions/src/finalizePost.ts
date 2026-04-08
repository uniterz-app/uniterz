import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { applyPostToUserStatsV2 } from "./updateUserStatsV2";
import { buildWindowCacheForUser } from "./stats/buildUserStatsWindowCache";
import { computePostSettlement } from "./computePostSettlement";
import type { UpdatedUserStreakResult } from "./updateUserStreak";

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
    activeWinStreak,
  } = computePostSettlement({
    p,
    game: {
      homeScore: final.home,
      awayScore: final.away,
      league: game.league,
    },
    market,
    hadUpsetGame,
    streakResultMap,
  });

  const countsForRanking = game?.countsForRanking !== false;

  const now = Timestamp.now();

  batch.update(postDoc.ref, {
    result: final,

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
        activeWinStreak,
        diffError: baseScore.diffError,
        totalError: baseScore.totalError,
      },
    },

    status: "final",
    settledAt: now,
    updatedAt: FieldValue.serverTimestamp(),
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
      scorePrecision: result.scorePrecision,
      hadUpsetGame,

      upsetHit: result.upsetHit,
      upsetPoints,
      upsetBonus,
      streakBonus,

      points: totalPoints,
      countsForRanking,
    }).then(() => buildWindowCacheForUser(uid))
  );
}
