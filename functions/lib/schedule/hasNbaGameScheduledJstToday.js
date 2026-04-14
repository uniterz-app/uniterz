"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasNbaGameScheduledJstToday = hasNbaGameScheduledJstToday;
const firestore_1 = require("firebase-admin/firestore");
const jstCalendarDayFirestore_1 = require("../time/jstCalendarDayFirestore");
/** True if any NBA game is scheduled for the current JST calendar day (any season phase). */
async function hasNbaGameScheduledJstToday() {
    const db = (0, firestore_1.getFirestore)();
    const { start, end } = (0, jstCalendarDayFirestore_1.jstCalendarDayStartEndTimestamps)();
    const snap = await db
        .collection("games")
        .where("league", "==", "nba")
        .where("startAtJst", ">=", start)
        .where("startAtJst", "<=", end)
        .limit(1)
        .get();
    return !snap.empty;
}
//# sourceMappingURL=hasNbaGameScheduledJstToday.js.map