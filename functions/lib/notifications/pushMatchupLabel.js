"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatPushMatchupLabel = formatPushMatchupLabel;
exports.resolvePushTeamId = resolvePushTeamId;
const wcCountry_1 = require("../shared/wcCountry");
function resolvePushSideLabel(label, teamId, language) {
    if (teamId) {
        const localized = (0, wcCountry_1.teamIdToCountryName)(teamId, language);
        if (localized) {
            if (language === "en" && (0, wcCountry_1.teamIdToWcCountry)(teamId)) {
                return localized.toUpperCase();
            }
            return localized;
        }
    }
    const trimmed = label.trim() || "?";
    return language === "en" ? trimmed.toUpperCase() : trimmed;
}
function formatPushMatchupLabel(input, language) {
    const home = resolvePushSideLabel(input.homeLabel, input.homeTeamId, language);
    const away = resolvePushSideLabel(input.awayLabel, input.awayTeamId, language);
    if (typeof input.homeScore === "number" &&
        typeof input.awayScore === "number") {
        const score = `${input.homeScore}–${input.awayScore}`;
        return language === "ja"
            ? `${home} ${input.homeScore}-${input.awayScore} ${away}`
            : `${home} ${score} ${away}`;
    }
    if (language === "ja") {
        return `${home} 対 ${away}`;
    }
    return `${home} · ${away}`;
}
function resolvePushTeamId(side) {
    if (side && typeof side === "object") {
        const teamId = side.teamId;
        if (typeof teamId === "string" && teamId.trim())
            return teamId.trim();
    }
    return undefined;
}
//# sourceMappingURL=pushMatchupLabel.js.map