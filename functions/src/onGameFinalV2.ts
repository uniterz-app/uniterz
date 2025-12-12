// functions/src/onGameFinalV2.ts

import { onDocumentWritten } from "firebase-functions/v2/firestore";
import { getFirestore, FieldValue, Timestamp } from "firebase-admin/firestore";
import { applyPostToUserStatsV2 } from "./updateUserStatsV2";
import { calcScorePrecision } from "./calcScorePrecision";

const db = () => getFirestore();

/* =====================================================
 * Upset Score Utility
 * ===================================================== */

const MARKET_K = 1.4;
const MIN_MARKET = 10;

function rankBonus(rankDiff: number): number {
  const MAX = 30;
  const x = Math.min(Math.max(rankDiff, 0), MAX) / MAX;
  const curved = Math.pow(x, 1.3);
  return Math.round(curved * 50) / 10;
}

function calcRawUpsetScore(sameSideRatio: number, rankDiff: number) {
  const p = Math.max(0.01, Math.min(0.99, sameSideRatio));
  return MARKET_K * Math.log2(1 / p) + rankBonus(rankDiff);
}

function normalizeUpset(raw: number) {
  return Math.max(0, Math.min(10, (raw / 8) * 10));
}

/* =====================================================
 * Helpers
 * ===================================================== */

function normalizeGame(after: any, gameId: string) {
  return {
    id: gameId,
    league: after?.league ?? undefined,
    homeTeamId: after?.home?.teamId,
    awayTeamId: after?.away?.teamId,
    homeScore: after?.homeScore ?? null,
    awayScore: after?.awayScore ?? null,
    final: !!after?.final,
    homeRank: null as number | null,
    awayRank: null as number | null,
  };
}

function judgeWin(pred: any, result: any) {
  return pred.winner === "home"
    ? result.home > result.away
    : result.away > result.home;
}

function calcBrier(isWin: boolean, confidence: number) {
  const p = Math.min(0.999, Math.max(0.001, confidence / 100));
  const y = isWin ? 1 : 0;
  return Math.round((p - y) * (p - y) * 10000) / 10000;
}

function calcScoreError(pred: any, real: any) {
  return Math.abs(pred.home - real.home) + Math.abs(pred.away - real.away);
}

