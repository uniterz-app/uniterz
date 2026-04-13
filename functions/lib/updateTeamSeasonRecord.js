"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateTeamSeasonRecord = updateTeamSeasonRecord;
const firestore_1 = require("firebase-admin/firestore");
/**
 * 試合確定時に teams のシーズン通算（wins / losses / draws）を更新する。
 * - target regular: ルートの wins / losses / draws（レギュラー・ランキング用）
 * - target playoffs: playoff.wins / playoff.losses / playoff.draws
 */
async function updateTeamSeasonRecord({ db, league, homeTeamId, awayTeamId, homeScore, awayScore, target = "regular", }) {
    if (!league) {
        console.warn("[updateTeamSeasonRecord] missing league, skip");
        return;
    }
    const isSoccer = league === "j1" || league === "pl";
    const homeRef = db.doc(`teams/${homeTeamId}`);
    const awayRef = db.doc(`teams/${awayTeamId}`);
    const ts = firestore_1.FieldValue.serverTimestamp();
    const wk = target === "playoffs" ? "playoff.wins" : "wins";
    const lk = target === "playoffs" ? "playoff.losses" : "losses";
    const dk = target === "playoffs" ? "playoff.draws" : "draws";
    if (homeScore === awayScore) {
        if (!isSoccer) {
            console.warn("[updateTeamSeasonRecord] tie in non-soccer game, skip", {
                league,
                homeTeamId,
                awayTeamId,
            });
            return;
        }
        const batch = db.batch();
        batch.update(homeRef, { [dk]: firestore_1.FieldValue.increment(1), updatedAt: ts });
        batch.update(awayRef, { [dk]: firestore_1.FieldValue.increment(1), updatedAt: ts });
        await batch.commit();
        return;
    }
    const batch = db.batch();
    if (homeScore > awayScore) {
        batch.update(homeRef, { [wk]: firestore_1.FieldValue.increment(1), updatedAt: ts });
        batch.update(awayRef, { [lk]: firestore_1.FieldValue.increment(1), updatedAt: ts });
    }
    else {
        batch.update(awayRef, { [wk]: firestore_1.FieldValue.increment(1), updatedAt: ts });
        batch.update(homeRef, { [lk]: firestore_1.FieldValue.increment(1), updatedAt: ts });
    }
    await batch.commit();
}
//# sourceMappingURL=updateTeamSeasonRecord.js.map