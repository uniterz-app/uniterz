"use strict";
// functions/src/onGameFinalV2.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.onGameFinalV2 = void 0;
const firestore_1 = require("firebase-functions/v2/firestore");
const firestore_2 = require("firebase-admin/firestore");
const updateUserStatsV2_1 = require("./updateUserStatsV2");
const calcScorePrecision_1 = require("./calcScorePrecision");
const db = () => (0, firestore_2.getFirestore)();
/* =====================================================
 * Upset Score Utility
 * ===================================================== */
const MARKET_K = 1.4;
const MIN_MARKET = 10;
function rankBonus(rankDiff) {
    const MAX = 30;
    const x = Math.min(Math.max(rankDiff, 0), MAX) / MAX;
    const curved = Math.pow(x, 1.3);
    return Math.round(curved * 50) / 10;
}
function calcRawUpsetScore(sameSideRatio, rankDiff) {
    const p = Math.max(0.01, Math.min(0.99, sameSideRatio));
    return MARKET_K * Math.log2(1 / p) + rankBonus(rankDiff);
}
function normalizeUpset(raw) {
    return Math.max(0, Math.min(10, (raw / 8) * 10));
}
/* =====================================================
 * Helpers
 * ===================================================== */
function normalizeGame(after, gameId) {
    var _a, _b, _c, _d, _e;
    return {
        id: gameId,
        league: (_a = after === null || after === void 0 ? void 0 : after.league) !== null && _a !== void 0 ? _a : undefined,
        homeTeamId: (_b = after === null || after === void 0 ? void 0 : after.home) === null || _b === void 0 ? void 0 : _b.teamId,
        awayTeamId: (_c = after === null || after === void 0 ? void 0 : after.away) === null || _c === void 0 ? void 0 : _c.teamId,
        homeScore: (_d = after === null || after === void 0 ? void 0 : after.homeScore) !== null && _d !== void 0 ? _d : null,
        awayScore: (_e = after === null || after === void 0 ? void 0 : after.awayScore) !== null && _e !== void 0 ? _e : null,
        final: !!(after === null || after === void 0 ? void 0 : after.final),
        homeRank: null,
        awayRank: null,
    };
}
function judgeWin(pred, result) {
    if (pred.winner === "draw") {
        return result.home === result.away;
    }
    return pred.winner === "home"
        ? result.home > result.away
        : result.away > result.home;
}
function calcBrier(isWin, confidence) {
    const p = Math.min(0.999, Math.max(0.001, confidence / 100));
    const y = isWin ? 1 : 0;
    return Math.round((p - y) * (p - y) * 10000) / 10000;
}
function calcScoreError(pred, real) {
    return Math.abs(pred.home - real.home) + Math.abs(pred.away - real.away);
}
/* =====================================================
 * Main Trigger
 * ===================================================== */
