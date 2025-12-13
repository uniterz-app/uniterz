"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aggregateUsersTrend = aggregateUsersTrend;
// functions/src/trend/users.aggregate.ts
const firestore_1 = require("firebase-admin/firestore");
// ------------------------------
// ★ 連勝ランキングだけを作る
// ------------------------------
async function aggregateUsersTrend() {
    var _a, _b, _c, _d, _e, _f;
    const db = (0, firestore_1.getFirestore)(); // ← ★ ここで取得する
    const snap = await db.collection("users").get();
    const rows = [];
    for (const doc of snap.docs) {
        const d = doc.data();
        const statsSnap = await db
            .collection("user_stats_v2")
            .doc(doc.id)
            .get();
        if (!statsSnap.exists)
            continue;
        const stats = statsSnap.data();
        const streak = Number((_a = stats.currentStreak) !== null && _a !== void 0 ? _a : 0);
        if (streak < 5)
            continue;
        rows.push({
            uid: doc.id,
            displayName: (_b = d.displayName) !== null && _b !== void 0 ? _b : "",
            handle: (_c = d.handle) !== null && _c !== void 0 ? _c : "",
            photoURL: (_e = (_d = d.photoURL) !== null && _d !== void 0 ? _d : d.avatarUrl) !== null && _e !== void 0 ? _e : "",
            currentStreak: streak,
            maxStreak: Number((_f = stats.maxStreak) !== null && _f !== void 0 ? _f : 0),
        });
    }
    rows.sort((a, b) => b.currentStreak - a.currentStreak);
    const top = rows.slice(0, 10);
    await db.doc("trend_cache/users").set({
        updatedAt: firestore_1.Timestamp.now(),
        users: top,
    });
    return { ok: true, count: top.length };
}
//# sourceMappingURL=users.aggregate.js.map