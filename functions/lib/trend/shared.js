"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.nowJST = nowJST;
exports.hoursSince = hoursSince;
exports.decayFactor = decayFactor;
exports.tsHoursAgo = tsHoursAgo;
// functions/src/trend/shared.ts
const firestore_1 = require("firebase-admin/firestore");
/** JST（Asia/Tokyo）で「今」を返す。 */
function nowJST() {
    const nowUtc = new Date();
    return new Date(nowUtc.getTime() + 9 * 60 * 60 * 1000);
}
/** 与えた時刻との差（時間）を返す（基準は「今（UTC）」） */
function hoursSince(ts) {
    const base = ts instanceof Date ? ts : ts.toDate();
    const diffMs = Date.now() - base.getTime();
    return diffMs / (1000 * 60 * 60);
}
/**
 * 減衰係数:
 *  0h→1.0, 24h→0.7, 48h→0.5, 72h→0.3（線形補間）
 */
function decayFactor(hours) {
    if (hours <= 0)
        return 1.0;
    if (hours <= 24)
        return 1.0 + (0.7 - 1.0) * (hours / 24);
    if (hours <= 48)
        return 0.7 + (0.5 - 0.7) * ((hours - 24) / 24);
    if (hours <= 72)
        return 0.5 + (0.3 - 0.5) * ((hours - 48) / 24);
    return 0.3;
}
/** 「いまから過去N時間」の Timestamp（下限） */
function tsHoursAgo(hours) {
    const ms = Date.now() - hours * 60 * 60 * 1000;
    return firestore_1.Timestamp.fromDate(new Date(ms));
}
//# sourceMappingURL=shared.js.map