/* =====================================================
 * Main Trigger
 * ===================================================== */

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

    const game = normalizeGame(after, gameId);

    /* -----------------------------
     * ランク取得（軽量版）
     * ----------------------------- */
    let homeRank: number | null = null;
    let awayRank: number | null = null;

    if (game.homeTeamId && game.awayTeamId) {
      const [hSnap, aSnap] = await Promise.all([
        db().doc(`teams/${game.homeTeamId}`).get(),
        db().doc(`teams/${game.awayTeamId}`).get(),
      ]);

      homeRank = Number(hSnap.data()?.rank ?? null);
      awayRank = Number(aSnap.data()?.rank ?? null);
    }

    game.homeRank = homeRank;
    game.awayRank = awayRank;

    if (!game.final) return;
    if (game.homeScore == null || game.awayScore == null) return;

    /* -----------------------------
     * 投稿取得
     * ----------------------------- */
    const postsSnap = await db()
      .collection("posts")
      .where("gameId", "==", gameId)
      .where("schemaVersion", "==", 2)
      .get();

    const totalPosts = postsSnap.size;
    let homeCnt = 0,
      awayCnt = 0;

    postsSnap.forEach((d) => {
      const p = d.data();
      if (p.prediction.winner === "home") homeCnt++;
      if (p.prediction.winner === "away") awayCnt++;
    });

    const now = Timestamp.now();
    const batch = db().batch();
    const userUpdateTasks: Promise<any>[] = [];

    /* -----------------------------
     * 投稿ごとの処理
     * ----------------------------- */
    for (const doc of postsSnap.docs) {
      const p = doc.data();
      if (p.settledAt) continue;

      const final = { home: game.homeScore!, away: game.awayScore! };
      const isWin = judgeWin(p.prediction, final);
      const scoreError = calcScoreError(p.prediction.score, final);
      const conf = Math.min(99, Math.max(1, p.prediction.confidence));
      const brier = calcBrier(isWin, conf);
      const calibrationError = Math.abs(conf / 100 - (isWin ? 1 : 0));

      const { homePt, awayPt, diffPt, totalPt } = calcScorePrecision({
        predictedHome: p.prediction.score.home,
        predictedAway: p.prediction.score.away,
        actualHome: game.homeScore!,
        actualAway: game.awayScore!,
        league: game.league ?? "bj",
      });

      /* -----------------------------
       * upsetScore 計算
       * ----------------------------- */
      let upset = 0;

      if (totalPosts >= MIN_MARKET && isWin) {
        const same = p.prediction.winner === "home" ? homeCnt : awayCnt;
        const ratio = same / totalPosts;

        if (homeRank != null && awayRank != null) {
          const rankDiff = Math.abs(homeRank - awayRank);
          const higher = homeRank < awayRank ? "home" : "away";
          const winnerSide = final.home > final.away ? "home" : "away";

          if (winnerSide === higher) {
            upset = 0;
          } else {
            const raw = calcRawUpsetScore(ratio, rankDiff);
            upset = normalizeUpset(raw);
          }
        } else {
          const raw = calcRawUpsetScore(ratio, 0);
          upset = normalizeUpset(raw);
        }
      }

      /* -----------------------------
       * 投稿更新バッチ
       * ----------------------------- */
      batch.update(doc.ref, {
        result: final,
        stats: {
          isWin,
          scoreError,
          brier,
          upsetScore: upset,
          scorePrecision: totalPt,
          scorePrecisionDetail: { homePt, awayPt, diffPt },
          marketCount: totalPosts,
        },
        status: "final",
        settledAt: now,
        updatedAt: FieldValue.serverTimestamp(),
      });

      /* -----------------------------
       * スタッツ更新 (daily)
       * ----------------------------- */
      userUpdateTasks.push(
        applyPostToUserStatsV2({
          uid: p.authorUid,
          postId: doc.id,
          createdAt: p.createdAt,
          startAt: after.startAtJst ?? after.startAt ?? p.createdAt,
          league: game.league,
          isWin,
          scoreError,
          brier,
          upsetScore: upset,
          scorePrecision: totalPt,
          confidence: conf / 100,
          calibrationError,
        })
      );

      /* -----------------------------
       * ALL TIME キャッシュ更新
       * ----------------------------- */
      userUpdateTasks.push(
        updateAllTimeCache({
          uid: p.authorUid,
          isWin,
          scoreError,
          brier,
          upsetScore: upset,
          scorePrecision: totalPt,
          calibrationError,
        })
      );
    }

    /* -----------------------------
     * Commit & Wait
     * ----------------------------- */
    await batch.commit();
    await Promise.all(userUpdateTasks);

    /* -----------------------------
     * ゲーム情報更新
     * ----------------------------- */
    await db().doc(`games/${gameId}`).set(
      {
        "game.status": "final",
        "game.finalScore": { home: game.homeScore, away: game.awayScore },
        resultComputedAtV2: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  }
);

/* =====================================================
 * ALL TIME CACHE（外側に置く）
 * ===================================================== */

async function updateAllTimeCache({
  uid,
  isWin,
  scoreError,
  brier,
  upsetScore,
  scorePrecision,
  calibrationError, 
}: {
  uid: string;
  isWin: boolean;
  scoreError: number;
  brier: number;
  upsetScore: number;
  scorePrecision: number;
  calibrationError: number;
}) {
  const ref = db().doc(`user_stats_v2_all_cache/${uid}`);

  await ref.set(
    {
      posts: FieldValue.increment(1),
      wins: FieldValue.increment(isWin ? 1 : 0),
      scoreErrorSum: FieldValue.increment(scoreError),
      brierSum: FieldValue.increment(brier),
      upsetScoreSum: FieldValue.increment(isWin ? upsetScore : 0),
      scorePrecisionSum: FieldValue.increment(scorePrecision),
      calibrationErrorSum: FieldValue.increment(calibrationError),
      calibrationCount: FieldValue.increment(1),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
}
