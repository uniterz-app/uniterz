"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.judgeWin = judgeWin;
// functions/src/judgeWin.ts
function judgeWin(pred, result) {
    if (pred.winner === "draw") {
        return result.home === result.away;
    }
    return pred.winner === "home"
        ? result.home > result.away
        : result.away > result.home;
}
//# sourceMappingURL=judgeWin.js.map