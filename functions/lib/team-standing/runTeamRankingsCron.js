"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runTeamRankingsCronIfNbaGamesToday = runTeamRankingsCronIfNbaGamesToday;
const firestore_1 = require("firebase-admin/firestore");
const teamStandingsSeasonPhase_1 = require("../teamStandingsSeasonPhase");
const jstCalendarDayFirestore_1 = require("../time/jstCalendarDayFirestore");
const updateTeamRankings_1 = require("./updateTeamRankings");
/**
 * Runs updateTeamRankings when this JST date has any NBA game that counts toward
 * regular-season standings (same rule as countsTowardRegularSeasonTeamStats: not play_in / playoffs).
 * Skips days with only play_in or playoff games. Cron: 16:00 Asia/Tokyo.
 */
async function runTeamRankingsCronIfNbaGamesToday() {
    const db = (0, firestore_1.getFirestore)();
    const { start, end } = (0, jstCalendarDayFirestore_1.jstCalendarDayStartEndTimestamps)();
    const snap = await db
        .collection("games")
        .where("league", "==", "nba")
        .where("startAtJst", ">=", start)
        .where("startAtJst", "<=", end)
        .get();
    const hasRegularStandingsGame = snap.docs.some((doc) => { var _a; return (0, teamStandingsSeasonPhase_1.countsTowardRegularSeasonTeamStats)((_a = doc.data()) === null || _a === void 0 ? void 0 : _a.seasonPhase); });
    if (!hasRegularStandingsGame) {
        console.log("[runTeamRankingsCronIfNbaGamesToday] skip: no regular-season NBA games on this JST date");
        return;
    }
    await (0, updateTeamRankings_1.updateTeamRankings)();
}
//# sourceMappingURL=runTeamRankingsCron.js.map