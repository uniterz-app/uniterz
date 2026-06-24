"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.streakApplyMarkerRef = streakApplyMarkerRef;
exports.streakResultFromUserSnap = streakResultFromUserSnap;
function streakApplyMarkerRef(db, gameId, uid) {
    return db.doc(`games/${gameId}/streak_apply_v2/${uid}`);
}
function streakResultFromUserSnap(uid, didWin, snap, sportKey) {
    var _a;
    const sb = snap.get("streakBySport");
    const mb = snap.get("maxWinStreakBySport");
    let current = 0;
    let maxWin = 0;
    if (sportKey === "football") {
        current =
            typeof (sb === null || sb === void 0 ? void 0 : sb.football) === "number"
                ? sb.football
                : typeof snap.get("streakFootball") === "number"
                    ? snap.get("streakFootball")
                    : 0;
        maxWin =
            typeof (mb === null || mb === void 0 ? void 0 : mb.football) === "number"
                ? mb.football
                : typeof snap.get("maxWinStreakFootball") === "number"
                    ? snap.get("maxWinStreakFootball")
                    : 0;
    }
    else {
        current =
            typeof (sb === null || sb === void 0 ? void 0 : sb.basketball) === "number"
                ? sb.basketball
                : typeof snap.get("currentStreak") === "number"
                    ? snap.get("currentStreak")
                    : 0;
        maxWin =
            typeof (mb === null || mb === void 0 ? void 0 : mb.basketball) === "number"
                ? mb.basketball
                : typeof snap.get("maxWinStreak") === "number"
                    ? snap.get("maxWinStreak")
                    : 0;
    }
    const activeWinStreak = current > 0 ? current : 0;
    const maxLose = (_a = snap.get("maxLoseStreak")) !== null && _a !== void 0 ? _a : 0;
    return {
        uid,
        didWin,
        currentStreak: current,
        activeWinStreak,
        maxWinStreak: maxWin,
        maxLoseStreak: maxLose,
    };
}
//# sourceMappingURL=updateUserStreakInternals.js.map