"use strict";
/** WC ゴール得点者ボーナス（functions 側。lib/wc/goalScorer.ts と同ロジック） */
Object.defineProperty(exports, "__esModule", { value: true });
exports.WC_GOAL_SCORER_BONUS_POINTS = void 0;
exports.calcWcGoalScorerBonus = calcWcGoalScorerBonus;
const goalScorerResolve_1 = require("./wc/goalScorerResolve");
exports.WC_GOAL_SCORER_BONUS_POINTS = 2;
function normalizePick(raw) {
    var _a, _b;
    if (!raw || typeof raw !== "object")
        return null;
    const playerId = String((_a = raw.playerId) !== null && _a !== void 0 ? _a : "").trim();
    const teamId = String((_b = raw.teamId) !== null && _b !== void 0 ? _b : "").trim();
    if (!playerId || !teamId)
        return null;
    return { playerId, teamId };
}
function calcWcGoalScorerBonus(league, prediction, goalScorers, ctx) {
    if (String(league !== null && league !== void 0 ? league : "").toLowerCase() !== "wc")
        return 0;
    const pick = normalizePick(prediction === null || prediction === void 0 ? void 0 : prediction.goalScorer);
    if (!pick)
        return 0;
    const list = (0, goalScorerResolve_1.resolveWcGameGoalScorers)(goalScorers, ctx !== null && ctx !== void 0 ? ctx : {});
    const hit = list.some((g) => !g.ownGoal &&
        g.playerId === pick.playerId &&
        g.teamId === pick.teamId);
    return hit ? exports.WC_GOAL_SCORER_BONUS_POINTS : 0;
}
//# sourceMappingURL=wcGoalScorerBonus.js.map