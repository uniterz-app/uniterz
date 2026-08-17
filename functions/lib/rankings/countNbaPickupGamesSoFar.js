"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.countNbaPickupGamesSoFar = countNbaPickupGamesSoFar;
/**
 * 期間内・asOf までの tip-off がある NBA ピックアップ試合数（勝率 65% ガード用）。
 * パターン B: 分母は「その時点まで」の pickup。
 */
const firestore_1 = require("firebase-admin/firestore");
const isPickupGame_1 = require("./isPickupGame");
function jstDayStart(dateKey) {
    return firestore_1.Timestamp.fromDate(new Date(`${dateKey}T00:00:00+09:00`));
}
function jstDayEnd(dateKey) {
    return firestore_1.Timestamp.fromDate(new Date(`${dateKey}T23:59:59.999+09:00`));
}
async function countNbaPickupGamesSoFar(opts) {
    if (opts.asOfKey < opts.startKey)
        return 0;
    const snap = await opts.db
        .collection("games")
        .where("league", "==", "nba")
        .where("startAtJst", ">=", jstDayStart(opts.startKey))
        .where("startAtJst", "<=", jstDayEnd(opts.asOfKey))
        .get();
    let n = 0;
    for (const doc of snap.docs) {
        if ((0, isPickupGame_1.isNbaPickupGame)(doc.data()))
            n += 1;
    }
    return n;
}
//# sourceMappingURL=countNbaPickupGamesSoFar.js.map