"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aggregateHitPostsTodayNBA = aggregateHitPostsTodayNBA;
const firestore_1 = require("firebase-admin/firestore");
/**
 * 今日（JST）の NBA 結果確定投稿を
 * scoreError（スコア誤差）が小さい順で TOP10 集計
 */
async function aggregateHitPostsTodayNBA() {
    console.log("[aggregateHitPostsTodayNBA] start");
    const db = (0, firestore_1.getFirestore)();
    /* =========================
     * JST 今日の 0:00〜24:00
     * ========================= */
    const jstNow = new Date(Date.now() + 9 * 60 * 60 * 1000);
    const startJst = new Date(jstNow);
    startJst.setHours(0, 0, 0, 0);
    const endJst = new Date(startJst);
    endJst.setDate(startJst.getDate() + 1);
    const startTs = firestore_1.Timestamp.fromDate(startJst);
    const endTs = firestore_1.Timestamp.fromDate(endJst);
    /* =========================
     * Firestore Query
     * ========================= */
    const snap = await db
        .collection("posts")
        .where("league", "==", "nba") // ← 小文字で統一
        .where("schemaVersion", "==", 2)
        .where("status", "==", "final")
        .where("settledAt", ">=", startTs)
        .where("settledAt", "<", endTs)
        .get();
    if (snap.empty) {
        await db.doc("trend_cache/hit_posts_today").set({
            updatedAt: firestore_1.Timestamp.now(),
            league: "nba",
            window: "today",
            posts: [],
        });
        console.log("[aggregateHitPostsTodayNBA] no posts");
        return { ok: true, count: 0 };
    }
    /* =========================
     * 集計・ソート
     * ========================= */
    const posts = snap.docs
        .map((d) => {
        var _a, _b, _c;
        const v = d.data();
        return {
            id: d.id,
            authorUid: v.authorUid,
            authorHandle: (_a = v.authorHandle) !== null && _a !== void 0 ? _a : null,
            author: {
                name: (_b = v.authorDisplayName) !== null && _b !== void 0 ? _b : "ユーザー",
                avatarUrl: (_c = v.authorPhotoURL) !== null && _c !== void 0 ? _c : "",
            },
            gameId: v.gameId,
            league: "nba",
            prediction: v.prediction,
            stats: v.stats,
            settledAt: v.settledAt,
            createdAt: v.createdAt,
        };
    })
        .filter((p) => { var _a; return typeof ((_a = p.stats) === null || _a === void 0 ? void 0 : _a.scoreError) === "number"; })
        .sort((a, b) => a.stats.scoreError -
        b.stats.scoreError)
        .slice(0, 10);
    /* =========================
     * キャッシュ保存
     * ========================= */
    await db.doc("trend_cache/hit_posts_today").set({
        updatedAt: firestore_1.Timestamp.now(),
        league: "nba", // ← 統一
        window: "today",
        posts,
    });
    console.log("[aggregateHitPostsTodayNBA] done:", posts.length);
    return { ok: true, count: posts.length };
}
//# sourceMappingURL=hitPosts.aggregate.js.map