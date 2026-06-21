"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildPushNotificationCopy = buildPushNotificationCopy;
exports.normalizePushLanguage = normalizePushLanguage;
exports.resolveTeamLabel = resolveTeamLabel;
exports.resolveGameMatchupCopy = resolveGameMatchupCopy;
const pushMatchupLabel_1 = require("./pushMatchupLabel");
function buildPushNotificationCopy(type, language, input) {
    const matchup = input ? (0, pushMatchupLabel_1.formatPushMatchupLabel)(input, language) : "";
    if (language === "en") {
        switch (type) {
            case "game_start":
                return {
                    title: "Kickoff soon",
                    subtitle: "Your predicted match starts soon.",
                    body: matchup || "Check the match in the app.",
                };
            case "game_final":
                return {
                    title: "Final score",
                    subtitle: "Result confirmed.",
                    body: matchup || "See your result in the app.",
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
                subtitle: "あなたの予想試合がまもなく開始します。",
                body: matchup || "アプリで試合を確認してください。",
            };
        case "game_final":
            return {
                title: "試合結果確定",
                subtitle: "結果が確定しました。",
                body: matchup || "アプリで結果を確認してください。",
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
        homeTeamId: (0, pushMatchupLabel_1.resolvePushTeamId)(gameData === null || gameData === void 0 ? void 0 : gameData.home),
        awayTeamId: (0, pushMatchupLabel_1.resolvePushTeamId)(gameData === null || gameData === void 0 ? void 0 : gameData.away),
        homeScore: scores === null || scores === void 0 ? void 0 : scores.home,
        awayScore: scores === null || scores === void 0 ? void 0 : scores.away,
    };
}
//# sourceMappingURL=pushNotificationCopy.js.map