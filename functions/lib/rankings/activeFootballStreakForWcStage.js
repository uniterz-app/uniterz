"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activeFootballStreakFromCumulative = activeFootballStreakFromCumulative;
exports.activeFootballStreakForWcStage = activeFootballStreakForWcStage;
function signedActiveWinStreak(raw) {
    return typeof raw === "number" && Number.isFinite(raw) && raw > 0 ? raw : 0;
}
/** cumulative_stats の WC 全体連勝（qualifying + main 合算） */
function activeFootballStreakFromCumulative(data) {
    var _a, _b, _c, _d;
    const signed = (_d = (_c = (_a = data.activeWinStreakFootball) !== null && _a !== void 0 ? _a : (_b = data.streakBySport) === null || _b === void 0 ? void 0 : _b.football) !== null && _c !== void 0 ? _c : data.streakFootball) !== null && _d !== void 0 ? _d : 0;
    return signedActiveWinStreak(signed);
}
/**
 * WC ランキングステージ別の現在連勝。
 * qualifying / main はステージ内のみ（グループ連勝をノックアウトタブに混ぜない）。
 */
function activeFootballStreakForWcStage(data, wcStage) {
    var _a, _b;
    if (wcStage === "overall") {
        return activeFootballStreakFromCumulative(data);
    }
    const block = (_a = data.rankingByWcStage) === null || _a === void 0 ? void 0 : _a[wcStage];
    if (block && typeof block.activeWinStreak === "number") {
        return signedActiveWinStreak(block.activeWinStreak);
    }
    const byStage = ((_b = data.activeWinStreakByWcStage) !== null && _b !== void 0 ? _b : {});
    const live = byStage[wcStage];
    if (typeof live === "number") {
        return signedActiveWinStreak(live);
    }
    return 0;
}
//# sourceMappingURL=activeFootballStreakForWcStage.js.map