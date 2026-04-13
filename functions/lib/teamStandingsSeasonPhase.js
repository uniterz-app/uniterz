"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.countsTowardRegularSeasonTeamStats = countsTowardRegularSeasonTeamStats;
exports.countsTowardPlayoffTeamStats = countsTowardPlayoffTeamStats;
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
//# sourceMappingURL=teamStandingsSeasonPhase.js.map