exports.onGameFinalV2 = (0, firestore_1.onDocumentWritten)({
    document: "games/{gameId}",
    region: "asia-northeast1",
}, async (event) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
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
    /* -----------------------------
     * ランク取得（軽量版）
     * ----------------------------- */
    let homeRank = null;
    let awayRank = null;
    if (game.homeTeamId && game.awayTeamId) {
        const [hSnap, aSnap] = await Promise.all([
            db().doc(`teams/${game.homeTeamId}`).get(),
            db().doc(`teams/${game.awayTeamId}`).get(),
        ]);
        homeRank = Number((_f = (_e = hSnap.data()) === null || _e === void 0 ? void 0 : _e.rank) !== null && _f !== void 0 ? _f : null);
        awayRank = Number((_h = (_g = aSnap.data()) === null || _g === void 0 ? void 0 : _g.rank) !== null && _h !== void 0 ? _h : null);
    }
    game.homeRank = homeRank;
    game.awayRank = awayRank;
    if (!game.final)
        return;
    if (game.homeScore == null || game.awayScore == null)
        return;
    /* -----------------------------
 * teams 勝敗更新（final 確定時のみ）
 * ----------------------------- */
    if (becameFinal && game.homeTeamId && game.awayTeamId) {
        const homeWin = game.homeScore > game.awayScore;
        const awayWin = game.awayScore > game.homeScore;
        const teamBatch = db().batch();
        teamBatch.update(db().doc(`teams/${game.homeTeamId}`), {
            wins: firestore_2.FieldValue.increment(homeWin ? 1 : 0),
            losses: firestore_2.FieldValue.increment(homeWin ? 0 : 1),
            updatedAt: firestore_2.FieldValue.serverTimestamp(),
        });
        teamBatch.update(db().doc(`teams/${game.awayTeamId}`), {
            wins: firestore_2.FieldValue.increment(awayWin ? 1 : 0),
            losses: firestore_2.FieldValue.increment(awayWin ? 0 : 1),
            updatedAt: firestore_2.FieldValue.serverTimestamp(),
        });
        await teamBatch.commit();
    }
    /* -----------------------------
     * 投稿取得
     * ----------------------------- */
    const postsSnap = await db()
        .collection("posts")
        .where("gameId", "==", gameId)
        .where("schemaVersion", "==", 2)
        .get();
    const totalPosts = postsSnap.size;
    let homeCnt = 0, awayCnt = 0;
    postsSnap.forEach((d) => {
        const p = d.data();
        if (p.prediction.winner === "home")
            homeCnt++;
        if (p.prediction.winner === "away")
            awayCnt++;
    });
    const now = firestore_2.Timestamp.now();
    const batch = db().batch();
    const userUpdateTasks = [];
    /* -----------------------------
     * 投稿ごとの処理
     * ----------------------------- */
    for (const doc of postsSnap.docs) {
        const p = doc.data();
        if (p.settledAt)
            continue;
        const final = { home: game.homeScore, away: game.awayScore };
        const isWin = judgeWin(p.prediction, final);
        const scoreError = calcScoreError(p.prediction.score, final);
        const conf = Math.min(99, Math.max(1, p.prediction.confidence));
        const brier = calcBrier(isWin, conf);
        const calibrationError = Math.abs(conf / 100 - (isWin ? 1 : 0));
        const { homePt, awayPt, diffPt, totalPt } = (0, calcScorePrecision_1.calcScorePrecision)({
            predictedHome: p.prediction.score.home,
            predictedAway: p.prediction.score.away,
            actualHome: game.homeScore,
            actualAway: game.awayScore,
            league: (_j = game.league) !== null && _j !== void 0 ? _j : "bj",
        });
        /* -----------------------------
         * upsetScore 計算
         * ----------------------------- */
        /* -----------------------------
    * upsetScore 計算
    * ----------------------------- */
        let upset = 0;
        // draw 的中は upset 対象外
        if (totalPosts >= MIN_MARKET &&
            isWin &&
            p.prediction.winner !== "draw") {
            const same = p.prediction.winner === "home" ? homeCnt : awayCnt;
            const ratio = same / totalPosts;
            if (homeRank != null && awayRank != null) {
                const rankDiff = Math.abs(homeRank - awayRank);
                const higher = homeRank < awayRank ? "home" : "away";
                const winnerSide = final.home > final.away ? "home" : "away";
                if (winnerSide !== higher) {
                    const raw = calcRawUpsetScore(ratio, rankDiff);
                    upset = normalizeUpset(raw);
                }
            }
            else {
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
            updatedAt: firestore_2.FieldValue.serverTimestamp(),
        });
        /* -----------------------------
         * スタッツ更新 (daily)
         * ----------------------------- */
        userUpdateTasks.push((0, updateUserStatsV2_1.applyPostToUserStatsV2)({
            uid: p.authorUid,
            postId: doc.id,
            createdAt: p.createdAt,
            startAt: (_l = (_k = after.startAtJst) !== null && _k !== void 0 ? _k : after.startAt) !== null && _l !== void 0 ? _l : p.createdAt,
            league: game.league,
            isWin,
            scoreError,
            brier,
            upsetScore: upset,
            scorePrecision: totalPt,
            confidence: conf / 100,
            calibrationError,
        }));
        /* -----------------------------
         * ALL TIME キャッシュ更新
         * ----------------------------- */
        userUpdateTasks.push(updateAllTimeCache({
            uid: p.authorUid,
            isWin,
            scoreError,
            brier,
            upsetScore: upset,
            scorePrecision: totalPt,
            calibrationError,
        }));
    }
    /* -----------------------------
     * Commit & Wait
     * ----------------------------- */
    await batch.commit();
    await Promise.all(userUpdateTasks);
    /* -----------------------------
     * ゲーム情報更新
     * ----------------------------- */
    await db().doc(`games/${gameId}`).set({
        "game.status": "final",
        "game.finalScore": { home: game.homeScore, away: game.awayScore },
        resultComputedAtV2: firestore_2.FieldValue.serverTimestamp(),
    }, { merge: true });
});
/* =====================================================
 * ALL TIME CACHE（外側に置く）
 * ===================================================== */
async function updateAllTimeCache({ uid, isWin, scoreError, brier, upsetScore, scorePrecision, calibrationError, }) {
    const ref = db().doc(`user_stats_v2_all_cache/${uid}`);
    await ref.set({
        posts: firestore_2.FieldValue.increment(1),
        wins: firestore_2.FieldValue.increment(isWin ? 1 : 0),
        scoreErrorSum: firestore_2.FieldValue.increment(scoreError),
        brierSum: firestore_2.FieldValue.increment(brier),
        upsetScoreSum: firestore_2.FieldValue.increment(isWin ? upsetScore : 0),
        scorePrecisionSum: firestore_2.FieldValue.increment(scorePrecision),
        calibrationErrorSum: firestore_2.FieldValue.increment(calibrationError),
        calibrationCount: firestore_2.FieldValue.increment(1),
        updatedAt: firestore_2.FieldValue.serverTimestamp(),
    }, { merge: true });
}
//# sourceMappingURL=onGameFinalV2.js.map