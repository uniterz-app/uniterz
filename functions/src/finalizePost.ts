import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { applyPostToUserStatsV2 } from "./updateUserStatsV2";
import {
  computePostSettlement,
  type PostSettlementComputed,
} from "./computePostSettlement";
import type { UpdatedUserStreakResult } from "./updateUserStreak";
import { isNbaPickupGame } from "./rankings/isPickupGame";
import type { ResultScoreRelAgg } from "./aggregateGamePointsDistribution";

export async function finalizePost({
  postDoc,
  game,
  market,
  hadUpsetGame,
  after,
  batch,
  userUpdateTasks,
  streakResultMap,
  scoreRel = "none",
  settlement: settlementIn,
}: {
  postDoc: FirebaseFirestore.QueryDocumentSnapshot;
  game: any;
  market: any;
  hadUpsetGame: boolean;
  after: any;
  batch: FirebaseFirestore.WriteBatch;
  userUpdateTasks: Promise<any>[];
  streakResultMap: Map<string, UpdatedUserStreakResult>;
  /** カード一覧用。games を読まずに #1/TOP5%/TOP10% を出す */
  scoreRel?: ResultScoreRelAgg;
  /** サマリ構築時の結果を再利用（再計算しない） */
  settlement?: PostSettlementComputed;
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
  } =
    settlementIn ??
    computePostSettlement({
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
        leadingScorers: game.leadingScorers,
      },
      market,
      hadUpsetGame,
      streakResultMap,
    });

  const countsForRanking = game?.countsForRanking !== false;
  const isPickup = isNbaPickupGame(game);

  const now = Timestamp.now();

  const isWc = String(game.league ?? "").toLowerCase() === "wc";
  const matchGoalScorers: unknown[] = [];

  const pkScoreRaw = game?.pkScore;
  const pkScore =
    pkScoreRaw &&
    typeof pkScoreRaw === "object" &&
    pkScoreRaw.home != null &&
    pkScoreRaw.away != null
      ? {
          home: Number(pkScoreRaw.home),
          away: Number(pkScoreRaw.away),
        }
      : null;
  const pkScorePatch =
    pkScore &&
    Number.isFinite(pkScore.home) &&
    Number.isFinite(pkScore.away)
      ? { pkScore }
      : {};

  batch.update(postDoc.ref, {
    result: final,

    ...(isWc ? { matchGoalScorers } : {}),
    ...pkScorePatch,

    marketMeta: {
      majoritySide: market.majoritySide,
      majorityRatio: market.majorityRatio,
      // カード一覧が games を読まずに市場%を出せるよう埋め込み（0–100）
      homePct:
        typeof market.homeRate === "number" && Number.isFinite(market.homeRate)
          ? Math.round(market.homeRate * 1000) / 10
          : null,
      awayPct:
        typeof market.awayRate === "number" && Number.isFinite(market.awayRate)
          ? Math.round(market.awayRate * 1000) / 10
          : null,
      drawPct:
        typeof market.drawRate === "number" && Number.isFinite(market.drawRate)
          ? Math.round(market.drawRate * 1000) / 10
          : null,
    },

    stats: {
      isWin: result.isWin,
      scoreError: result.scoreError,
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
      countedForPickup: countsForRanking && isPickup,

      pointsV3: totalPoints,
      /** カード相対ラベル（一覧が games を読まないための埋め込み） */
      scoreRel,
      pointsV3Detail: {
        basePoints: baseScore.basePoints,
        winnerCorrect: baseScore.winnerCorrect,
        winPoints: baseScore.winPoints,
        diffPoints: baseScore.diffPoints,
        totalPoints: baseScore.totalPoints,
        goalDiffPoints:
          "goalDiffPoints" in baseScore
            ? (baseScore as { goalDiffPoints: number }).goalDiffPoints
            : 0,
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
    wcStage: null,
  });

  const uid = p.authorUid;
  const exactHit = Boolean((baseScore as { exactMatch?: boolean }).exactMatch);
  userUpdateTasks.push(
    (async () => {
      await applyPostToUserStatsV2({
        uid,
        postId: postDoc.id,
        createdAt: p.createdAt,
        startAt: after.startAtJst ?? after.startAt ?? p.createdAt,
        league: game.league,

        isWin: result.isWin,
        scoreError: result.scoreError,
        hadUpsetGame,

        upsetHit: result.upsetHit,
        upsetPoints,
        upsetBonus,
        streakBonus,
        goalScorerBonus,
        goalScorerHit: goalScorerBonus > 0,
        exactHit,

        points: totalPoints,
        countsForRanking,
        isPickup,
        seasonPhase: game?.seasonPhase ?? null,
        wcStage: null,
        homeTeamId: game.homeTeamId ?? p.home?.teamId ?? null,
        awayTeamId: game.awayTeamId ?? p.away?.teamId ?? null,
      });

      const { syncProSkinProgressOnNbaSettle } = await import(
        "./profile/syncProSkinProgressOnNbaSettle"
      );
      await syncProSkinProgressOnNbaSettle({
        uid,
        postId: postDoc.id,
        startAt: after.startAtJst ?? after.startAt ?? p.createdAt,
        league: game.league,
        countsForRanking,
        seasonPhase: game?.seasonPhase ?? null,
        exactHit,
        activeWinStreak,
      });

      const { syncProfileHeroSnapshotOnNbaSettle } = await import(
        "./profile/syncProfileHeroSnapshotOnNbaSettle"
      );
      await syncProfileHeroSnapshotOnNbaSettle({
        uid,
        postId: postDoc.id,
        startAt: after.startAtJst ?? after.startAt ?? p.createdAt,
        league: game.league,
        countsForRanking,
        isPickup,
        seasonPhase: game?.seasonPhase ?? null,
        isWin: result.isWin,
        points: totalPoints,
        upsetPoints,
        upsetBonus,
        streakBonus,
        goalScorerHit: goalScorerBonus > 0,
        hadUpsetGame,
        upsetHit: result.upsetHit,
        activeWinStreak,
      });

      try {
        const { syncUserCareerOnNbaSettle } = await import(
          "./profile/syncUserCareer"
        );
        const streakInfo = streakResultMap.get(uid);
        await syncUserCareerOnNbaSettle({
          uid,
          startAt: after.startAtJst ?? after.startAt ?? p.createdAt,
          league: game.league,
          countsForRanking,
          seasonPhase: game?.seasonPhase ?? null,
          isWin: result.isWin,
          exactHit,
          activeWinStreak,
          maxWinStreak: streakInfo?.maxWinStreak,
        });
      } catch (careerErr) {
        console.warn("[finalizePost] user_career settle sync failed", careerErr);
      }
    })()
  );
}
