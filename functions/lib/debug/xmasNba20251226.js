"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.xmasNba20251226 = void 0;
// functions/src/debug/xmasNba20251226.ts
const https_1 = require("firebase-functions/v2/https");
const firestore_1 = require("firebase-admin/firestore");
const db = (0, firestore_1.getFirestore)();
exports.xmasNba20251226 = (0, https_1.onRequest)({ region: "asia-northeast1" }, async (_req, res) => {
    var _a;
    const date = "2025-12-26";
    const snap = await db
        .collection("user_stats_v2_daily")
        .where("date", "==", date)
        .get();
    const qualified = [];
    for (const doc of snap.docs) {
        const data = doc.data();
        const nba = (_a = data.leagues) === null || _a === void 0 ? void 0 : _a.nba;
        if (!nba)
            continue;
        if (nba.posts === 5 && nba.wins >= 4) {
            qualified.push({
                uid: doc.id.split("_")[0],
                wins: nba.wins,
            });
        }
    }
    console.log("XMAS NBA 2025 qualified users:", qualified);
    res.json({
        date,
        count: qualified.length,
        users: qualified,
    });
});
//# sourceMappingURL=xmasNba20251226.js.map