"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateTeamStats = updateTeamStats;
const firestore_1 = require("firebase-admin/firestore");
function rankToGroup(rank) {
    if (rank == null)
        return null;
    if (rank <= 6)
        return 1; // 優勝候補
    if (rank <= 12)
        return 2; // 強豪
    if (rank <= 18)
        return 3; // 平均
    if (rank <= 24)
        return 4; // 弱
    return 5; // 弱小
}
async function updateTeamStats({ db, game, homeConference, awayConference, homeWins, // ★ 追加
awayWins, // ★ 追加
 }) {
    // ===== ガード =====
    if (game.league !== "nba" ||
        !game.homeTeamId ||
        !game.awayTeamId) {
        return;
    }
    if (!homeConference || !awayConference)
        return;
    // ===== 勝敗判定 =====
    const homeWin = game.homeScore > game.awayScore;
    const awayWin = game.awayScore > game.homeScore;
    const isDraw = game.homeScore === game.awayScore;
    // ===== 順位差クッション付きグループ判定 =====
    const homeGroup = rankToGroup(game.homeRank);
    const awayGroup = rankToGroup(game.awayRank);
    let homeGroupRelation = null;
    let awayGroupRelation = null;
    if (homeGroup != null &&
        awayGroup != null &&
        game.homeRank != null &&
        game.awayRank != null) {
        const rankDiff = game.awayRank - game.homeRank;
        // クッション：±2 は無条件で同格
        if (Math.abs(rankDiff) <= 2) {
            homeGroupRelation = "same";
            awayGroupRelation = "same";
        }
        else {
            const groupDiff = awayGroup - homeGroup;
            if (groupDiff <= -2)
                homeGroupRelation = "higherBig";
            else if (groupDiff === -1)
                homeGroupRelation = "higher";
            else if (groupDiff === 0)
                homeGroupRelation = "same";
            else if (groupDiff === 1)
                homeGroupRelation = "lower";
            else if (groupDiff >= 2)
                homeGroupRelation = "lowerBig";
            // 反転
            if (groupDiff >= 2)
                awayGroupRelation = "higherBig";
            else if (groupDiff === 1)
                awayGroupRelation = "higher";
            else if (groupDiff === 0)
                awayGroupRelation = "same";
            else if (groupDiff === -1)
                awayGroupRelation = "lower";
            else if (groupDiff <= -2)
                awayGroupRelation = "lowerBig";
        }
    }
    // ===== 勝率比較（試合時点・勝数ベース）=====
    const homeVsHigher = awayWins > homeWins;
    const homeVsLower = awayWins < homeWins;
    const awayVsHigher = homeWins > awayWins;
    const awayVsLower = homeWins < awayWins;
    const diff = game.homeScore - game.awayScore;
    const isClose = Math.abs(diff) <= 5;
    const homeRef = db.doc(`teams/${game.homeTeamId}`);
    const awayRef = db.doc(`teams/${game.awayTeamId}`);
    // ===== 累計スタッツ更新 =====
    const batch = db.batch();
    // HOME
    batch.update(homeRef, {
        gamesPlayed: firestore_1.FieldValue.increment(1),
        pointsForTotal: firestore_1.FieldValue.increment(game.homeScore),
        pointsAgainstTotal: firestore_1.FieldValue.increment(game.awayScore),
        homeGames: firestore_1.FieldValue.increment(1),
        homeWins: firestore_1.FieldValue.increment(homeWin ? 1 : 0),
        vsHigherGames: firestore_1.FieldValue.increment(homeVsHigher ? 1 : 0),
        vsHigherWins: firestore_1.FieldValue.increment(homeVsHigher && homeWin ? 1 : 0),
        vsLowerGames: firestore_1.FieldValue.increment(homeVsLower ? 1 : 0),
        vsLowerWins: firestore_1.FieldValue.increment(homeVsLower && homeWin ? 1 : 0),
        vsEastGames: firestore_1.FieldValue.increment(awayConference === "east" ? 1 : 0),
        vsEastWins: firestore_1.FieldValue.increment(homeWin && awayConference === "east" ? 1 : 0),
        homePointsForTotal: firestore_1.FieldValue.increment(game.homeScore),
        homePointsAgainstTotal: firestore_1.FieldValue.increment(game.awayScore),
        vsWestGames: firestore_1.FieldValue.increment(awayConference === "west" ? 1 : 0),
        vsWestWins: firestore_1.FieldValue.increment(homeWin && awayConference === "west" ? 1 : 0),
        closeGames: firestore_1.FieldValue.increment(isClose ? 1 : 0),
        closeWins: firestore_1.FieldValue.increment(isClose && homeWin ? 1 : 0),
        vsGroupHigherBigGames: firestore_1.FieldValue.increment(homeGroupRelation === "higherBig" ? 1 : 0),
        vsGroupHigherBigWins: firestore_1.FieldValue.increment(homeGroupRelation === "higherBig" && homeWin ? 1 : 0),
        vsGroupHigherGames: firestore_1.FieldValue.increment(homeGroupRelation === "higher" ? 1 : 0),
        vsGroupHigherWins: firestore_1.FieldValue.increment(homeGroupRelation === "higher" && homeWin ? 1 : 0),
        vsGroupSameGames: firestore_1.FieldValue.increment(homeGroupRelation === "same" ? 1 : 0),
        vsGroupSameWins: firestore_1.FieldValue.increment(homeGroupRelation === "same" && homeWin ? 1 : 0),
        vsGroupLowerGames: firestore_1.FieldValue.increment(homeGroupRelation === "lower" ? 1 : 0),
        vsGroupLowerWins: firestore_1.FieldValue.increment(homeGroupRelation === "lower" && homeWin ? 1 : 0),
        vsGroupLowerBigGames: firestore_1.FieldValue.increment(homeGroupRelation === "lowerBig" ? 1 : 0),
        vsGroupLowerBigWins: firestore_1.FieldValue.increment(homeGroupRelation === "lowerBig" && homeWin ? 1 : 0),
        updatedAt: firestore_1.FieldValue.serverTimestamp(),
    });
    // AWAY
    batch.update(awayRef, {
        gamesPlayed: firestore_1.FieldValue.increment(1),
        pointsForTotal: firestore_1.FieldValue.increment(game.awayScore),
        pointsAgainstTotal: firestore_1.FieldValue.increment(game.homeScore),
        awayGames: firestore_1.FieldValue.increment(1),
        awayWins: firestore_1.FieldValue.increment(awayWin ? 1 : 0),
        vsHigherGames: firestore_1.FieldValue.increment(awayVsHigher ? 1 : 0),
        vsHigherWins: firestore_1.FieldValue.increment(awayVsHigher && awayWin ? 1 : 0),
        vsLowerGames: firestore_1.FieldValue.increment(awayVsLower ? 1 : 0),
        vsLowerWins: firestore_1.FieldValue.increment(awayVsLower && awayWin ? 1 : 0),
        awayPointsForTotal: firestore_1.FieldValue.increment(game.awayScore),
        awayPointsAgainstTotal: firestore_1.FieldValue.increment(game.homeScore),
        vsEastGames: firestore_1.FieldValue.increment(homeConference === "east" ? 1 : 0),
        vsEastWins: firestore_1.FieldValue.increment(awayWin && homeConference === "east" ? 1 : 0),
        vsWestGames: firestore_1.FieldValue.increment(homeConference === "west" ? 1 : 0),
        vsWestWins: firestore_1.FieldValue.increment(awayWin && homeConference === "west" ? 1 : 0),
        closeGames: firestore_1.FieldValue.increment(isClose ? 1 : 0),
        closeWins: firestore_1.FieldValue.increment(isClose && awayWin ? 1 : 0),
        vsGroupHigherBigGames: firestore_1.FieldValue.increment(awayGroupRelation === "higherBig" ? 1 : 0),
        vsGroupHigherBigWins: firestore_1.FieldValue.increment(awayGroupRelation === "higherBig" && awayWin ? 1 : 0),
        vsGroupHigherGames: firestore_1.FieldValue.increment(awayGroupRelation === "higher" ? 1 : 0),
        vsGroupHigherWins: firestore_1.FieldValue.increment(awayGroupRelation === "higher" && awayWin ? 1 : 0),
        vsGroupSameGames: firestore_1.FieldValue.increment(awayGroupRelation === "same" ? 1 : 0),
        vsGroupSameWins: firestore_1.FieldValue.increment(awayGroupRelation === "same" && awayWin ? 1 : 0),
        vsGroupLowerGames: firestore_1.FieldValue.increment(awayGroupRelation === "lower" ? 1 : 0),
        vsGroupLowerWins: firestore_1.FieldValue.increment(awayGroupRelation === "lower" && awayWin ? 1 : 0),
        vsGroupLowerBigGames: firestore_1.FieldValue.increment(awayGroupRelation === "lowerBig" ? 1 : 0),
        vsGroupLowerBigWins: firestore_1.FieldValue.increment(awayGroupRelation === "lowerBig" && awayWin ? 1 : 0),
        updatedAt: firestore_1.FieldValue.serverTimestamp(),
    });
    await batch.commit();
    // ===== currentStreak / lastGames =====
    const now = firestore_1.Timestamp.now();
    const ONE_DAY_MS = 24 * 60 * 60 * 1000;
    function calcIsB2B(lastGames) {
        const prevAt = lastGames.length > 0 ? lastGames[lastGames.length - 1].at : null;
        return (prevAt != null &&
            now.toMillis() - prevAt.toMillis() <= ONE_DAY_MS);
    }
    // HOME
    await db.runTransaction(async (tx) => {
        var _a, _b;
        const snap = await tx.get(homeRef);
        const current = (_a = snap.get("currentStreak")) !== null && _a !== void 0 ? _a : 0;
        const lastGames = ((_b = snap.get("lastGames")) !== null && _b !== void 0 ? _b : []);
        const isB2B = calcIsB2B(lastGames);
        let nextStreak = 0;
        if (homeWin)
            nextStreak = current > 0 ? current + 1 : 1;
        else if (!isDraw)
            nextStreak = current < 0 ? current - 1 : -1;
        tx.set(homeRef, {
            currentStreak: nextStreak,
            b2bGames: firestore_1.FieldValue.increment(isB2B ? 1 : 0),
            b2bWins: firestore_1.FieldValue.increment(isB2B && homeWin ? 1 : 0),
            lastGames: [
                ...lastGames,
                {
                    at: now,
                    homeAway: "home",
                    isWin: homeWin,
                    teamScore: game.homeScore,
                    oppScore: game.awayScore,
                    oppTeamId: game.awayTeamId,
                    selfRank: game.homeRank,
                    oppRank: game.awayRank,
                    rankDiff: game.awayRank - game.homeRank,
                },
            ].slice(-10),
            updatedAt: firestore_1.FieldValue.serverTimestamp(),
        }, { merge: true });
    });
    // AWAY
    await db.runTransaction(async (tx) => {
        var _a, _b;
        const snap = await tx.get(awayRef);
        const current = (_a = snap.get("currentStreak")) !== null && _a !== void 0 ? _a : 0;
        const lastGames = ((_b = snap.get("lastGames")) !== null && _b !== void 0 ? _b : []);
        let nextStreak = 0;
        if (awayWin)
            nextStreak = current > 0 ? current + 1 : 1;
        else if (!isDraw)
            nextStreak = current < 0 ? current - 1 : -1;
        const isB2B = calcIsB2B(lastGames);
        tx.set(awayRef, {
            currentStreak: nextStreak,
            b2bGames: firestore_1.FieldValue.increment(isB2B ? 1 : 0),
            b2bWins: firestore_1.FieldValue.increment(isB2B && awayWin ? 1 : 0),
            lastGames: [
                ...lastGames,
                {
                    at: now,
                    homeAway: "away",
                    isWin: awayWin,
                    teamScore: game.awayScore,
                    oppScore: game.homeScore,
                    oppTeamId: game.homeTeamId,
                    selfRank: game.awayRank,
                    oppRank: game.homeRank,
                    rankDiff: game.homeRank - game.awayRank,
                },
            ].slice(-10),
            updatedAt: firestore_1.FieldValue.serverTimestamp(),
        }, { merge: true });
    });
}
//# sourceMappingURL=updateTeamStats.js.map