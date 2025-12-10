"use strict";
// functions/src/calcCalibration.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.calcCalibrationError = calcCalibrationError;
exports.toConsistencyPercent = toConsistencyPercent;
const BINS = [
    { min: 0.50, max: 0.59 },
    { min: 0.60, max: 0.69 },
    { min: 0.70, max: 0.79 },
    { min: 0.80, max: 0.89 },
    { min: 0.90, max: 1.00 },
];
function calcCalibrationError(items) {
    let totalWeightedError = 0;
    let totalCount = 0;
    for (const bin of BINS) {
        const grouped = items.filter(i => i.prob >= bin.min && i.prob <= bin.max);
        if (grouped.length === 0)
            continue;
        const avgProb = grouped.reduce((a, b) => a + b.prob, 0) / grouped.length;
        const winRate = grouped.reduce((a, b) => a + b.result, 0) / grouped.length;
        const error = Math.abs(avgProb - winRate);
        totalWeightedError += error * grouped.length;
        totalCount += grouped.length;
    }
    // 対象ゼロ（評価不能）
    if (totalCount === 0)
        return null;
    return totalWeightedError / totalCount;
}
/**
 * UI 用：一致度（%）
 */
function toConsistencyPercent(calibrationError) {
    if (calibrationError == null)
        return null;
    return Math.max(0, Math.min(100, Math.round((1 - calibrationError) * 100)));
}
//# sourceMappingURL=calcCalibration.js.map