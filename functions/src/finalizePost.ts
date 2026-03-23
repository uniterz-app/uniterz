import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { applyPostToUserStatsV2 } from "./updateUserStatsV2";
import { calcPostResult } from "./calcPostResult";
import { calcUpsetPoints } from "./calcUpsetPoints";
import { calcStreakBonus } from "./calcStreakBonus";
import type { UpdatedUserStreakResult } from "./updateUserStreak";

function calcPointsV3({
  predHome,
  predAway,
  finalHome,
  finalAway,
}: {
  predHome: number;
  predAway: number;
  finalHome: number;
  finalAway: number;
}) {
  const finalDiff = finalHome - finalAway;
  const predDiff = predHome - predAway;

  const winnerCorrect =
    (finalDiff > 0 && predDiff > 0) || (finalDiff < 0 && predDiff < 0);

  const diffError = Math.abs(finalDiff - predDiff);
  const totalError = Math.abs((finalHome + finalAway) - (predHome + predAway));

  if (!winnerCorrect) {
    return {
      points: 0,
      basePoints: 0,
      winnerCorrect: false,
      winPoints: 0,
      diffPoints: 0,
      totalPoints: 0,
      diffError,
      totalError,
    };
  }

  const winPoints = 4;

  let diffPoints = 0;
  if (diffError === 0) diffPoints = 4;
  else if (diffError <= 3) diffPoints = 3;
  else if (diffError <= 6) diffPoints = 2;
  else if (diffError <= 10) diffPoints = 1;

  let totalPoints = 0;
  if (totalError <= 3) totalPoints = 2;
  else if (totalError <= 7) totalPoints = 1;

  const basePoints = winPoints + diffPoints + totalPoints; // max 10

  return {
    points: basePoints,
    basePoints,
    winnerCorrect: true,
    winPoints,
    diffPoints,
    totalPoints,
    diffError,
    totalError,
  };
}

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

  const result = calcPostResult({
    prediction: p.prediction,
    final,
    market,
    hadUpsetGame,
    league: game.league,
  });

  // 従来の upset 指標
  const upsetPoints = result.upsetHit
    ? calcUpsetPoints(market.majorityRatio)
    : 0;

  // 総合得点用ボーナス
  const upsetBonus = result.upsetHit ? 2 : 0;

  const predHome = p.prediction?.score?.home;
  const predAway = p.prediction?.score?.away;
  const canScore = Number.isFinite(predHome) && Number.isFinite(predAway);

  const baseScore = canScore
    ? calcPointsV3({
        predHome,
        predAway,
        finalHome: final.home,
        finalAway: final.away,
      })
    : {
        points: 0,
        basePoints: 0,
        winnerCorrect: false,
        winPoints: 0,
        diffPoints: 0,
        totalPoints: 0,
        diffError: null,
        totalError: null,
      };

  const streakInfo = p.authorUid ? streakResultMap.get(p.authorUid) : undefined;
  const activeWinStreak = streakInfo?.activeWinStreak ?? 0;
  const streakBonus = calcStreakBonus(activeWinStreak);

  const totalPoints = baseScore.basePoints + upsetBonus + streakBonus;
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

  userUpdateTasks.push(
    applyPostToUserStatsV2({
      uid: p.authorUid,
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
    })
  );
}