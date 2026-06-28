"use strict";
/**
 * Keep in sync with lib/wc/wc-knockout-bracket.ts (feedsFrom / rounds).
 */
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WC_KNOCKOUT_CHILD_MATCHES = void 0;
exports.getWcKnockoutChildMatches = getWcKnockoutChildMatches;
exports.getWcKnockoutChildMatchDef = getWcKnockoutChildMatchDef;
exports.wcKnockoutRoundLabel = wcKnockoutRoundLabel;
exports.wcKnockoutGameId = wcKnockoutGameId;
exports.parseWcKnockoutMatchIdFromGameId = parseWcKnockoutMatchIdFromGameId;
const wcKnockoutMatchIds_1 = require("./wcKnockoutMatchIds");
/** R16 以降（R32 は Phase 1 seed）。M103 は 3 位決定戦。 */
exports.WC_KNOCKOUT_CHILD_MATCHES = [
    { id: "M89", round: "R16", feedsFrom: ["M74", "M77"] },
    { id: "M90", round: "R16", feedsFrom: ["M73", "M75"] },
    { id: "M91", round: "R16", feedsFrom: ["M76", "M78"] },
    { id: "M92", round: "R16", feedsFrom: ["M79", "M80"] },
    { id: "M93", round: "R16", feedsFrom: ["M83", "M84"] },
    { id: "M94", round: "R16", feedsFrom: ["M81", "M82"] },
    { id: "M95", round: "R16", feedsFrom: ["M86", "M88"] },
    { id: "M96", round: "R16", feedsFrom: ["M85", "M87"] },
    { id: "M97", round: "QF", feedsFrom: ["M89", "M90"] },
    { id: "M98", round: "QF", feedsFrom: ["M93", "M94"] },
    { id: "M99", round: "QF", feedsFrom: ["M91", "M92"] },
    { id: "M100", round: "QF", feedsFrom: ["M95", "M96"] },
    { id: "M101", round: "SF", feedsFrom: ["M97", "M98"] },
    { id: "M102", round: "SF", feedsFrom: ["M99", "M100"] },
    {
        id: "M103",
        round: "THIRD",
        feedsFrom: ["M101", "M102"],
        useRunnerUpFeeders: true,
    },
    { id: "M104", round: "FINAL", feedsFrom: ["M101", "M102"] },
];
const MATCH_BY_ID = new Map(exports.WC_KNOCKOUT_CHILD_MATCHES.map((m) => [m.id, m]));
const CHILDREN_BY_PARENT = new Map();
for (const m of exports.WC_KNOCKOUT_CHILD_MATCHES) {
    for (const parent of m.feedsFrom) {
        const list = (_a = CHILDREN_BY_PARENT.get(parent)) !== null && _a !== void 0 ? _a : [];
        list.push(m.id);
        CHILDREN_BY_PARENT.set(parent, list);
    }
}
function getWcKnockoutChildMatches(parentId) {
    var _a;
    return [...((_a = CHILDREN_BY_PARENT.get(parentId)) !== null && _a !== void 0 ? _a : [])];
}
function getWcKnockoutChildMatchDef(id) {
    return MATCH_BY_ID.get(id);
}
function wcKnockoutRoundLabel(round) {
    switch (round) {
        case "R16":
            return "Round of 16";
        case "QF":
            return "Quarter-final";
        case "SF":
            return "Semi-final";
        case "FINAL":
            return "Final";
        case "THIRD":
            return "Third Place";
        default:
            return round;
    }
}
function wcKnockoutGameId(matchId, tournamentYear = 2026) {
    return `wc-${tournamentYear}-ko-${matchId}`;
}
function parseWcKnockoutMatchIdFromGameId(gameId) {
    const m = gameId.match(/(?:^|[-_])ko[-_](M\d{2,3})$/i);
    if (!m)
        return null;
    const id = m[1].toUpperCase();
    if (id === "M103")
        return "M103";
    if ((0, wcKnockoutMatchIds_1.isWcBracketPredictMatchId)(id))
        return id;
    return null;
}
//# sourceMappingURL=wcKnockoutBracketStructure.js.map