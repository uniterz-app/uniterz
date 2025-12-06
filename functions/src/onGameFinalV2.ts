// functions/src/onGameFinalV2.ts

import { onDocumentWritten } from "firebase-functions/v2/firestore";
import { getFirestore, FieldValue, Timestamp } from "firebase-admin/firestore";
import { applyPostToUserStatsV2 } from "./updateUserStatsV2";

import { calcScorePrecision } from "./calcScorePrecision";
import { updateTeamRankings } from "./ranking/updateTeamRankings";

const db = () => getFirestore();

// =====================
// 設定値
// =====================
const MIN_MARKET = 5;      // 市場最低人数
const MIN_GAMES = 15;      // 順位が有効になる試合数

/* -------------------------
   ★ Upset 用（追加）
--------------------------*/

// ランク差ボーナス
function rankBonus(diff: number): number {
  if (diff < 5) return 0;
  if (diff < 10) return 0.5;
  if (diff < 15) return 1.0;
  if (diff < 20) return 1.5;
  if (diff < 25) return 2.0;
  return 3.0;
}

// raw upset 計算
function calcRawUpsetScore(sameSideRatio: number, rankDiff: number): number {
  const p = Math.max(0.01, Math.min(0.99, sameSideRatio)); 
  const marketScore = Math.log2(1 / p);
  return marketScore + rankBonus(rankDiff);
}

// 0〜10 正規化
function normalizeUpsetScore(raw: number): number {
  const MAX_RAW = 8;
  const v = (raw / MAX_RAW) * 10;
  return Math.max(0, Math.min(10, v));
}

// =====================
// 型
// =====================

type GameDoc = {
  id: string;
  league?: string;
  home: string;
  away: string;
  final: boolean;
  homeScore: number | null;
  awayScore: number | null;
  homeTeamId?: string;
  awayTeamId?: string;
};

type PostStatus = "pending" | "final";

type PostV2 = {
  schemaVersion: 2;
  gameId: string;
  authorUid: string;
  createdAt: Timestamp;
  startAtMillis?: number;

  status?: PostStatus;

  prediction: {
    winner: "home" | "away";
    confidence: number;
    score: { home: number; away: number };
  };

  stats?: {
    isWin: boolean;
    scoreError: number;
    brier: number;

    rankingReady: boolean;
    rankingFactor: 0 | 1;
    marketCount: number;
    marketBias: number | null;
    upsetScore: number;

    scorePrecision: number;
    scorePrecisionDetail: {
      homePt: number;
      awayPt: number;
      diffPt: number;
    };
  } | null;

  result?: { home: number; away: number } | null;
  settledAt?: Timestamp | null;
};
/* =======================
 * ユーティリティ
 * ======================= */

function toName(v: any) {
  return typeof v === "string" ? v : (v?.name ?? "");
}

function normalizeGame(after: any, gameId: string): GameDoc {
  return {
    id: gameId,
    league: after?.league ? String(after.league) : undefined,
    home: toName(after?.home),
    away: toName(after?.away),
    final: !!after?.final,
    homeScore: after?.homeScore ?? null,
    awayScore: after?.awayScore ?? null,
    homeTeamId: after?.home?.teamId,
    awayTeamId: after?.away?.teamId,
  };
}

function judgeWin(pred: { winner: "home" | "away" }, result: { home: number; away: number }): boolean {
  return pred.winner === "home"
    ? result.home > result.away
    : result.away > result.home;
}

function calcScoreError(pred: { home: number; away: number }, real: { home: number; away: number }): number {
  return Math.abs(pred.home - real.home) + Math.abs(pred.away - real.away);
}

