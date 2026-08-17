"use strict";
/**
 * グループバトル Unit 冪等付与（Cloud Functions）。
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.grantGroupBattleUnits = grantGroupBattleUnits;
exports.grantAllFinalGroupBattleUnits = grantAllFinalGroupBattleUnits;
const firestore_1 = require("firebase-admin/firestore");
const firebase_1 = require("../firebase");
function unitsForRank(table, rank) {
    if (rank < 1)
        return null;
    const amount = table[rank - 1];
    if (amount == null || !Number.isFinite(amount) || amount <= 0)
        return null;
    return amount;
}
async function grantGroupBattleUnits(input) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
    const db = (0, firestore_1.getFirestore)(firebase_1.admin.app());
    const battleSnap = await db.collection("group_battles").doc(input.battleId).get();
    if (!battleSnap.exists)
        throw new Error("battle_not_found");
    const battle = battleSnap.data();
    const snapId = `${input.battleId}_${input.period}_${input.label}`;
    const snap = await db.collection("group_battle_period_snapshots").doc(snapId).get();
    if (!snap.exists)
        throw new Error("snapshot_not_found");
    const snapshot = snap.data();
    if (snapshot.status !== "final")
        return { granted: 0, skipped: 0 };
    const rewards = ((_a = battle.unitRewards) !== null && _a !== void 0 ? _a : {});
    const table = input.period === "weekly"
        ? (_c = (_b = rewards.weekly) === null || _b === void 0 ? void 0 : _b.unitsPerMemberByRank) !== null && _c !== void 0 ? _c : []
        : (_e = (_d = rewards.monthly) === null || _d === void 0 ? void 0 : _d.unitsPerMemberByRank) !== null && _e !== void 0 ? _e : [];
    const maxRank = input.period === "weekly"
        ? Number((_g = (_f = rewards.weekly) === null || _f === void 0 ? void 0 : _f.maxRank) !== null && _g !== void 0 ? _g : 0)
        : Number((_j = (_h = rewards.monthly) === null || _h === void 0 ? void 0 : _h.maxRank) !== null && _j !== void 0 ? _j : 0);
    const reason = input.period === "weekly"
        ? "group_battle_weekly"
        : "group_battle_monthly";
    let granted = 0;
    let skipped = 0;
    const rows = (_k = snapshot.rows) !== null && _k !== void 0 ? _k : [];
    for (const row of rows) {
        if (row.rank > maxRank)
            continue;
        const amount = unitsForRank(table, row.rank);
        if (amount == null)
            continue;
        for (const member of (_l = row.memberScores) !== null && _l !== void 0 ? _l : []) {
            const key = `gb:${input.battleId}:${input.period}:${input.label}:rank${row.rank}:uid${member.uid}`;
            const ledgerRef = db.collection("unit_ledger").doc(key);
            const userRef = db.collection("users").doc(member.uid);
            const did = await db.runTransaction(async (tx) => {
                const existing = await tx.get(ledgerRef);
                if (existing.exists)
                    return false;
                tx.set(ledgerRef, {
                    uid: member.uid,
                    amount,
                    reason,
                    idempotencyKey: key,
                    battleId: input.battleId,
                    period: input.period,
                    label: input.label,
                    rank: row.rank,
                    createdAt: firestore_1.FieldValue.serverTimestamp(),
                });
                tx.set(userRef, {
                    unitBalance: firestore_1.FieldValue.increment(amount),
                    updatedAt: firestore_1.FieldValue.serverTimestamp(),
                }, { merge: true });
                return true;
            });
            if (did) {
                granted += 1;
                try {
                    const { syncUserCareerGroupBattleRank, syncUserCareerUnitsEarned } = await Promise.resolve().then(() => __importStar(require("../profile/syncUserCareer")));
                    await syncUserCareerUnitsEarned(member.uid, amount);
                    await syncUserCareerGroupBattleRank({
                        uid: member.uid,
                        battleId: input.battleId,
                        period: input.period,
                        label: input.label,
                        rank: row.rank,
                    });
                }
                catch (err) {
                    console.warn("[grantGroupBattleUnits] career sync failed", err);
                }
            }
            else
                skipped += 1;
        }
    }
    return { granted, skipped };
}
/** final スナップを走査して未付与分を付与 */
async function grantAllFinalGroupBattleUnits() {
    const db = (0, firestore_1.getFirestore)(firebase_1.admin.app());
    const snap = await db
        .collection("group_battle_period_snapshots")
        .where("status", "==", "final")
        .limit(50)
        .get();
    let total = 0;
    for (const doc of snap.docs) {
        const d = doc.data();
        const result = await grantGroupBattleUnits({
            battleId: String(d.battleId),
            period: d.period === "monthly" ? "monthly" : "weekly",
            label: String(d.label),
        });
        total += result.granted;
    }
    console.log(`[grantAllFinalGroupBattleUnits] granted=${total}`);
    return total;
}
//# sourceMappingURL=grantGroupBattleUnits.js.map