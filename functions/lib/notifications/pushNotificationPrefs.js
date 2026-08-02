"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_PUSH_NOTIFICATION_PREFS = exports.PREDICTION_DEADLINE_MINUTE_OPTIONS = exports.PUSH_NOTIFICATION_PREF_KEYS = void 0;
exports.prefKeyForPushType = prefKeyForPushType;
exports.parsePushNotificationPrefs = parsePushNotificationPrefs;
exports.isPushTypeEnabledForPrefs = isPushTypeEnabledForPrefs;
exports.isPushTypeEnabledForUser = isPushTypeEnabledForUser;
exports.PUSH_NOTIFICATION_PREF_KEYS = [
    "gameStart",
    "gameFinal",
    "rankingUpdated",
    "injuryStatus",
    "starterChange",
    "predictionDeadline",
    "pregameDigest",
    "proInsightUpdate",
];
exports.PREDICTION_DEADLINE_MINUTE_OPTIONS = [60, 30, 10];
exports.DEFAULT_PUSH_NOTIFICATION_PREFS = {
    gameStart: true,
    gameFinal: true,
    rankingUpdated: true,
    injuryStatus: false,
    starterChange: false,
    predictionDeadline: true,
    pregameDigest: false,
    proInsightUpdate: false,
    predictionDeadlineMinutes: 30,
};
function prefKeyForPushType(type) {
    switch (type) {
        case "game_start":
            return "gameStart";
        case "game_final":
            return "gameFinal";
        case "ranking_updated":
            return "rankingUpdated";
        case "injury_status":
            return "injuryStatus";
        case "starter_change":
            return "starterChange";
        case "prediction_deadline":
            return "predictionDeadline";
        case "pregame_digest":
            return "pregameDigest";
        case "pro_insight_update":
            return "proInsightUpdate";
    }
}
function parseDeadlineMinutes(raw) {
    if (raw === 60 || raw === 10 || raw === 30)
        return raw;
    if (raw === "60")
        return 60;
    if (raw === "10")
        return 10;
    if (raw === "30")
        return 30;
    return exports.DEFAULT_PUSH_NOTIFICATION_PREFS.predictionDeadlineMinutes;
}
function parsePushNotificationPrefs(raw) {
    if (!raw || typeof raw !== "object") {
        return Object.assign({}, exports.DEFAULT_PUSH_NOTIFICATION_PREFS);
    }
    const src = raw;
    const boolOr = (key, fallback) => typeof src[key] === "boolean" ? src[key] : fallback;
    return {
        gameStart: boolOr("gameStart", exports.DEFAULT_PUSH_NOTIFICATION_PREFS.gameStart),
        gameFinal: boolOr("gameFinal", exports.DEFAULT_PUSH_NOTIFICATION_PREFS.gameFinal),
        rankingUpdated: boolOr("rankingUpdated", exports.DEFAULT_PUSH_NOTIFICATION_PREFS.rankingUpdated),
        injuryStatus: boolOr("injuryStatus", exports.DEFAULT_PUSH_NOTIFICATION_PREFS.injuryStatus),
        starterChange: boolOr("starterChange", exports.DEFAULT_PUSH_NOTIFICATION_PREFS.starterChange),
        predictionDeadline: boolOr("predictionDeadline", exports.DEFAULT_PUSH_NOTIFICATION_PREFS.predictionDeadline),
        pregameDigest: boolOr("pregameDigest", exports.DEFAULT_PUSH_NOTIFICATION_PREFS.pregameDigest),
        proInsightUpdate: boolOr("proInsightUpdate", exports.DEFAULT_PUSH_NOTIFICATION_PREFS.proInsightUpdate),
        predictionDeadlineMinutes: parseDeadlineMinutes(src.predictionDeadlineMinutes),
    };
}
function isPushTypeEnabledForPrefs(prefs, type) {
    return prefs[prefKeyForPushType(type)];
}
function isPushTypeEnabledForUser(rawPrefs, type) {
    return isPushTypeEnabledForPrefs(parsePushNotificationPrefs(rawPrefs), type);
}
//# sourceMappingURL=pushNotificationPrefs.js.map