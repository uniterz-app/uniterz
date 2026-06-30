"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.countsTowardRegularSeasonTeamStats = countsTowardRegularSeasonTeamStats;
exports.countsTowardPlayoffTeamStats = countsTowardPlayoffTeamStats;
exports.isExemptFromTeamSeasonRecord = isExemptFromTeamSeasonRecord;
/**
 * Regular season aggregates: root `wins` / `losses` / `draws` and NBA flat stats.
 */
function countsTowardRegularSeasonTeamStats(phase) {
    if (phase === "play_in" || phase === "playoffs")
        return false;
    return true;
}
/**
 * Playoff aggregates: `playoff.{wins,losses,draws}` and NBA `playoffNba.*`.
 */
function countsTowardPlayoffTeamStats(phase) {
    return phase === "playoffs";
}
/**
 * WC ノックアウトなど、teams の通算 wins / losses / draws に含めない試合。
 */
function isExemptFromTeamSeasonRecord(knockout) {
    return knockout === true;
}
//# sourceMappingURL=teamStandingsSeasonPhase.js.map