"use strict";
// functions/src/onGameFinalV2.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.onGameFinalV2 = void 0;
const firestore_1 = require("firebase-functions/v2/firestore");
const firestore_2 = require("firebase-admin/firestore");
const updateUserStatsV2_1 = require("./updateUserStatsV2");
const calcScorePrecision_1 = require("./calcScorePrecision");
const db = () => (0, firestore_2.getFirestore)();
// =====================
// 設定値
// =====================
const MIN_MARKET = 10; // 市場最低人数
const MIN_GAMES = 15; // 順位が有効になる試合数
/* -------------------------
   ★ Upset 用（追加）
--------------------------*/
// アップセット用ランク差ボーナス（新 1.3 カーブ, 最大 5点）
function rankBonus(rankDiff) {
    const MAX = 30; // 想定最大ランク差
    const clamped = Math.min(Math.max(rankDiff, 0), MAX);
    // 0〜1 に正規化
    const x = clamped / MAX;
    // 序盤ゆるく、後半で効いてくるカーブ（指数 1.3）
    const curved = Math.pow(x, 1.3);
    // 最大 5 点にスケーリングして小数1桁に丸め
    const bonus = curved * 5;
    return Math.round(bonus * 10) / 10;
}
const MARKET_K = 1.4;
// raw upset 計算
function calcRawUpsetScore(sameSideRatio, rankDiff) {
    const p = Math.max(0.01, Math.min(0.99, sameSideRatio));
    const marketScore = MARKET_K * Math.log2(1 / p);
    return marketScore + rankBonus(rankDiff);
}
// 0〜10 正規化
function normalizeUpsetScore(raw) {
    const MAX_RAW = 8;
    const v = (raw / MAX_RAW) * 10;
    return Math.max(0, Math.min(10, v));
}
/* =======================
 * ユーティリティ
 * ======================= */
