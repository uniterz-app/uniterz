"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fixNbaDatesHttp = void 0;
const https_1 = require("firebase-functions/v2/https");
const firestore_1 = require("firebase-admin/firestore");
exports.fixNbaDatesHttp = (0, https_1.onRequest)(async (req, res) => {
    var _a;
    const db = (0, firestore_1.getFirestore)();
    const snap = await db.collection("games")
        .where("league", "==", "nba")
        .get();
    let count = 0;
    for (const doc of snap.docs) {
        const data = doc.data();
        if (!((_a = data.startAt) === null || _a === void 0 ? void 0 : _a.toDate))
            continue;
        const oldDate = data.startAt.toDate();
        // 🔥 ここが重要：1 日（24 時間）進める
        const newDate = new Date(oldDate.getTime() + 24 * 60 * 60 * 1000);
        await doc.ref.update({
            startAt: firestore_1.Timestamp.fromDate(newDate),
            startAtJst: firestore_1.Timestamp.fromDate(newDate),
            startAtJstIso: newDate.toISOString(),
        });
        count++;
    }
    res.json({ fixed: count });
});
//# sourceMappingURL=fixNbaDates.js.map