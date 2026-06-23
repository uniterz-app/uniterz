"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.jstDateKeyToUtcRange = jstDateKeyToUtcRange;
exports.loadUidsWhoPredictedOnDateJst = loadUidsWhoPredictedOnDateJst;
const firestore_1 = require("firebase-admin/firestore");
const PAGE_SIZE = 500;
/** JST の dateKey（YYYY-MM-DD）00:00〜翌日 00:00 を UTC の Date 範囲に変換 */
function jstDateKeyToUtcRange(dateKey) {
    const [y, m, d] = dateKey.split("-").map(Number);
    const start = new Date(Date.UTC(y, m - 1, d) - 9 * 60 * 60 * 1000);
    const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
    return { start, end };
}
/** 指定 JST 日に v2 予想投稿したユーザーの UID 一覧（重複なし） */
async function loadUidsWhoPredictedOnDateJst(dateKey) {
    const firestore = (0, firestore_1.getFirestore)();
    const { start, end } = jstDateKeyToUtcRange(dateKey);
    const startTs = firestore_1.Timestamp.fromDate(start);
    const endTs = firestore_1.Timestamp.fromDate(end);
    const uids = new Set();
    let cursor;
    for (;;) {
        let q = firestore
            .collection("posts")
            .where("createdAt", ">=", startTs)
            .where("createdAt", "<", endTs)
            .orderBy("createdAt", "asc")
            .limit(PAGE_SIZE);
        if (cursor)
            q = q.startAfter(cursor);
        const snap = await q.get();
        if (snap.empty)
            break;
        for (const doc of snap.docs) {
            const data = doc.data();
            if ((data === null || data === void 0 ? void 0 : data.schemaVersion) !== 2)
                continue;
            const uid = data === null || data === void 0 ? void 0 : data.authorUid;
            if (typeof uid === "string" && uid.trim())
                uids.add(uid.trim());
        }
        cursor = snap.docs[snap.docs.length - 1];
        if (snap.size < PAGE_SIZE)
            break;
    }
    return [...uids];
}
//# sourceMappingURL=loadUidsWhoPredictedOnDateJst.js.map