function toName(v) {
    var _a;
    return typeof v === "string" ? v : ((_a = v === null || v === void 0 ? void 0 : v.name) !== null && _a !== void 0 ? _a : "");
}
function normalizeGame(after, gameId) {
    var _a, _b, _c, _d;
    return {
        id: gameId,
        league: (after === null || after === void 0 ? void 0 : after.league) ? String(after.league) : undefined,
        home: toName(after === null || after === void 0 ? void 0 : after.home),
        away: toName(after === null || after === void 0 ? void 0 : after.away),
        final: !!(after === null || after === void 0 ? void 0 : after.final),
        homeScore: (_a = after === null || after === void 0 ? void 0 : after.homeScore) !== null && _a !== void 0 ? _a : null,
        awayScore: (_b = after === null || after === void 0 ? void 0 : after.awayScore) !== null && _b !== void 0 ? _b : null,
        homeTeamId: (_c = after === null || after === void 0 ? void 0 : after.home) === null || _c === void 0 ? void 0 : _c.teamId,
        awayTeamId: (_d = after === null || after === void 0 ? void 0 : after.away) === null || _d === void 0 ? void 0 : _d.teamId,
    };
}
function judgeWin(pred, result) {
    return pred.winner === "home"
        ? result.home > result.away
        : result.away > result.home;
}
function calcScoreError(pred, real) {
    return Math.abs(pred.home - real.home) + Math.abs(pred.away - real.away);
}
function calcBrier(isWin, confidencePct) {
    const p = Math.min(0.999, Math.max(0.001, confidencePct / 100));
    const y = isWin ? 1 : 0;
    const b = (p - y) * (p - y);
    return Math.round(b * 10000) / 10000;
}
exports.onGameFinalV2 = (0, firestore_1.onDocumentWritten)({
    document: "games/{gameId}",
    region: "asia-northeast1",
}, async (event) => {
    var _a, _b, _c, _d, _e;
    const before = (_b = (_a = event.data) === null || _a === void 0 ? void 0 : _a.before) === null || _b === void 0 ? void 0 : _b.data();
    const after = (_d = (_c = event.data) === null || _c === void 0 ? void 0 : _c.after) === null || _d === void 0 ? void 0 : _d.data();
    if (!after)
        return;
    const gameId = event.params.gameId;
    const becameFinal = !(before === null || before === void 0 ? void 0 : before.final) && !!(after === null || after === void 0 ? void 0 : after.final);
    const scoreChanged = (before === null || before === void 0 ? void 0 : before.homeScore) !== (after === null || after === void 0 ? void 0 : after.homeScore) ||
        (before === null || before === void 0 ? void 0 : before.awayScore) !== (after === null || after === void 0 ? void 0 : after.awayScore);
    if (!becameFinal && !scoreChanged)
        return;
    const game = normalizeGame(after, gameId);
    if (!game.final)
        return;
    if (game.homeScore == null || game.awayScore == null)
        return;
    const postsSnap = await db()
        .collection("posts")
        .where("gameId", "==", gameId)
        .where("schemaVersion", "==", 2)
        .get();
    if (postsSnap.empty) {
        await db().doc(`games/${gameId}`).set({ resultComputedAtV2: firestore_2.FieldValue.serverTimestamp() }, { merge: true });
        return;
    }
    const totalPosts = postsSnap.size;
    let homeCnt = 0, awayCnt = 0;
    postsSnap.forEach(d => {
        var _a, _b;
        const p = d.data();
        if (((_a = p.prediction) === null || _a === void 0 ? void 0 : _a.winner) === "home")
            homeCnt++;
        if (((_b = p.prediction) === null || _b === void 0 ? void 0 : _b.winner) === "away")
            awayCnt++;
    });
    const now = firestore_2.Timestamp.now();
    const batch = db().batch();
    const statTasks = [];
    // 順位情報
    let homeRank = null;
    let awayRank = null;
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
    const rankingReady = homeRank != null &&
        awayRank != null &&
        homeGames >= MIN_GAMES &&
        awayGames >= MIN_GAMES;
    const winnerSide = game.homeScore > game.awayScore ? "home" : "away";
    // -------------------------
    // 投稿ごとの処理
    // -------------------------
    for (const doc of postsSnap.docs) {
        const p = doc.data();
        if (p.settledAt)
            continue;
        const finalScore = { home: game.homeScore, away: game.awayScore };
        const isWin = judgeWin(p.prediction, finalScore);
        const scoreError = calcScoreError(p.prediction.score, finalScore);
        const conf = Math.min(99, Math.max(1, p.prediction.confidence));
        const brier = calcBrier(isWin, conf);
        const { homePt, awayPt, diffPt, totalPt } = (0, calcScorePrecision_1.calcScorePrecision)({
            predictedHome: p.prediction.score.home,
            predictedAway: p.prediction.score.away,
            actualHome: game.homeScore,
            actualAway: game.awayScore,
            league: (_e = game.league) !== null && _e !== void 0 ? _e : "bj",
        });
        // rankingFactor
        let rankingFactor = 0;
        if (rankingReady && isWin) {
            const lowerSide = homeRank > awayRank ? "home" : "away";
            rankingFactor = (p.prediction.winner === lowerSide && winnerSide === lowerSide) ? 1 : 0;
        }
        // marketBias
        let marketBias = null;
        if (isWin && totalPosts >= MIN_MARKET) {
            const sameSide = p.prediction.winner === "home" ? homeCnt : awayCnt;
            marketBias = 1 - (sameSide / totalPosts);
            marketBias = clamp01(marketBias);
        }
        // -----------------------------
        // ★ NEW: UpsetIndex（0〜10）
        // -----------------------------
        let upsetIndex = 0;
        if (isWin && totalPosts >= MIN_MARKET) {
            const sameSide = p.prediction.winner === "home" ? homeCnt : awayCnt;
            const sameSideRatio = sameSide / totalPosts;
            const rankDiff = rankingReady && homeRank != null && awayRank != null
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
            updatedAt: firestore_2.FieldValue.serverTimestamp(),
        });
        statTasks.push((0, updateUserStatsV2_1.applyPostToUserStatsV2)({
            uid: p.authorUid,
            postId: doc.id,
            createdAt: p.createdAt,
            league: game.league,
            isWin,
            scoreError,
            brier,
            upsetScore: upsetIndex, // ★ normalize 済み
            scorePrecision: totalPt,
            confidence: conf / 100,
        }));
    }
    await batch.commit();
    await Promise.all(statTasks);
    await db().doc(`games/${gameId}`).set({
        "game.status": "final",
        "game.finalScore": { home: game.homeScore, away: game.awayScore },
        resultComputedAtV2: firestore_2.FieldValue.serverTimestamp(),
    }, { merge: true });
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
        const homeWinRate = newHomeWins + newHomeLosses > 0
            ? newHomeWins / (newHomeWins + newHomeLosses)
            : 0;
        const awayWinRate = newAwayWins + newAwayLosses > 0
            ? newAwayWins / (newAwayWins + newAwayLosses)
            : 0;
        // Firestore 反映
        await Promise.all([
            homeRef.set({
                wins: newHomeWins,
                losses: newHomeLosses,
                winRate: homeWinRate,
            }, { merge: true }),
            awayRef.set({
                wins: newAwayWins,
                losses: newAwayLosses,
                winRate: awayWinRate,
            }, { merge: true }),
        ]);
    }
});
// helpers
function numberOrNull(v) {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
}
function clamp01(x) {
    return Math.max(0, Math.min(1, x));
}
//# sourceMappingURL=onGameFinalV2.js.map