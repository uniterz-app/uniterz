"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadUidsWhoPredictedOnDateFromDaily = loadUidsWhoPredictedOnDateFromDaily;
const firestore_1 = require("firebase-admin/firestore");
const PAGE_SIZE = 500;
function safePosts(v) {
    const n = typeof v === "number" ? v : Number(v);
    return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
}
/**
 * JST 日付に v2 予想が 1 件以上ある uid（user_stats_v2_daily から）。
 * posts 全件スキャンより reads が少ない。
 */
async function loadUidsWhoPredictedOnDateFromDaily(dateKey) {
    var _a, _b, _c, _d;
    const firestore = (0, firestore_1.getFirestore)();
    const uids = new Set();
    let cursor;
    for (;;) {
        let q = firestore
            .collection("user_stats_v2_daily")
            .where("date", "==", dateKey)
            .orderBy(firestore_1.FieldPath.documentId())
            .limit(PAGE_SIZE);
        if (cursor)
            q = q.startAfter(cursor);
        const snap = await q.get();
        if (snap.empty)
            break;
        for (const doc of snap.docs) {
            const data = doc.data();
            const posts = safePosts((_b = (_a = data.all) === null || _a === void 0 ? void 0 : _a.posts) !== null && _b !== void 0 ? _b : (_c = data.ranking) === null || _c === void 0 ? void 0 : _c.posts);
            if (posts <= 0)
                continue;
            const uid = (_d = doc.id.split("_")[0]) === null || _d === void 0 ? void 0 : _d.trim();
            if (uid)
                uids.add(uid);
        }
        cursor = snap.docs[snap.docs.length - 1];
        if (snap.size < PAGE_SIZE)
            break;
    }
    return [...uids];
}
//# sourceMappingURL=loadUidsWhoPredictedOnDateFromDaily.js.map