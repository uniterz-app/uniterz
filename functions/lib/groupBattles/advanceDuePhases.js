"use strict";
/**
 * スケジュール到達の大会フェーズを進める（Cloud Functions）。
 * Next `lib/groupBattles/server/advanceDuePhases.ts` と同方針。
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.advanceDueGroupBattlePhases = advanceDueGroupBattlePhases;
const firestore_1 = require("firebase-admin/firestore");
const firebase_1 = require("../firebase");
const COLLECTION = "group_battles";
function tsMs(v) {
    if (v &&
        typeof v === "object" &&
        "toMillis" in v &&
        typeof v.toMillis === "function") {
        return v.toMillis();
    }
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
}
async function lockEligible(db, battleId) {
    var _a, _b;
    const snap = await db
        .collection(COLLECTION)
        .doc(battleId)
        .collection("squads")
        .get();
    const batch = db.batch();
    for (const doc of snap.docs) {
        const d = doc.data();
        const status = String((_a = d.status) !== null && _a !== void 0 ? _a : "");
        const count = Number((_b = d.memberCount) !== null && _b !== void 0 ? _b : 0) || 0;
        if (status === "entered" && count >= 3 && count <= 5) {
            batch.update(doc.ref, {
                status: "locked",
                updatedAt: firestore_1.FieldValue.serverTimestamp(),
            });
        }
        else if (status === "forming" || status === "entered") {
            batch.update(doc.ref, {
                status: "disbanded",
                updatedAt: firestore_1.FieldValue.serverTimestamp(),
            });
        }
    }
    await batch.commit();
}
async function advanceDueGroupBattlePhases() {
    var _a;
    const db = (0, firestore_1.getFirestore)(firebase_1.admin.app());
    const now = Date.now();
    const snap = await db.collection(COLLECTION).limit(80).get();
    let advanced = 0;
    for (const doc of snap.docs) {
        const d = doc.data();
        const phase = String((_a = d.phase) !== null && _a !== void 0 ? _a : "");
        const recruitStartAtMs = tsMs(d.recruitStartAt);
        const recruitEndAtMs = tsMs(d.recruitEndAt);
        const battleEndAtMs = tsMs(d.battleEndAt);
        try {
            if (phase === "announced" &&
                recruitStartAtMs > 0 &&
                now >= recruitStartAtMs) {
                await doc.ref.update({
                    phase: "recruiting",
                    updatedAt: firestore_1.FieldValue.serverTimestamp(),
                });
                advanced += 1;
                continue;
            }
            if (phase === "recruiting" &&
                recruitEndAtMs > 0 &&
                now >= recruitEndAtMs) {
                await doc.ref.update({
                    phase: "locking",
                    updatedAt: firestore_1.FieldValue.serverTimestamp(),
                });
                await lockEligible(db, doc.id);
                await doc.ref.update({
                    phase: "battle",
                    updatedAt: firestore_1.FieldValue.serverTimestamp(),
                });
                advanced += 1;
                continue;
            }
            if (phase === "battle" && battleEndAtMs > 0 && now >= battleEndAtMs) {
                await doc.ref.update({
                    phase: "settling",
                    updatedAt: firestore_1.FieldValue.serverTimestamp(),
                });
                advanced += 1;
            }
        }
        catch (err) {
            console.warn("[advanceDueGroupBattlePhases]", doc.id, err);
        }
    }
    return { advanced };
}
//# sourceMappingURL=advanceDuePhases.js.map