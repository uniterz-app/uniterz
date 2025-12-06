"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rebuildLeaderboardV2Cron = void 0;
const scheduler_1 = require("firebase-functions/v2/scheduler");
const firestore_1 = require("firebase-admin/firestore");
const updateUserStatsV2_1 = require("../updateUserStatsV2");
// 🚫 削除：トップレベルで Firestore を触らない
// const db = getFirestore();
const LEAGUES = ["bj", "nba", "pl"];
async function rebuildLeaderboardV2() {
    var _a, _b;
    // ✔ 必ず関数内で初期化
    const db = (0, firestore_1.getFirestore)();
    const users = await db.collection("users").get();
    for (const league of LEAGUES) {
        const ref = db.collection("leaderboards_v2").doc(`alltime_${league}`);
        // メタ更新
        await ref.set({ league, rebuiltAt: firestore_1.FieldValue.serverTimestamp() }, { merge: true });
        // 古いランキング削除
        const olds = await ref.collection("users").get();
        const batch = db.batch();
        olds.docs.forEach((d) => batch.delete(d.ref));
        await batch.commit();
        // 書き直し
        for (const u of users.docs) {
            const uid = u.id;
            const stats = await (0, updateUserStatsV2_1.getStatsV2)(uid);
            const bucket = (_b = (_a = stats === null || stats === void 0 ? void 0 : stats.all) === null || _a === void 0 ? void 0 : _a.leagues) === null || _b === void 0 ? void 0 : _b[league];
            if (!bucket || bucket.posts < 10)
                continue;
            await ref.collection("users").doc(uid).set({
                uid,
                league,
                posts: bucket.posts,
                winRate: bucket.winRate,
                avgBrier: bucket.avgBrier,
                avgScoreError: bucket.avgScoreError,
                upsetRate: bucket.upsetRate,
                updatedAt: firestore_1.FieldValue.serverTimestamp(),
            });
        }
    }
}
exports.rebuildLeaderboardV2Cron = (0, scheduler_1.onSchedule)({ schedule: "0 5 * * *", timeZone: "Asia/Tokyo" }, rebuildLeaderboardV2);
//# sourceMappingURL=leaderboards.calendar.v2.js.map