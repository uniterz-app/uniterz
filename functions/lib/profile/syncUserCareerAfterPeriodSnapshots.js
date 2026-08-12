"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncUserCareerForPeriod = syncUserCareerForPeriod;
exports.syncUserCareerAfterPeriodSnapshots = syncUserCareerAfterPeriodSnapshots;
/**
 * 週/月 period_ranking_snapshots（totalPoints）確定後に
 * 全行の順位を user_career へ冪等反映。
 */
const firestore_1 = require("firebase-admin/firestore");
const grantPeriodRankingUnits_1 = require("../units/grantPeriodRankingUnits");
const nbaPeriod_1 = require("../rankings/nbaPeriod");
const nbaSeason_1 = require("../rankings/nbaSeason");
const syncUserCareer_1 = require("./syncUserCareer");
function periodStandardSnapshotDocId(period, label, metric) {
    return `nba_${period}_${label}_${metric}`;
}
function loadRankEntries(data) {
    const out = [];
    if (data.ranks && typeof data.ranks === "object") {
        for (const [uid, rank] of Object.entries(data.ranks)) {
            if (!uid)
                continue;
            const r = typeof rank === "number" ? rank : Number(rank);
            if (Number.isFinite(r) && r >= 1)
                out.push({ uid, rank: Math.floor(r) });
        }
        return out;
    }
    if (Array.isArray(data.rows)) {
        for (const row of data.rows) {
            const uid = typeof row.uid === "string" ? row.uid : "";
            const r = typeof row.rank === "number" ? row.rank : Number(row.rank);
            if (uid && Number.isFinite(r) && r >= 1) {
                out.push({ uid, rank: Math.floor(r) });
            }
        }
    }
    return out;
}
function seasonKeyFromPeriodLabel(period, label) {
    if (period === "monthly") {
        const [y, m] = label.split("-").map(Number);
        if (Number.isFinite(y) && Number.isFinite(m)) {
            return (0, nbaSeason_1.nbaSeasonKeyFromDateJST)(new Date(Date.UTC(y, m - 1, 15)));
        }
    }
    // weekly label = Monday dateKey
    const [y, m, d] = label.split("-").map(Number);
    if (Number.isFinite(y) && Number.isFinite(m) && Number.isFinite(d)) {
        return (0, nbaSeason_1.nbaSeasonKeyFromDateJST)(new Date(Date.UTC(y, m - 1, d)));
    }
    return (0, nbaSeason_1.nbaSeasonKeyFromDateJST)(new Date());
}
async function syncUserCareerForPeriod(opts) {
    var _a, _b;
    const now = (_a = opts.now) !== null && _a !== void 0 ? _a : new Date();
    if (!(0, grantPeriodRankingUnits_1.isNbaPeriodFinalForUnitGrants)(opts.period, opts.labelKey, now)) {
        return { updated: 0 };
    }
    const db = (0, firestore_1.getFirestore)();
    const docId = periodStandardSnapshotDocId(opts.period, opts.labelKey, "totalPoints");
    const snap = await db.collection("period_ranking_snapshots").doc(docId).get();
    if (!snap.exists)
        return { updated: 0 };
    const entries = loadRankEntries(((_b = snap.data()) !== null && _b !== void 0 ? _b : {}));
    const seasonKey = seasonKeyFromPeriodLabel(opts.period, opts.labelKey);
    let updated = 0;
    // 逐次で OK（週1/月1）。並列しすぎると transaction 競合・コスト増。
    for (const { uid, rank } of entries) {
        try {
            await (0, syncUserCareer_1.syncUserCareerPeriodRank)({
                uid,
                period: opts.period,
                label: opts.labelKey,
                rank,
                seasonKey,
            });
            updated += 1;
        }
        catch (err) {
            console.warn(`[syncUserCareerForPeriod] ${opts.period} ${opts.labelKey} uid=${uid}`, err);
        }
    }
    console.log(`[syncUserCareerForPeriod] ${opts.period} ${opts.labelKey} updated=${updated}/${entries.length}`);
    return { updated };
}
async function syncUserCareerAfterPeriodSnapshots(now = new Date()) {
    const weekPrev = (0, nbaPeriod_1.previousLabel)("weekly", (0, nbaPeriod_1.weekStartDateKeyJST)(now));
    const monthPrev = (0, nbaPeriod_1.previousLabel)("monthly", (0, nbaPeriod_1.monthLabelJST)(now));
    await syncUserCareerForPeriod({
        period: "weekly",
        labelKey: weekPrev,
        now,
    });
    await syncUserCareerForPeriod({
        period: "monthly",
        labelKey: monthPrev,
        now,
    });
}
//# sourceMappingURL=syncUserCareerAfterPeriodSnapshots.js.map