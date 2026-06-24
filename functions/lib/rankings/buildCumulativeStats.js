"use strict";
// functions/src/rankings/buildCumulativeStats.ts
// 日次バッチ加算は廃止。cumulative_stats を user_stats_v2_daily の合計と照合・修復する。
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildCumulativeStats = buildCumulativeStats;
const firestore_1 = require("firebase-admin/firestore");
const cumulativeFromDaily_1 = require("./cumulativeFromDaily");
function db() {
    return (0, firestore_1.getFirestore)();
}
function toDateKeyJST(d) {
    const j = new Date(d.getTime() + 9 * 60 * 60 * 1000);
    const y = j.getUTCFullYear();
    const m = String(j.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(j.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${dd}`;
}
function getTodayJST() {
    return toDateKeyJST(new Date());
}
/**
 * 当日に日次が動いたユーザーの cumulative_stats を日次合計と照合する。
 * 確定時インクリメント（cumulativeLiveUpdates）との二重計上は、
 * 「加算」ではなく「日次から再計算して上書き」するため起きない。
 */
async function buildCumulativeStats() {
    const dateKey = getTodayJST();
    const firestore = db();
    const PAGE_SIZE = 500;
    const CONCURRENCY = 20;
    let updated = 0;
    let skipped = 0;
    let scanned = 0;
    const reconciledUids = new Set();
    let cursor;
    for (;;) {
        let q = firestore
            .collection("user_stats_v2_daily")
            .where("date", "==", dateKey)
            .orderBy(firestore_1.FieldPath.documentId())
            .limit(PAGE_SIZE);
        if (cursor)
            q = q.startAfter(cursor);
        const pageSnap = await q.get();
        if (pageSnap.empty)
            break;
        scanned += pageSnap.size;
        cursor = pageSnap.docs[pageSnap.docs.length - 1];
        const uids = [
            ...new Set(pageSnap.docs
                .map((d) => d.id.split("_")[0])
                .filter((uid) => !!uid)),
        ].filter((uid) => !reconciledUids.has(uid));
        for (const uid of uids) {
            reconciledUids.add(uid);
        }
        for (let i = 0; i < uids.length; i += CONCURRENCY) {
            const chunk = uids.slice(i, i + CONCURRENCY);
            const chunkResults = await Promise.all(chunk.map((uid) => (0, cumulativeFromDaily_1.reconcileCumulativeStatsForUid)(firestore, uid, dateKey)));
            chunkResults.forEach((r) => {
                if (r.updated)
                    updated++;
                else
                    skipped++;
            });
        }
    }
    return {
        date: dateKey,
        scanned,
        updated,
        skipped,
        reconciledUsers: reconciledUids.size,
        mode: "reconcile",
    };
}
//# sourceMappingURL=buildCumulativeStats.js.map