"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rebuildLeaderboardAllTimeCron = void 0;
exports.rebuildLeaderboardAllTimeV2 = rebuildLeaderboardAllTimeV2;
// functions/src/triggers/leaderboards.alltime.v2.ts
const scheduler_1 = require("firebase-functions/v2/scheduler");
const firestore_1 = require("firebase-admin/firestore");
const LEAGUES = ["bj", "j1", "nba"];
function emptyBucket() {
    return {
        posts: 0,
        wins: 0,
        scoreErrorSum: 0,
        brierSum: 0,
        upsetScoreSum: 0,
        scorePrecisionSum: 0,
        winRate: 0,
        avgScoreError: 0,
        avgBrier: 0,
        avgUpset: 0,
        avgPrecision: 0,
    };
}
function recomputeCache(b) {
    const posts = b.posts;
    const wins = b.wins;
    return Object.assign(Object.assign({}, b), { winRate: posts ? wins / posts : 0, avgScoreError: posts ? b.scoreErrorSum / posts : 0, avgBrier: posts ? b.brierSum / posts : 0, avgUpset: wins ? b.upsetScoreSum / wins : 0, avgPrecision: posts ? b.scorePrecisionSum / posts : 0 });
}
/* =========================================================
 * user_stats_v2_daily → 全期間合算
 * =======================================================*/
async function sumAllFromDaily(uid, league) {
    const db = (0, firestore_1.getFirestore)();
    const snap = await db
        .collection("user_stats_v2_daily")
        .where("__name__", ">=", `${uid}_`)
        .where("__name__", "<", `${uid}_\uf8ff`)
        .get();
    let b = emptyBucket();
    snap.forEach((d) => {
        var _a;
        const v = d.data();
        const src = league ? (_a = v.leagues) === null || _a === void 0 ? void 0 : _a[league] : v.all;
        if (!src)
            return;
        b.posts += src.posts || 0;
        b.wins += src.wins || 0;
        b.scoreErrorSum += src.scoreErrorSum || 0;
        b.brierSum += src.brierSum || 0;
        b.upsetScoreSum += src.upsetScoreSum || 0;
        b.scorePrecisionSum += src.scorePrecisionSum || 0;
    });
    return recomputeCache(b);
}
/* =========================================================
 * オールタイム ランキング再構築
 * =======================================================*/
async function rebuildLeaderboardAllTimeV2() {
    const db = (0, firestore_1.getFirestore)();
    const usersSnap = await db.collection("users").get();
    for (const league of LEAGUES) {
        const ref = db.collection("leaderboards_v2").doc(`alltime_${league}`);
        // メタ情報
        await ref.set({
            league,
            type: "alltime",
            rebuiltAt: firestore_1.FieldValue.serverTimestamp(),
        }, { merge: true });
        // 古いデータ削除
        const oldSnap = await ref.collection("users").get();
        if (!oldSnap.empty) {
            const batch = db.batch();
            oldSnap.docs.forEach((d) => batch.delete(d.ref));
            await batch.commit();
        }
        // ランキング再生成
        for (const user of usersSnap.docs) {
            const uid = user.id;
            const bucket = await sumAllFromDaily(uid, league);
            // 最低投稿数
            if (!bucket || bucket.posts < 10)
                continue;
            // 精度
            const accuracy = (1 - bucket.avgBrier) * 100;
            await ref.collection("users").doc(uid).set({
                uid,
                league,
                posts: bucket.posts,
                winRate: bucket.winRate,
                accuracy,
                avgPrecision: bucket.avgPrecision,
                avgUpset: bucket.avgUpset,
                updatedAt: firestore_1.FieldValue.serverTimestamp(),
            }, { merge: true });
        }
    }
}
/* =========================================================
 * 月に1回のスケジュール（毎月1日の深夜4時）
 * =======================================================*/
exports.rebuildLeaderboardAllTimeCron = (0, scheduler_1.onSchedule)({ schedule: "0 4 1 * *", timeZone: "Asia/Tokyo" }, async () => {
    await rebuildLeaderboardAllTimeV2();
});
//# sourceMappingURL=leaderboards.alltime.v2.js.map