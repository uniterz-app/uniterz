"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aggregateUsersTrend = aggregateUsersTrend;
// functions/src/trend/users.aggregate.ts
const firestore_1 = require("firebase-admin/firestore");
const app_1 = require("firebase-admin/app");
if (!(0, app_1.getApps)().length)
    (0, app_1.initializeApp)();
const db = (0, firestore_1.getFirestore)();
// ------------------------------
// ★ 連勝ランキングだけを作る
// ------------------------------
async function aggregateUsersTrend() {
    // users 全件取得
    const snap = await db.collection("users").get();
    const rows = [];
    snap.forEach((doc) => {
        var _a, _b, _c, _d, _e, _f;
        const d = doc.data();
        const streak = Number((_a = d.currentStreak) !== null && _a !== void 0 ? _a : 0);
        if (streak < 5)
            return; // ★ 5連勝未満は除外
        rows.push({
            uid: doc.id,
            displayName: (_b = d.displayName) !== null && _b !== void 0 ? _b : "",
            handle: (_c = d.handle) !== null && _c !== void 0 ? _c : "",
            photoURL: (_e = (_d = d.photoURL) !== null && _d !== void 0 ? _d : d.avatarUrl) !== null && _e !== void 0 ? _e : "",
            currentStreak: streak,
            maxStreak: Number((_f = d.maxStreak) !== null && _f !== void 0 ? _f : 0),
        });
    });
    // ★ 連勝順でソート
    rows.sort((a, b) => b.currentStreak - a.currentStreak);
    // ★ 上位10人を保存
    const top = rows.slice(0, 10);
    await db.doc("trend_cache/users").set({
        updatedAt: firestore_1.Timestamp.now(),
        users: top,
    });
    return { ok: true, count: top.length };
}
//# sourceMappingURL=users.aggregate.js.map