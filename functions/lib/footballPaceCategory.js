"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.footballPaceCategory = footballPaceCategory;
function footballPaceCategory(totalGoals) {
    if (totalGoals <= 2)
        return "low";
    if (totalGoals <= 4)
        return "mid";
    return "high";
}
//# sourceMappingURL=footballPaceCategory.js.map