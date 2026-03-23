"use strict";
// functions/src/leaderboards/getMonthlyLeaderboard.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMonthlyLeaderboard = void 0;
const https_1 = require("firebase-functions/v2/https");
const firestore_1 = require("firebase-admin/firestore");
function db() {
    return (0, firestore_1.getFirestore)();
}
function isMetric(v) {
    return (v === "winRate" ||
        v === "totalPoints" ||
        v === "totalPrecision" ||
        v === "totalUpset");
}
exports.getMonthlyLeaderboard = (0, https_1.onRequest)(async (req, res) => {
    var _a, _b;
    try {
        const rawLeague = req.query.league;
        const rawMonth = req.query.month;
        const rawMetric = req.query.metric;
        const league = typeof rawLeague === "string" && rawLeague.trim()
            ? rawLeague.trim()
            : "nba";
        const month = typeof rawMonth === "string" && /^\d{4}-\d{2}$/.test(rawMonth)
            ? rawMonth
            : null;
        const metric = isMetric(rawMetric) ? rawMetric : "totalPoints";
        if (!month) {
            res.status(400).json({
                ok: false,
                error: "month is required (YYYY-MM)",
            });
            return;
        }
        const docId = `${league}_${month}_${metric}`;
        const snap = await db()
            .collection("monthly_leaderboard_snapshots")
            .doc(docId)
            .get();
        if (!snap.exists) {
            res.status(404).json({
                ok: false,
                error: "monthly leaderboard snapshot not found",
                league,
                month,
                metric,
            });
            return;
        }
        const data = (_a = snap.data()) !== null && _a !== void 0 ? _a : {};
        const rows = Array.isArray(data.rows)
            ? data.rows
            : [];
        res.status(200).json({
            ok: true,
            league,
            month,
            metric,
            count: rows.length,
            rows,
        });
        return;
    }
    catch (e) {
        res.status(500).json({
            ok: false,
            error: (_b = e === null || e === void 0 ? void 0 : e.message) !== null && _b !== void 0 ? _b : "unknown error",
        });
        return;
    }
});
//# sourceMappingURL=getMonthlyLeaderboard.js.map