"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildPushNotificationCopy = buildPushNotificationCopy;
exports.normalizePushLanguage = normalizePushLanguage;
exports.resolveTeamLabel = resolveTeamLabel;
exports.resolveGameMatchupCopy = resolveGameMatchupCopy;
function matchupLabel(input) {
    const home = input.homeLabel.trim() || "?";
    const away = input.awayLabel.trim() || "?";
    if (typeof input.homeScore === "number" &&
        typeof input.awayScore === "number") {
        return `${home} ${input.homeScore}-${input.awayScore} ${away}`;
    }
    return `${home} vs ${away}`;
}
function buildPushNotificationCopy(type, language, input) {
    const matchup = input ? matchupLabel(input) : "";
    if (language === "en") {
        switch (type) {
            case "game_start":
                return {
                    title: "Kickoff soon",
                    body: matchup
                        ? `Your predicted match starts soon: ${matchup}`
                        : "Your predicted match starts soon.",
                };
            case "game_final":
                return {
                    title: "Final score",
                    body: matchup
                        ? `Result confirmed: ${matchup}`
                        : "Your predicted match result is confirmed.",
                };
            case "ranking_updated":
                return {
                    title: "Rankings updated",
                    body: "Today's cumulative rankings have been updated.",
                };
        }
    }
    switch (type) {
        case "game_start":
            return {
                title: "まもなくキックオフ",
                body: matchup
                    ? `あなたの予想試合がまもなく開始します: ${matchup}`
                    : "あなたの予想試合がまもなく開始します。",
            };
        case "game_final":
            return {
                title: "試合結果確定",
                body: matchup
                    ? `結果が確定しました: ${matchup}`
                    : "予想した試合の結果が確定しました。",
            };
        case "ranking_updated":
            return {
                title: "ランキング更新",
                body: "本日の累積ランキングが更新されました。",
            };
    }
}
function normalizePushLanguage(raw) {
    return raw === "en" ? "en" : "ja";
}
function resolveTeamLabel(side) {
    if (typeof side === "string")
        return side.trim();
    if (side && typeof side === "object") {
        const name = side.name;
        if (typeof name === "string" && name.trim())
            return name.trim();
        const teamId = side.teamId;
        if (typeof teamId === "string" && teamId.trim())
            return teamId.trim();
    }
    return "?";
}
function resolveGameMatchupCopy(gameData, scores) {
    return {
        homeLabel: resolveTeamLabel(gameData === null || gameData === void 0 ? void 0 : gameData.home),
        awayLabel: resolveTeamLabel(gameData === null || gameData === void 0 ? void 0 : gameData.away),
        homeScore: scores === null || scores === void 0 ? void 0 : scores.home,
        awayScore: scores === null || scores === void 0 ? void 0 : scores.away,
    };
}
//# sourceMappingURL=pushNotificationCopy.js.map