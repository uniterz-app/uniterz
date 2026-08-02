"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasRankingAggregationScheduledJstToday = hasRankingAggregationScheduledJstToday;
const firestore_1 = require("firebase-admin/firestore");
const jstCalendarDayFirestore_1 = require("../time/jstCalendarDayFirestore");
/** JST 当日に NBA 試合があれば true（累積ランキング集計トリガー用） */
async function hasRankingAggregationScheduledJstToday() {
    const db = (0, firestore_1.getFirestore)();
    const { start, end } = (0, jstCalendarDayFirestore_1.jstCalendarDayStartEndTimestamps)();
    const nbaSnap = await db
        .collection("games")
        .where("league", "==", "nba")
        .where("startAtJst", ">=", start)
        .where("startAtJst", "<=", end)
        .limit(1)
        .get();
    return !nbaSnap.empty;
}
//# sourceMappingURL=hasRankingAggregationScheduledJstToday.js.map