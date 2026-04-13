"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NBA_STANDINGS_SEASON_TIEBREAK_PAIRS = void 0;
exports.compareNbaStandingsSeasonTiebreak = compareNbaStandingsSeasonTiebreak;
/**
 * NBA レギュラーシーズン順位の「今季だけ」の同率タイブレーク。
 * クライアントと同じペアを lib/nba/nbaStandingsSeasonTiebreak.ts に保つこと。
 *
 * 各要素は [同率時に上位の teamId, 下位側 teamId]。
 */
exports.NBA_STANDINGS_SEASON_TIEBREAK_PAIRS = [
    ["nba-raptors", "nba-hawks"],
    ["nba-76ers", "nba-magic"],
    ["nba-blazers", "nba-clippers"],
];
/** @returns negative if a should rank above b, positive if b above a, 0 if no rule */
function compareNbaStandingsSeasonTiebreak(aId, bId) {
    for (const [winner, loser] of exports.NBA_STANDINGS_SEASON_TIEBREAK_PAIRS) {
        if (winner === aId && loser === bId)
            return -1;
        if (winner === bId && loser === aId)
            return 1;
    }
    return 0;
}
//# sourceMappingURL=nbaStandingsSeasonTiebreak.js.map