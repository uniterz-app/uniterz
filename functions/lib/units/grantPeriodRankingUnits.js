"use strict";
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
exports.isNbaPeriodFinalForUnitGrants = isNbaPeriodFinalForUnitGrants;
exports.grantPeriodRankingUnitsForPeriod = grantPeriodRankingUnitsForPeriod;
exports.grantPeriodRankingUnitsAfterPeriodSnapshots = grantPeriodRankingUnitsAfterPeriodSnapshots;
/**
 * 個人ランキング（週総合 / 月総合+部門）Unit 冪等付与。
 * period_ranking_snapshots（standard）確定後に実行。
 * 同順位は同量（competition）。タイブレークなし。
 */
const firestore_1 = require("firebase-admin/firestore");
const nbaPeriod_1 = require("../rankings/nbaPeriod");
const periodRankingUnitRewards_1 = require("./periodRankingUnitRewards");
const formatPeriodRankingUnitEarn_1 = require("./formatPeriodRankingUnitEarn");
/** running のままこの時間を超えたらリトライ許可 */
const GRANT_RUNNING_STALE_MS = 15 * 60 * 1000;
function timestampToMs(v) {
    if (v &&
        typeof v === "object" &&
        typeof v.toMillis === "function") {
        return v.toMillis();
    }
    return 0;
}
function periodStandardSnapshotDocId(period, label, metric) {
    return `nba_${period}_${label}_${metric}`;
}
/** Pro Skin 付与と同じ猶予（期間終了 + grace 後のみ true） */
function isNbaPeriodFinalForUnitGrants(period, labelKey, now = new Date()) {
    const todayKey = (0, nbaPeriod_1.dateKeyJST)(now);
    if (period === "weekly") {
        const current = (0, nbaPeriod_1.weekStartDateKeyJST)(now);
        if (labelKey >= current)
            return false;
        if (todayKey <= (0, nbaPeriod_1.addDaysToDateKey)(current, nbaPeriod_1.PERIOD_FINALIZE_GRACE_DAYS) &&
            labelKey === (0, nbaPeriod_1.previousLabel)("weekly", current)) {
            return false;
        }
        return true;
    }
    const current = (0, nbaPeriod_1.monthLabelJST)(now);
    if (labelKey >= current)
        return false;
    if (todayKey <=
        (0, nbaPeriod_1.addDaysToDateKey)(`${current}-01`, nbaPeriod_1.PERIOD_FINALIZE_GRACE_DAYS) &&
        labelKey === (0, nbaPeriod_1.previousLabel)("monthly", current)) {
        return false;
    }
    return true;
}
async function claimPeriodUnitGrant(opts) {
    const db = (0, firestore_1.getFirestore)();
    const grantRef = db.doc(`meta/periodRankingUnitGrants/${opts.period}_${opts.labelKey}`);
    return db.runTransaction(async (tx) => {
        var _a;
        const snap = await tx.get(grantRef);
        if (snap.exists) {
            const data = ((_a = snap.data()) !== null && _a !== void 0 ? _a : {});
            if (data.status === "done")
                return false;
            if (data.status === "running") {
                const startedMs = timestampToMs(data.startedAt);
                if (startedMs > 0 &&
                    Date.now() - startedMs < GRANT_RUNNING_STALE_MS) {
                    return false;
                }
            }
        }
        tx.set(grantRef, {
            period: opts.period,
            labelKey: opts.labelKey,
            status: "running",
            startedAt: firestore_1.FieldValue.serverTimestamp(),
            attempt: firestore_1.FieldValue.increment(1),
        }, { merge: true });
        return true;
    });
}
function loadRankEntriesFromSnapshot(data) {
    var _a;
    const byUid = new Map();
    const ranks = (_a = data.ranks) !== null && _a !== void 0 ? _a : {};
    for (const [uid, rank] of Object.entries(ranks)) {
        if (typeof rank === "number" && rank > 0)
            byUid.set(uid, rank);
    }
    if (byUid.size === 0 && Array.isArray(data.rows)) {
        for (const row of data.rows) {
            const uid = typeof row.uid === "string" ? row.uid : "";
            const rank = typeof row.rank === "number" ? row.rank : 0;
            if (uid && rank > 0)
                byUid.set(uid, rank);
        }
    }
    return [...byUid.entries()].map(([uid, rank]) => ({ uid, rank }));
}
async function grantPeriodRankingUnitsForPeriod(opts) {
    var _a, _b, _c;
    const now = (_a = opts.now) !== null && _a !== void 0 ? _a : new Date();
    if (!isNbaPeriodFinalForUnitGrants(opts.period, opts.labelKey, now)) {
        return { granted: false, ledgerWrites: 0, skipped: 0 };
    }
    const claimed = await claimPeriodUnitGrant({
        period: opts.period,
        labelKey: opts.labelKey,
    });
    if (!claimed)
        return { granted: false, ledgerWrites: 0, skipped: 0 };
    const db = (0, firestore_1.getFirestore)();
    const grantRef = db.doc(`meta/periodRankingUnitGrants/${opts.period}_${opts.labelKey}`);
    const reason = (0, periodRankingUnitRewards_1.periodRankingUnitLedgerReason)(opts.period);
    const metrics = (0, periodRankingUnitRewards_1.periodRankingUnitMetricsForPeriod)(opts.period);
    let ledgerWrites = 0;
    let skipped = 0;
    let snapshotsSeen = 0;
    let snapshotsMissing = 0;
    const metricStats = {};
    /** uid → 今回新規付与の合計 Unit（プッシュ用） */
    const grantedByUid = new Map();
    try {
        for (const metric of metrics) {
            const maxRank = (0, periodRankingUnitRewards_1.periodRankingUnitMaxRank)(opts.period, metric);
            if (maxRank <= 0)
                continue;
            const snap = await db
                .collection("period_ranking_snapshots")
                .doc(periodStandardSnapshotDocId(opts.period, opts.labelKey, metric))
                .get();
            if (!snap.exists) {
                snapshotsMissing += 1;
                console.warn(`[grantPeriodRankingUnits] missing snapshot ${opts.period} ${opts.labelKey} ${metric}`);
                continue;
            }
            snapshotsSeen += 1;
            const entries = loadRankEntriesFromSnapshot(((_b = snap.data()) !== null && _b !== void 0 ? _b : {}));
            let metricGranted = 0;
            for (const { uid, rank } of entries) {
                if (rank > maxRank)
                    continue;
                const amount = (0, periodRankingUnitRewards_1.unitsForPeriodRankingRank)(opts.period, metric, rank);
                if (amount == null)
                    continue;
                const key = (0, periodRankingUnitRewards_1.periodRankingUnitIdempotencyKey)({
                    period: opts.period,
                    label: opts.labelKey,
                    metric,
                    uid,
                });
                const ledgerRef = db.collection("unit_ledger").doc(key);
                const userRef = db.collection("users").doc(uid);
                const pendingRef = userRef.collection("pending_unit_earns").doc(key);
                const copy = (0, formatPeriodRankingUnitEarn_1.buildPeriodRankingUnitEarnCopy)({
                    period: opts.period,
                    label: opts.labelKey,
                    metric,
                    rank,
                });
                const did = await db.runTransaction(async (tx) => {
                    const existing = await tx.get(ledgerRef);
                    if (existing.exists)
                        return false;
                    tx.set(ledgerRef, {
                        uid,
                        amount,
                        reason,
                        idempotencyKey: key,
                        period: opts.period,
                        label: opts.labelKey,
                        metric,
                        rank,
                        createdAt: firestore_1.FieldValue.serverTimestamp(),
                    });
                    tx.set(userRef, {
                        unitBalance: firestore_1.FieldValue.increment(amount),
                        updatedAt: firestore_1.FieldValue.serverTimestamp(),
                    }, { merge: true });
                    tx.set(pendingRef, {
                        amount,
                        reason,
                        period: opts.period,
                        label: opts.labelKey,
                        metric,
                        rank,
                        titleJa: copy.titleJa,
                        titleEn: copy.titleEn,
                        subtitleJa: copy.subtitleJa,
                        subtitleEn: copy.subtitleEn,
                        claimedAt: null,
                        createdAt: firestore_1.FieldValue.serverTimestamp(),
                        createdAtMs: Date.now(),
                    });
                    return true;
                });
                if (did) {
                    ledgerWrites += 1;
                    metricGranted += 1;
                    grantedByUid.set(uid, ((_c = grantedByUid.get(uid)) !== null && _c !== void 0 ? _c : 0) + amount);
                    try {
                        const { syncUserCareerUnitsEarned, syncUserCareerPeriodRank } = await Promise.resolve().then(() => __importStar(require("../profile/syncUserCareer")));
                        await syncUserCareerUnitsEarned(uid, amount);
                        if (metric === "totalPoints") {
                            await syncUserCareerPeriodRank({
                                uid,
                                period: opts.period,
                                label: opts.labelKey,
                                rank,
                            });
                        }
                    }
                    catch (err) {
                        console.warn("[grantPeriodRankingUnits] career sync failed", err);
                    }
                }
                else {
                    skipped += 1;
                }
            }
            metricStats[metric] = metricGranted;
        }
        if (snapshotsSeen === 0 && snapshotsMissing > 0) {
            await grantRef.set({
                status: "error",
                error: "missing_snapshots",
                period: opts.period,
                labelKey: opts.labelKey,
                snapshotsMissing,
                failedAt: firestore_1.FieldValue.serverTimestamp(),
            }, { merge: true });
            console.warn(`[grantPeriodRankingUnits] abort done: missing all snapshots ${opts.period} ${opts.labelKey}`);
            return { granted: false, ledgerWrites: 0, skipped: 0 };
        }
        await grantRef.set({
            status: "done",
            period: opts.period,
            labelKey: opts.labelKey,
            division: "standard",
            ledgerWrites,
            skipped,
            metricStats,
            snapshotsMissing,
            grantedAt: firestore_1.FieldValue.serverTimestamp(),
        }, { merge: true });
        if (grantedByUid.size > 0) {
            try {
                const { sendExpoPushToUids } = await Promise.resolve().then(() => __importStar(require("../notifications/sendExpoPush")));
                await sendExpoPushToUids({
                    type: "unit_reward",
                    targets: [...grantedByUid.entries()].map(([uid, amount]) => ({
                        uid,
                        data: {
                            type: "unit_reward",
                            amount: String(amount),
                            period: opts.period,
                            label: opts.labelKey,
                        },
                    })),
                });
            }
            catch (err) {
                console.warn("[grantPeriodRankingUnits] push failed", err);
            }
        }
        console.log(`[grantPeriodRankingUnits] ${opts.period} ${opts.labelKey} writes=${ledgerWrites} skipped=${skipped}`, metricStats);
        return { granted: true, ledgerWrites, skipped };
    }
    catch (err) {
        await grantRef.set({
            status: "error",
            error: err instanceof Error ? err.message : String(err),
            failedAt: firestore_1.FieldValue.serverTimestamp(),
        }, { merge: true });
        throw err;
    }
}
async function grantPeriodRankingUnitsAfterPeriodSnapshots(now = new Date()) {
    const weekCurrent = (0, nbaPeriod_1.weekStartDateKeyJST)(now);
    const weekPrev = (0, nbaPeriod_1.previousLabel)("weekly", weekCurrent);
    const monthCurrent = (0, nbaPeriod_1.monthLabelJST)(now);
    const monthPrev = (0, nbaPeriod_1.previousLabel)("monthly", monthCurrent);
    await grantPeriodRankingUnitsForPeriod({
        period: "weekly",
        labelKey: weekPrev,
        now,
    });
    await grantPeriodRankingUnitsForPeriod({
        period: "monthly",
        labelKey: monthPrev,
        now,
    });
}
//# sourceMappingURL=grantPeriodRankingUnits.js.map