function calcBrier(isWin: boolean, confidencePct: number): number {
  const p = Math.min(0.999, Math.max(0.001, confidencePct / 100));
  const y = isWin ? 1 : 0;
  const b = (p - y) * (p - y);
  return Math.round(b * 10000) / 10000;
}
export const onGameFinalV2 = onDocumentWritten(
  {
    document: "games/{gameId}",
    region: "asia-northeast1",
  },
  async (event) => {
    const before = event.data?.before?.data();
    const after  = event.data?.after?.data();
    if (!after) return;

    const gameId = event.params.gameId;
    const becameFinal = !before?.final && !!after?.final;
    const scoreChanged =
      before?.homeScore !== after?.homeScore ||
      before?.awayScore !== after?.awayScore;

    if (!becameFinal && !scoreChanged) return;

    const game = normalizeGame(after, gameId);
    if (!game.final) return;
    if (game.homeScore == null || game.awayScore == null) return;

    const postsSnap = await db()
      .collection("posts")
      .where("gameId", "==", gameId)
      .where("schemaVersion", "==", 2)
      .get();

    if (postsSnap.empty) {
      await db().doc(`games/${gameId}`).set(
        { resultComputedAtV2: FieldValue.serverTimestamp() },
        { merge: true }
      );
      return;
    }

    const totalPosts = postsSnap.size;
    let homeCnt = 0, awayCnt = 0;
    postsSnap.forEach(d => {
      const p = d.data() as PostV2;
      if (p.prediction?.winner === "home") homeCnt++;
      if (p.prediction?.winner === "away") awayCnt++;
    });

    const now = Timestamp.now();
    const batch = db().batch();
    const statTasks: Promise<any>[] = [];

    // 順位情報
    let homeRank: number | null = null;
    let awayRank: number | null = null;
    let homeGames = 0;
    let awayGames = 0;

    if (game.homeTeamId && game.awayTeamId) {
      const [hSnap, aSnap] = await Promise.all([
        db().doc(`teams/${game.homeTeamId}`).get(),
        db().doc(`teams/${game.awayTeamId}`).get(),
      ]);

      const h = hSnap.data() || {};
      const a = aSnap.data() || {};
      homeRank = numberOrNull(h.rank);
      awayRank = numberOrNull(a.rank);
      homeGames = Number(h.gamesPlayed || 0);
      awayGames = Number(a.gamesPlayed || 0);
    }

    const rankingReady =
      homeRank != null &&
      awayRank != null &&
      homeGames >= MIN_GAMES &&
      awayGames >= MIN_GAMES;

    const winnerSide = game.homeScore > game.awayScore ? "home" : "away";

    // -------------------------
    // 投稿ごとの処理
    // -------------------------
    for (const doc of postsSnap.docs) {
      const p = doc.data() as PostV2;
      if (p.settledAt) continue;

      const finalScore = { home: game.homeScore!, away: game.awayScore! };
      const isWin = judgeWin(p.prediction, finalScore);
      const scoreError = calcScoreError(p.prediction.score, finalScore);
      const conf = Math.min(99, Math.max(1, p.prediction.confidence));
      const brier = calcBrier(isWin, conf);

      const { homePt, awayPt, diffPt, totalPt } = calcScorePrecision({
        predictedHome: p.prediction.score.home,
        predictedAway: p.prediction.score.away,
        actualHome: game.homeScore!,
        actualAway: game.awayScore!,
        league: game.league ?? "bj",
      });

      // rankingFactor
      let rankingFactor: 0 | 1 = 0;
      if (rankingReady && isWin) {
        const lowerSide = homeRank! > awayRank! ? "home" : "away";
        rankingFactor = (p.prediction.winner === lowerSide && winnerSide === lowerSide) ? 1 : 0;
      }

      // marketBias
      let marketBias: number | null = null;
      if (isWin && totalPosts >= MIN_MARKET) {
        const sameSide =
          p.prediction.winner === "home" ? homeCnt : awayCnt;
        marketBias = 1 - (sameSide / totalPosts);
        marketBias = clamp01(marketBias);
      }

      // -----------------------------
      // ★ NEW: UpsetIndex（0〜10）
      // -----------------------------
      let upsetIndex = 0;

      if (isWin && totalPosts >= MIN_MARKET) {
        const sameSide =
          p.prediction.winner === "home" ? homeCnt : awayCnt;

        const sameSideRatio = sameSide / totalPosts;

        const rankDiff =
          rankingReady && homeRank != null && awayRank != null
            ? Math.abs(homeRank - awayRank)
            : 0;

        const raw = calcRawUpsetScore(sameSideRatio, rankDiff);
        upsetIndex = normalizeUpsetScore(raw);
      }

      // 更新
      batch.update(doc.ref, {
        result: finalScore,
        stats: {
          isWin,
          scoreError,
          brier,

          rankingReady,
          rankingFactor,
          marketCount: totalPosts,
          marketBias,
          upsetScore: upsetIndex,

          scorePrecision: totalPt,
          scorePrecisionDetail: { homePt, awayPt, diffPt },
        },
        settledAt: now,
        status: "final",
        updatedAt: FieldValue.serverTimestamp(),
      });

      statTasks.push(
        applyPostToUserStatsV2({
          uid: p.authorUid,
          postId: doc.id,
          createdAt: p.createdAt,
          league: game.league,
          isWin,
          scoreError,
          brier,
          upsetScore: upsetIndex,   // ★ normalize 済み
          scorePrecision: totalPt,
        })
      );
    }

    await batch.commit();
    await Promise.all(statTasks);

    await db().doc(`games/${gameId}`).set(
      {
        "game.status": "final",
        "game.finalScore": { home: game.homeScore, away: game.awayScore },
        resultComputedAtV2: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
        // ===============================
    // ★ チーム勝敗の更新（V2版）
    // ===============================
    if (game.homeTeamId && game.awayTeamId) {
      const homeId = game.homeTeamId;
      const awayId = game.awayTeamId;

      const homeWon = game.homeScore > game.awayScore;
      const awayWon = game.awayScore > game.homeScore;

      const homeRef = db().doc(`teams/${homeId}`);
      const awayRef = db().doc(`teams/${awayId}`);

      const [homeSnap, awaySnap] = await Promise.all([
        homeRef.get(),
        awayRef.get(),
      ]);

      const homeData = homeSnap.data() || {};
      const awayData = awaySnap.data() || {};

      const homeWins = Number(homeData.wins || 0);
      const homeLosses = Number(homeData.losses || 0);
      const awayWins = Number(awayData.wins || 0);
      const awayLosses = Number(awayData.losses || 0);

      // 勝敗の反映
      const newHomeWins = homeWon ? homeWins + 1 : homeWins;
      const newHomeLosses = awayWon ? homeLosses + 1 : homeLosses;

      const newAwayWins = awayWon ? awayWins + 1 : awayWins;
      const newAwayLosses = homeWon ? awayLosses + 1 : awayLosses;

      // 勝率
      const homeWinRate =
        newHomeWins + newHomeLosses > 0
          ? newHomeWins / (newHomeWins + newHomeLosses)
          : 0;

      const awayWinRate =
        newAwayWins + newAwayLosses > 0
          ? newAwayWins / (newAwayWins + newAwayLosses)
          : 0;

      // Firestore 反映
      await Promise.all([
        homeRef.set(
          {
            wins: newHomeWins,
            losses: newHomeLosses,
            winRate: homeWinRate,
          },
          { merge: true }
        ),
        awayRef.set(
          {
            wins: newAwayWins,
            losses: newAwayLosses,
            winRate: awayWinRate,
          },
          { merge: true }
        ),
      ]);
    }
  }
);

// helpers
function numberOrNull(v: any): number | null {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}
