"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_PUSH_NOTIFICATION_PREFS = exports.PUSH_NOTIFICATION_PREF_KEYS = void 0;
exports.prefKeyForPushType = prefKeyForPushType;
exports.parsePushNotificationPrefs = parsePushNotificationPrefs;
exports.isPushTypeEnabledForPrefs = isPushTypeEnabledForPrefs;
exports.isPushTypeEnabledForUser = isPushTypeEnabledForUser;
exports.PUSH_NOTIFICATION_PREF_KEYS = [
    "gameStart",
    "gameFinal",
    "rankingUpdated",
];
exports.DEFAULT_PUSH_NOTIFICATION_PREFS = {
    gameStart: true,
    gameFinal: true,
    rankingUpdated: true,
};
function prefKeyForPushType(type) {
    switch (type) {
        case "game_start":
            return "gameStart";
        case "game_final":
            return "gameFinal";
        case "ranking_updated":
            return "rankingUpdated";
    }
}
function parsePushNotificationPrefs(raw) {
    if (!raw || typeof raw !== "object") {
        return Object.assign({}, exports.DEFAULT_PUSH_NOTIFICATION_PREFS);
    }
    const src = raw;
    return {
        gameStart: typeof src.gameStart === "boolean"
            ? src.gameStart
            : exports.DEFAULT_PUSH_NOTIFICATION_PREFS.gameStart,
        gameFinal: typeof src.gameFinal === "boolean"
            ? src.gameFinal
            : exports.DEFAULT_PUSH_NOTIFICATION_PREFS.gameFinal,
        rankingUpdated: typeof src.rankingUpdated === "boolean"
            ? src.rankingUpdated
            : exports.DEFAULT_PUSH_NOTIFICATION_PREFS.rankingUpdated,
    };
}
function isPushTypeEnabledForPrefs(prefs, type) {
    return prefs[prefKeyForPushType(type)];
}
function isPushTypeEnabledForUser(rawPrefs, type) {
    return isPushTypeEnabledForPrefs(parsePushNotificationPrefs(rawPrefs), type);
}
//# sourceMappingURL=pushNotificationPrefs.js.map