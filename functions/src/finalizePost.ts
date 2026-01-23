import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { applyPostToUserStatsV2 } from "./updateUserStatsV2";
import { calcPostResult } from "./calcPostResult";

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

  const now = Timestamp.now();

batch.update(postDoc.ref, {
  result: final,

  // ★ 追加ここ
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
      calibrationError: result.calibrationError,
      hadUpsetGame,
    })
  );
}
