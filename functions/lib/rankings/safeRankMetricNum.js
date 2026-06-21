"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.safeRankMetricNum = safeRankMetricNum;
/** ランキング指標 — NaN / 非数値を 0 に正規化（sort 破壊防止） */
function safeRankMetricNum(v) {
    const n = typeof v === "number" ? v : Number(v);
    return Number.isFinite(n) ? n : 0;
}
//# sourceMappingURL=safeRankMetricNum.js.map