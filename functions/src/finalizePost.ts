import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { applyPostToUserStatsV2 } from "./updateUserStatsV2";
import { calcPostResult } from "./calcPostResult";
import { calcUpsetPoints } from "./calcUpsetPoints";

function calcPointsV3({
  predHome,
  predAway,
  finalHome,
  finalAway,
  hadUpsetGame,
  upsetHit,
}: {
  predHome: number;
  predAway: number;
  finalHome: number;
  finalAway: number;
  hadUpsetGame: boolean;
  upsetHit: boolean;
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
      winnerCorrect: false,
      winPoints: 0,
      diffPoints: 0,
      totalPoints: 0,
      upsetBonus: 0,
      diffError,
      totalError,
    };
  }

  const winPoints = 3;

  let diffPoints = 0;
  if (diffError === 0) diffPoints = 5;
  else if (diffError <= 3) diffPoints = 4;
  else if (diffError <= 6) diffPoints = 3;
  else if (diffError <= 10) diffPoints = 1;

  let totalPoints = 0;
  if (totalError <= 3) totalPoints = 2;
  else if (totalError <= 6) totalPoints = 1;

  const upsetBonus = hadUpsetGame && upsetHit ? 2 : 0;

  return {
    points: winPoints + diffPoints + totalPoints + upsetBonus, // max 12
    winnerCorrect: true,
    winPoints,
    diffPoints,
    totalPoints,
    upsetBonus,
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
}: any) {
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

  // ===== Upset（独立ポイント）=====
  // calcPostResult 側で upsetHit は「少数派的中」定義に更新済み
  const upsetPoints = result.upsetHit
    ? calcUpsetPoints(market.majorityRatio)
    : 0;

  // ===== V3（既存）=====
  const predHome = p.prediction?.score?.home;
  const predAway = p.prediction?.score?.away;
  const canScore = Number.isFinite(predHome) && Number.isFinite(predAway);

  const pointsV3 = canScore
    ? calcPointsV3({
        predHome,
        predAway,
        finalHome: final.home,
        finalAway: final.away,
        hadUpsetGame,
        upsetHit: !!result.upsetHit,
      })
    : {
        points: 0,
        winnerCorrect: false,
        winPoints: 0,
        diffPoints: 0,
        totalPoints: 0,
        upsetBonus: 0,
        diffError: null,
        totalError: null,
      };

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
      brier: result.brier,
      scorePrecision: result.scorePrecision,
      scorePrecisionDetail: result.scorePrecisionDetail,
      marketCount: market.total,
      marketMajority: result.marketMajority,
      isMajorityPick: result.isMajorityPick,
      hadUpsetGame,
      upsetHit: result.upsetHit,

      // ★ 追加：Upset（独立）
      upsetPoints,

      // ★ 追加：総合得点（V3は変更しない）
      pointsV3: pointsV3.points,
      pointsV3Detail: {
        winnerCorrect: pointsV3.winnerCorrect,
        winPoints: pointsV3.winPoints,
        diffPoints: pointsV3.diffPoints,
        totalPoints: pointsV3.totalPoints,
        upsetBonus: pointsV3.upsetBonus,
        diffError: pointsV3.diffError,
        totalError: pointsV3.totalError,
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
      brier: result.brier,
      scorePrecision: result.scorePrecision,
      confidence: result.confidence,
      hadUpsetGame,

      // ★ 追加：Upset（独立）
      upsetHit: result.upsetHit,
      upsetPoints,

      // ★ 追加：総合得点（V3）
      points: pointsV3.points,
    })
  );
}