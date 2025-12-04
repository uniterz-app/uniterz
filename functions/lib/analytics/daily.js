"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dailyAnalytics = void 0;
const scheduler_1 = require("firebase-functions/v2/scheduler");
const firestore_1 = require("firebase-admin/firestore");
exports.dailyAnalytics = (0, scheduler_1.onSchedule)("0 3 * * *", async () => {
    const db = (0, firestore_1.getFirestore)();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startTs = today.getTime();
    // ---- ① 今日の新規ユーザー数 ----
    const usersSnap = await db
        .collection("users")
        .where("createdAt", ">=", startTs)
        .get();
    const newUsers = usersSnap.size;
    // ---- ② 今日の投稿数 ----
    const postsSnap = await db
        .collectionGroup("posts")
        .where("createdAt", ">=", startTs)
        .get();
    const newPosts = postsSnap.size;
    // ---- ③ 累計ユーザー数 ----
    const totalUsers = (await db.collection("users").get()).size;
    // ---- ④ 今日のアクティブユーザー（DAU） ----
    const dauSnap = await db
        .collection("activityLogs")
        .where("date", "==", today.toISOString().slice(0, 10))
        .get();
    const dau = dauSnap.size;
    // ---- 保存 ----
    await db
        .collection("analytics")
        .doc("daily")
        .collection("stats")
        .doc(today.toISOString().slice(0, 10))
        .set({
        newUsers,
        newPosts,
        totalUsers,
        dau,
        ts: Date.now(),
    });
    console.log("Daily analytics saved:", {
        date: today.toISOString().slice(0, 10),
        newUsers,
        newPosts,
        totalUsers,
        dau,
    });
    return;
});
//# sourceMappingURL=daily.js.map