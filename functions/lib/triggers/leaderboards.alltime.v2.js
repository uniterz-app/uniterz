"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rebuildLeaderboardAllTimeCron = void 0;
exports.rebuildLeaderboardAllTimeV2 = rebuildLeaderboardAllTimeV2;
// functions/src/triggers/leaderboards.alltime.v2.ts
const scheduler_1 = require("firebase-functions/v2/scheduler");
const firestore_1 = require("firebase-admin/firestore");
const updateUserStatsV2_1 = require("../updateUserStatsV2");
const LEAGUES = ["bj", "nba", "pl"];
async function rebuildLeaderboardAllTimeV2() {
    var _a, _b;
    const db = (0, firestore_1.getFirestore)();
    const usersSnap = await db.collection("users").get();
    for (const league of LEAGUES) {
        const ref = db.collection("leaderboards_v2").doc(`alltime_${league}`);
        // メタ情報更新
        await ref.set({
            league,
            type: "alltime",
            rebuiltAt: firestore_1.FieldValue.serverTimestamp(),
        }, { merge: true });
        // 古いランキング削除
        const oldSnap = await ref.collection("users").get();
        if (!oldSnap.empty) {
            const batch = db.batch();
            oldSnap.docs.forEach((d) => batch.delete(d.ref));
            await batch.commit();
        }
        // ランキング再構築
        for (const user of usersSnap.docs) {
            const uid = user.id;
            const stats = await (0, updateUserStatsV2_1.getStatsV2)(uid);
            const bucket = (_b = (_a = stats === null || stats === void 0 ? void 0 : stats.all) === null || _a === void 0 ? void 0 : _a.leagues) === null || _b === void 0 ? void 0 : _b[league];
            // 掲載基準
            if (!bucket || bucket.posts < 10)
                continue;
            // Brier → 正確性に変換
            const accuracy = (1 - bucket.avgBrier) * 100;
            await ref.collection("users").doc(uid).set({
                uid,
                league,
                posts: bucket.posts,
                winRate: bucket.winRate,
                accuracy, // ← (1 - avgBrier)*100
                avgPrecision: bucket.avgPrecision,
                avgUpset: bucket.avgUpset,
                updatedAt: firestore_1.FieldValue.serverTimestamp(),
            }, { merge: true });
        }
    }
}
exports.rebuildLeaderboardAllTimeCron = (0, scheduler_1.onSchedule)({ schedule: "0 5 * * *", timeZone: "Asia/Tokyo" }, async () => {
    await rebuildLeaderboardAllTimeV2();
});
//# sourceMappingURL=leaderboards.alltime.v2.js.map