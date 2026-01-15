"use strict";
// functions/src/onGameFinalV2.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.onGameFinalV2 = void 0;
const firestore_1 = require("firebase-functions/v2/firestore");
const firestore_2 = require("firebase-admin/firestore");
const updateUserStatsV2_1 = require("./updateUserStatsV2");
const calcScorePrecision_1 = require("./calcScorePrecision");
const db = () => (0, firestore_2.getFirestore)();
/* =========================
 * Upset 判定用定数
 * ========================= */
const MIN_MARKET = 10; // 最低投稿数
const UPSET_MARKET_RATIO = 0.7; // 市場偏り 70%
const UPSET_WIN_DIFF = 10; // 勝数差 10
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
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q;
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
  * チーム順位・勝数取得（Upset 判定用）
  * ----------------------------- */
    let homeRank = null;
    let awayRank = null;
    let homeWins = 0;
    let awayWins = 0;
    if (game.homeTeamId && game.awayTeamId) {
        const [hSnap, aSnap] = await Promise.all([
            db().doc(`teams/${game.homeTeamId}`).get(),
            db().doc(`teams/${game.awayTeamId}`).get(),
        ]);
        homeRank = Number((_f = (_e = hSnap.data()) === null || _e === void 0 ? void 0 : _e.rank) !== null && _f !== void 0 ? _f : null);
        awayRank = Number((_h = (_g = aSnap.data()) === null || _g === void 0 ? void 0 : _g.rank) !== null && _h !== void 0 ? _h : null);
        homeWins = Number((_k = (_j = hSnap.data()) === null || _j === void 0 ? void 0 : _j.wins) !== null && _k !== void 0 ? _k : 0);
        awayWins = Number((_m = (_l = aSnap.data()) === null || _l === void 0 ? void 0 : _l.wins) !== null && _m !== void 0 ? _m : 0);
    }
    game.homeRank = homeRank;
    game.awayRank = awayRank;
    if (!game.final)
        return;
    if (game.homeScore == null || game.awayScore == null)
        return;
    /* -----------------------------
 * ユーザー連勝更新（試合単位・1回のみ）
 * ----------------------------- */
    if (becameFinal) {
        // この試合で「勝ったユーザー」を一意に判定する
        const final = { home: game.homeScore, away: game.awayScore };
        const usersSnap = await db()
            .collection("posts")
            .where("gameId", "==", gameId)
            .where("schemaVersion", "==", 2)
            .get();
        // uid ごとに「この試合は勝ちか負けか」を確定させる
        const userResult = new Map();
        usersSnap.docs.forEach((d) => {
            const p = d.data();
            if (userResult.has(p.authorUid))
                return; // 同一試合で複数投稿しても1回
            const win = judgeWin(p.prediction, final);
            userResult.set(p.authorUid, win);
        });
        // ユーザーごとに streak 更新（1ユーザー = 1回）
        for (const [uid, didWin] of userResult.entries()) {
            const ref = db().doc(`user_stats_v2/${uid}`);
            await db().runTransaction(async (tx) => {
                var _a, _b;
                const snap = await tx.get(ref);
                let current = (_a = snap.get("currentStreak")) !== null && _a !== void 0 ? _a : 0;
                let max = (_b = snap.get("maxStreak")) !== null && _b !== void 0 ? _b : 0;
                if (didWin) {
                    current += 1;
                    if (current > max)
                        max = current;
                }
                else {
                    current = 0;
                }
                tx.set(ref, {
                    currentStreak: current,
                    maxStreak: max,
                    updatedAt: firestore_2.FieldValue.serverTimestamp(),
                }, { merge: true });
            });
        }
    }
    /* -----------------------------
     * teams 勝敗更新（final 確定時のみ）
     * ----------------------------- */
    if (becameFinal && game.homeTeamId && game.awayTeamId) {
        const isDraw = game.homeScore === game.awayScore;
        const homeWin = game.homeScore > game.awayScore;
        const awayWin = game.awayScore > game.homeScore;
        const teamBatch = db().batch();
        // HOME TEAM
        teamBatch.update(db().doc(`teams/${game.homeTeamId}`), {
            wins: firestore_2.FieldValue.increment(homeWin ? 1 : 0),
            losses: firestore_2.FieldValue.increment(homeWin || isDraw ? 0 : 1),
            d: firestore_2.FieldValue.increment(isDraw ? 1 : 0),
            updatedAt: firestore_2.FieldValue.serverTimestamp(),
        });
        // AWAY TEAM
        teamBatch.update(db().doc(`teams/${game.awayTeamId}`), {
            wins: firestore_2.FieldValue.increment(awayWin ? 1 : 0),
            losses: firestore_2.FieldValue.increment(awayWin || isDraw ? 0 : 1),
            d: firestore_2.FieldValue.increment(isDraw ? 1 : 0),
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
    let hadUpsetGame = false;
    let homeCnt = 0;
    let awayCnt = 0;
    let drawCnt = 0;
    postsSnap.forEach((d) => {
        const w = d.data().prediction.winner;
        if (w === "home")
            homeCnt++;
        else if (w === "away")
            awayCnt++;
        else if (w === "draw")
            drawCnt++;
    });
    /* -----------------------------
     * Upset Game 判定
     * ----------------------------- */
    if (totalPosts >= MIN_MARKET) {
        const majority = homeCnt >= awayCnt
            ? { side: "home", ratio: homeCnt / totalPosts }
            : { side: "away", ratio: awayCnt / totalPosts };
        const winnerSide = game.homeScore > game.awayScore ? "home" : "away";
        const winDiff = winnerSide === "home"
            ? awayWins - homeWins
            : homeWins - awayWins;
        if (majority.side !== winnerSide &&
            majority.ratio >= UPSET_MARKET_RATIO &&
            winDiff >= UPSET_WIN_DIFF) {
            hadUpsetGame = true;
            // ★ Pro 表示用 Upset メタ保存
            await db().doc(`games/${gameId}`).set({
                upsetMeta: {
                    homeRank,
                    awayRank,
                    homeWins,
                    awayWins,
                    marketMajoritySide: majority.side,
                    marketMajorityRatio: majority.ratio,
                    winDiff,
                },
            }, { merge: true });
        }
    }
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
            league: (_o = game.league) !== null && _o !== void 0 ? _o : "bj",
        });
        /* -----------------------------
         * 投稿更新バッチ
         * ----------------------------- */
        const upsetHit = hadUpsetGame && isWin;
        batch.update(doc.ref, {
            result: final,
            stats: {
                isWin,
                scoreError,
                brier,
                scorePrecision: totalPt,
                scorePrecisionDetail: { homePt, awayPt, diffPt },
                marketCount: totalPosts,
                // ★ Upset 用フラグ（追加）
                hadUpsetGame,
                upsetHit,
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
            startAt: (_q = (_p = after.startAtJst) !== null && _p !== void 0 ? _p : after.startAt) !== null && _q !== void 0 ? _q : p.createdAt,
            league: game.league,
            isWin,
            scoreError,
            brier,
            scorePrecision: totalPt,
            confidence: conf,
            calibrationError,
            hadUpsetGame,
        }));
        /* -----------------------------
         * ALL TIME キャッシュ更新
         * ----------------------------- */
        userUpdateTasks.push(updateAllTimeCache({
            uid: p.authorUid,
            isWin,
            scoreError,
            brier,
            scorePrecision: totalPt,
            calibrationError,
        }));
    }
    /* -----------------------------
     * Commit & Wait
     * ----------------------------- */
    await batch.commit();
    await Promise.all(userUpdateTasks);
    /* ★ ここに「再集計リクエスト」だけ追加する */
    if (becameFinal) {
        await db().doc("trend_jobs/users").set({
            needsRebuild: true,
            requestedAt: firestore_2.FieldValue.serverTimestamp(),
            gameId,
        }, { merge: true });
    }
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
async function updateAllTimeCache({ uid, isWin, scoreError, brier, scorePrecision, calibrationError, }) {
    const ref = db().doc(`user_stats_v2_all_cache/${uid}`);
    await ref.set({
        posts: firestore_2.FieldValue.increment(1),
        wins: firestore_2.FieldValue.increment(isWin ? 1 : 0),
        scoreErrorSum: firestore_2.FieldValue.increment(scoreError),
        brierSum: firestore_2.FieldValue.increment(brier),
        scorePrecisionSum: firestore_2.FieldValue.increment(scorePrecision),
        calibrationErrorSum: firestore_2.FieldValue.increment(calibrationError),
        calibrationCount: firestore_2.FieldValue.increment(1),
        updatedAt: firestore_2.FieldValue.serverTimestamp(),
    }, { merge: true });
}
//# sourceMappingURL=onGameFinalV2.js.map