"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.predictionWin = predictionWin;
const judgeWin_1 = require("./judgeWin");
const footballTotalScore_1 = require("./footballTotalScore");
const settlementGame_1 = require("./settlementGame");
function predictionWin(prediction, game) {
    if ((0, settlementGame_1.leagueToSport)(game.league) === "football") {
        return (0, footballTotalScore_1.footballWinnerCorrect)(prediction, game);
    }
    return (0, judgeWin_1.judgeWin)(prediction, {
        home: game.homeScore,
        away: game.awayScore,
    });
}
//# sourceMappingURL=predictionWin.js.map