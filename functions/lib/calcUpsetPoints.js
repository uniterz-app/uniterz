"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calcUpsetPoints = calcUpsetPoints;
function calcUpsetPoints(majorityRatio, options) {
    var _a, _b, _c;
    const startRatio = (_a = options === null || options === void 0 ? void 0 : options.startRatio) !== null && _a !== void 0 ? _a : 0.55;
    const maxRatio = (_b = options === null || options === void 0 ? void 0 : options.maxRatio) !== null && _b !== void 0 ? _b : 0.9;
    const maxPoints = (_c = options === null || options === void 0 ? void 0 : options.maxPoints) !== null && _c !== void 0 ? _c : 10;
    if (!Number.isFinite(majorityRatio))
        return 0;
    const ratio = Math.min(1, Math.max(0, majorityRatio));
    if (ratio < startRatio)
        return 0;
    if (ratio >= maxRatio)
        return maxPoints;
    const normalized = (ratio - startRatio) / (maxRatio - startRatio);
    return Math.round(normalized * maxPoints);
}
//# sourceMappingURL=calcUpsetPoints.js.map