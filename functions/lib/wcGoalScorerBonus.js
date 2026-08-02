"use strict";
/** WC ゴール得点者ボーナス — NBA-only 運用では常に 0（league=wc の新規精算なし） */
Object.defineProperty(exports, "__esModule", { value: true });
exports.WC_GOAL_SCORER_BONUS_POINTS = void 0;
exports.calcWcGoalScorerBonus = calcWcGoalScorerBonus;
exports.WC_GOAL_SCORER_BONUS_POINTS = 2;
function calcWcGoalScorerBonus(league, _prediction, _goalScorers, _ctx) {
    if (String(league !== null && league !== void 0 ? league : "").toLowerCase() !== "wc")
        return 0;
    return 0;
}
//# sourceMappingURL=wcGoalScorerBonus.js.map