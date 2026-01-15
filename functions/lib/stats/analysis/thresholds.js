"use strict";
// functions/src/stats/analysis/thresholds.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.LEVEL_THRESHOLD = void 0;
exports.toLevel = toLevel;
exports.LEVEL_THRESHOLD = {
    STRONG: 8, // 8–10
    MID: 4, // 4–7
    WEAK: 0, // 0–3
};
function toLevel(score10) {
    if (score10 >= exports.LEVEL_THRESHOLD.STRONG)
        return "S";
    if (score10 >= exports.LEVEL_THRESHOLD.MID)
        return "M";
    return "W";
}
//# sourceMappingURL=thresholds.js.map