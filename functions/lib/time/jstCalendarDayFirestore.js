"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.jstCalendarDayStartEndTimestamps = jstCalendarDayStartEndTimestamps;
const firestore_1 = require("firebase-admin/firestore");
/** JST calendar day [00:00, 23:59:59.999] as Firestore Timestamps (for games.startAtJst range queries). */
function jstCalendarDayStartEndTimestamps(now = new Date()) {
    const ymd = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Tokyo",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).format(now);
    const start = firestore_1.Timestamp.fromDate(new Date(`${ymd}T00:00:00+09:00`));
    const end = firestore_1.Timestamp.fromDate(new Date(`${ymd}T23:59:59.999+09:00`));
    return { start, end };
}
//# sourceMappingURL=jstCalendarDayFirestore.js.map