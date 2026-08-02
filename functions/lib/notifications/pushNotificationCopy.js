"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildPushNotificationCopy = buildPushNotificationCopy;
exports.normalizePushLanguage = normalizePushLanguage;
exports.resolveTeamLabel = resolveTeamLabel;
exports.resolveGameMatchupCopy = resolveGameMatchupCopy;
const pushMatchupLabel_1 = require("./pushMatchupLabel");
function buildPushNotificationCopy(type, language, input) {
    var _a;
    const matchup = input ? (0, pushMatchupLabel_1.formatPushMatchupLabel)(input, language) : "";
    const detail = ((_a = input === null || input === void 0 ? void 0 : input.detail) === null || _a === void 0 ? void 0 : _a.trim()) || "";
    if (language === "en") {
        switch (type) {
            case "game_start":
                return {
                    title: "Your predicted match starts soon.",
                    body: matchup || "Check the match in the app.",
                };
            case "game_final":
                return {
                    title: "Result confirmed.",
                    body: matchup || "See your result in the app.",
                };
            case "ranking_updated":
                return {
                    title: "Rankings updated",
                    body: "Today's cumulative rankings have been updated.",
                };
            case "injury_status":
                return {
                    title: "Player availability updated",
                    body: detail ||
                        (matchup
                            ? `${matchup} — review your prediction.`
                            : "A key player's status changed. Review your prediction."),
                };
            case "starter_change":
                return {
                    title: "Important lineup change",
                    body: detail ||
                        (matchup
                            ? `${matchup} — check the starting lineup.`
                            : "A high-impact starter change. Review your prediction."),
                };
            case "prediction_deadline":
                return {
                    title: "Prediction deadline soon",
                    body: matchup ||
                        "You haven't predicted this match yet. Submit before tip-off.",
                };
            case "pregame_digest":
                return {
                    title: "Pregame updates",
                    body: detail ||
                        (matchup
                            ? `${matchup} — several updates. Re-check your prediction.`
                            : "Several pregame updates. Re-check your prediction."),
                };
            case "pro_insight_update":
                return {
                    title: "PRO INSIGHT updated",
                    body: detail ||
                        (matchup
                            ? `${matchup} — the conclusion changed.`
                            : "The insight conclusion changed. Open the match."),
                };
        }
    }
    switch (type) {
        case "game_start":
            return {
                title: "あなたの予想試合がまもなく開始します。",
                body: matchup || "アプリで試合を確認してください。",
            };
        case "game_final":
            return {
                title: "結果が確定しました。",
                body: matchup || "アプリで結果を確認してください。",
            };
        case "ranking_updated":
            return {
                title: "ランキング更新",
                body: "本日の累積ランキングが更新されました。",
            };
        case "injury_status":
            return {
                title: "出場ステータスが更新されました",
                body: detail ||
                    (matchup
                        ? `${matchup} の予想を確認してください。`
                        : "重要選手の出場情報が変わりました。予想を確認してください。"),
            };
        case "starter_change":
            return {
                title: "重要な先発変更があります",
                body: detail ||
                    (matchup
                        ? `${matchup} の先発を確認してください。`
                        : "影響の大きい先発変更があります。予想を確認してください。"),
            };
        case "prediction_deadline":
            return {
                title: "予想締切が近づいています",
                body: matchup ||
                    "まだ予想していない試合があります。開始前に提出してください。",
            };
        case "pregame_digest":
            return {
                title: "試合前情報が更新されました",
                body: detail ||
                    (matchup
                        ? `${matchup} に複数の更新があります。予想を再確認してください。`
                        : "複数の更新があります。予想を再確認してください。"),
            };
        case "pro_insight_update":
            return {
                title: "PRO INSIGHT が更新されました",
                body: detail ||
                    (matchup
                        ? `${matchup} の結論が変わりました。`
                        : "重要結論が変わりました。試合を開いて確認してください。"),
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