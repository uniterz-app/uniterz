"use strict";
// functions/src/playoff/getPlayoffRanking.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPlayoffRanking = void 0;
const https_1 = require("firebase-functions/v2/https");
const firestore_1 = require("firebase-admin/firestore");
/* =========================================================
 * Firestore
 * =======================================================*/
function db() {
    return (0, firestore_1.getFirestore)();
}
function getValue(d, metric) {
    var _a, _b, _c, _d;
    if (metric === "totalPoints")
        return (_a = d.totalPoints) !== null && _a !== void 0 ? _a : 0;
    if (metric === "totalPrecision")
        return (_b = d.totalPrecision) !== null && _b !== void 0 ? _b : 0;
    if (metric === "totalUpset")
        return (_c = d.totalUpset) !== null && _c !== void 0 ? _c : 0;
    return (_d = d.activeWinStreak) !== null && _d !== void 0 ? _d : 0;
}
exports.getPlayoffRanking = (0, https_1.onRequest)(async (req, res) => {
    var _a;
    try {
        const metric = (_a = req.query.metric) !== null && _a !== void 0 ? _a : "totalPoints";
        const snap = await db()
            .collection("playoff_stats")
            .get();
        const rows = snap.docs.map((doc) => {
            var _a, _b, _c, _d, _e, _f, _g;
            const d = doc.data();
            return {
                uid: doc.id,
                displayName: (_a = d.displayName) !== null && _a !== void 0 ? _a : "user",
                handle: (_b = d.handle) !== null && _b !== void 0 ? _b : null,
                photoURL: (_c = d.photoURL) !== null && _c !== void 0 ? _c : null,
                totalPoints: (_d = d.totalPoints) !== null && _d !== void 0 ? _d : 0,
                totalPrecision: (_e = d.totalPrecision) !== null && _e !== void 0 ? _e : 0,
                totalUpset: (_f = d.totalUpset) !== null && _f !== void 0 ? _f : 0,
                activeWinStreak: (_g = d.activeWinStreak) !== null && _g !== void 0 ? _g : 0,
            };
        });
        const sorted = rows.sort((a, b) => {
            var _a, _b;
            const diff = getValue(b, metric) - getValue(a, metric);
            if (diff !== 0)
                return diff;
            return ((_a = b.totalPoints) !== null && _a !== void 0 ? _a : 0) - ((_b = a.totalPoints) !== null && _b !== void 0 ? _b : 0);
        });
        const ranked = sorted.map((r, i) => (Object.assign(Object.assign({}, r), { rank: i + 1 })));
        res.status(200).json({
            ok: true,
            metric,
            count: ranked.length,
            rows: ranked,
        });
    }
    catch (e) {
        res.status(500).json({
            ok: false,
            error: e.message,
        });
    }
});
//# sourceMappingURL=getPlayoffRanking.js.map