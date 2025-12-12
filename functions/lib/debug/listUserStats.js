"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listUserStatsIds = void 0;
const https_1 = require("firebase-functions/v2/https");
const firestore_1 = require("firebase-admin/firestore");
exports.listUserStatsIds = (0, https_1.onRequest)(async (req, res) => {
    const db = (0, firestore_1.getFirestore)();
    const snap = await db.collection("user_stats_v2").select().get();
    const ids = snap.docs.map((d) => d.id);
    res.json({ count: ids.length, ids });
});
//# sourceMappingURL=listUserStats.js.map