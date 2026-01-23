"use strict";
// functions/src/stats/analysis/thresholds.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.LEVEL_THRESHOLD = void 0;
exports.toLevel = toLevel;
exports.toUpsetLevel = toUpsetLevel;
exports.LEVEL_THRESHOLD = {
    STRONG: 8, // 8–10
    MID: 4, // 4–7
    WEAK: 0, // 0–3
};
// 共通スコア（0–10）用
function toLevel(score10) {
    if (score10 >= exports.LEVEL_THRESHOLD.STRONG)
        return "S";
    if (score10 >= exports.LEVEL_THRESHOLD.MID)
        return "M";
    return "W";
}
// Upset（割合）専用
function toUpsetLevel(upsetRate) {
    // upsetRate: 0.0〜1.0（例: 0.42 = 42%）
    if (upsetRate >= 0.4)
        return "S";
    if (upsetRate <= 0.1)
        return "W";
    return "M";
}
//# sourceMappingURL=thresholds.js.map