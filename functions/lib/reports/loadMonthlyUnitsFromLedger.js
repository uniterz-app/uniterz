"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadMonthlyUnitsByUid = loadMonthlyUnitsByUid;
exports.rankUnitsEarned = rankUnitsEarned;
function pad2(n) {
    return String(n).padStart(2, "0");
}
function jstMonthRange(monthKey) {
    const [y, m] = monthKey.split("-").map(Number);
    if (!y || !m)
        return null;
    return {
        start: new Date(Date.UTC(y, m - 1, 1, -9, 0, 0)),
        endExclusive: new Date(Date.UTC(y, m, 1, -9, 0, 0)),
    };
}
function dateKeyJstFromMs(ms) {
    const j = new Date(ms + 9 * 60 * 60 * 1000);
    return `${j.getUTCFullYear()}-${pad2(j.getUTCMonth() + 1)}-${pad2(j.getUTCDate())}`;
}
function tsMillis(ts) {
    if (!ts || typeof ts !== "object")
        return 0;
    const o = ts;
    if (typeof o.toMillis === "function")
        return o.toMillis();
    if (typeof o.seconds === "number")
        return o.seconds * 1000;
    return 0;
}
function mapSource(reason) {
    switch (reason) {
        case "weekly_rank":
            return "personal_weekly";
        case "monthly_rank":
            return "personal_monthly";
        case "group_battle_weekly":
            return "group_weekly";
        case "group_battle_monthly":
            return "group_monthly";
        case "referral_invitee":
        case "referral_referrer":
        case "referral_milestone":
            return "invite";
        default:
            return "event";
    }
}
function mapMetric(raw) {
    if (raw === "totalPoints" || raw === "winRate")
        return raw;
    if (raw === "totalGoalScorerHits" || raw === "scorer")
        return "scorer";
    if (raw === "totalUpset" || raw === "upset")
        return "upset";
    return null;
}
function grantFromLedgerDoc(id, data, monthKey, ms) {
    const amount = typeof data.amount === "number" && Number.isFinite(data.amount)
        ? data.amount
        : 0;
    if (amount <= 0)
        return null;
    const reason = typeof data.reason === "string" ? data.reason : "unknown";
    const metric = mapMetric(data.metric);
    const source = metric && (reason === "weekly_rank" || reason === "monthly_rank")
        ? "metric_rank"
        : mapSource(reason);
    const periodLabel = (typeof data.label === "string" && data.label) ||
        (typeof data.period === "string" && data.period) ||
        monthKey;
    const rank = typeof data.rank === "number" && Number.isFinite(data.rank)
        ? data.rank
        : null;
    return {
        id,
        source,
        amount,
        periodLabel,
        grantedDateKey: dateKeyJstFromMs(ms),
        rank,
        metric,
    };
}
/** monthKey（JST YYYY-MM）の付与を uid ごとにまとめる */
async function loadMonthlyUnitsByUid(db, monthKey) {
    var _a;
    const range = jstMonthRange(monthKey);
    const out = new Map();
    if (!range)
        return out;
    const snap = await db
        .collection("unit_ledger")
        .where("createdAt", ">=", range.start)
        .where("createdAt", "<", range.endExclusive)
        .get();
    for (const doc of snap.docs) {
        const data = doc.data();
        const uid = typeof data.uid === "string" ? data.uid : "";
        if (!uid)
            continue;
        const ms = tsMillis(data.createdAt);
        const grant = grantFromLedgerDoc(doc.id, data, monthKey, ms);
        if (!grant)
            continue;
        const cur = (_a = out.get(uid)) !== null && _a !== void 0 ? _a : { unitsEarned: 0, breakdown: [] };
        cur.unitsEarned += grant.amount;
        cur.breakdown.push(grant);
        out.set(uid, cur);
    }
    for (const bundle of out.values()) {
        bundle.breakdown.sort((a, b) => b.amount - a.amount);
    }
    return out;
}
function rankUnitsEarned(uids, unitsByUid) {
    const ranked = [...uids]
        .filter((uid) => { var _a, _b; return ((_b = (_a = unitsByUid.get(uid)) === null || _a === void 0 ? void 0 : _a.unitsEarned) !== null && _b !== void 0 ? _b : 0) > 0; })
        .sort((a, b) => {
        var _a, _b, _c, _d;
        return ((_b = (_a = unitsByUid.get(b)) === null || _a === void 0 ? void 0 : _a.unitsEarned) !== null && _b !== void 0 ? _b : 0) -
            ((_d = (_c = unitsByUid.get(a)) === null || _c === void 0 ? void 0 : _c.unitsEarned) !== null && _d !== void 0 ? _d : 0);
    });
    return new Map(ranked.map((uid, i) => [uid, i + 1]));
}
//# sourceMappingURL=loadMonthlyUnitsFromLedger.js.map