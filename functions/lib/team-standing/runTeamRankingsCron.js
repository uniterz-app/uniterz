"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runTeamRankingsCronIfNbaGamesToday = runTeamRankingsCronIfNbaGamesToday;
const firestore_1 = require("firebase-admin/firestore");
const teamStandingsSeasonPhase_1 = require("../teamStandingsSeasonPhase");
const updateTeamRankings_1 = require("./updateTeamRankings");
/** Asia/Tokyo の「今日」0:00〜23:59:59.999 を Timestamp で返す */
function jstTodayStartEnd() {
    const ymd = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Tokyo",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).format(new Date());
    const start = firestore_1.Timestamp.fromDate(new Date(`${ymd}T00:00:00+09:00`));
    const end = firestore_1.Timestamp.fromDate(new Date(`${ymd}T23:59:59.999+09:00`));
    return { start, end };
}
/**
 * JST calendar day has at least one NBA game counted toward regular-season standings (seasonPhase not play_in / playoffs), run updateTeamRankings.
 * play_in / playoffs の試合だけの日はスキップ（onGameFinalV2 も RS の wins / regular stats は更新しない）。
 * Scheduled daily at 16:00 Asia/Tokyo.
 */
async function runTeamRankingsCronIfNbaGamesToday() {
    const db = (0, firestore_1.getFirestore)();
    const { start, end } = jstTodayStartEnd();
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