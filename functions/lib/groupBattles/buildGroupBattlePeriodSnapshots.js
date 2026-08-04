"use strict";
/**
 * グループバトル期間スナップショット（Cloud Functions）。
 * Next 側 lib/groupBattles/server/buildPeriodSnapshot.ts と同ロジック。
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildGroupBattlePeriodSnapshots = buildGroupBattlePeriodSnapshots;
const firestore_1 = require("firebase-admin/firestore");
const firebase_1 = require("../firebase");
const nbaPeriod_1 = require("../rankings/nbaPeriod");
const COLLECTION = "group_battles";
const SNAPSHOTS = "group_battle_period_snapshots";
const GRACE_DAYS = 2;
function pickPoints(data, seasonKey) {
    var _a, _b, _c, _d, _e;
    const bySeason = data.rankingBySeason;
    if ((bySeason === null || bySeason === void 0 ? void 0 : bySeason[seasonKey]) && typeof bySeason[seasonKey] === "object") {
        return Number((_a = bySeason[seasonKey].pointsSumV3) !== null && _a !== void 0 ? _a : 0) || 0;
    }
    const nba = (_b = data.leagues) === null || _b === void 0 ? void 0 : _b.nba;
    if (nba)
        return Number((_c = nba.pointsSumV3) !== null && _c !== void 0 ? _c : 0) || 0;
    const ranking = data.ranking;
    if (ranking)
        return Number((_d = ranking.pointsSumV3) !== null && _d !== void 0 ? _d : 0) || 0;
    const all = data.all;
    if (all)
        return Number((_e = all.pointsSumV3) !== null && _e !== void 0 ? _e : 0) || 0;
    return 0;
}
function uidFromDailyDocId(docId, dateKey) {
    const suffix = `_${dateKey}`;
    if (docId.endsWith(suffix))
        return docId.slice(0, -suffix.length);
    const i = docId.lastIndexOf("_");
    if (i <= 0)
        return null;
    return docId.slice(0, i);
}
function rankRows(inputs) {
    const prepared = inputs.map((s) => {
        const sum = s.memberScores.reduce((a, m) => a + m.points, 0);
        const groupScore = s.memberCount > 0 ? sum / s.memberCount : 0;
        return Object.assign(Object.assign({}, s), { groupScore });
    });
    prepared.sort((a, b) => {
        const d = b.groupScore - a.groupScore;
        if (d !== 0)
            return d;
        return a.squadId.localeCompare(b.squadId);
    });
    let lastScore = null;
    let lastRank = 0;
    return prepared.map((s, i) => {
        const rank = lastScore != null && s.groupScore === lastScore ? lastRank : i + 1;
        lastScore = s.groupScore;
        lastRank = rank;
        const above = i > 0 ? prepared[i - 1] : null;
        return {
            rank,
            squadId: s.squadId,
            name: s.name,
            groupScore: s.groupScore,
            memberCount: s.memberCount,
            memberScores: s.memberScores,
            prevRank: s.prevRank,
            scoreGapToAbove: above ? above.groupScore - s.groupScore : null,
        };
    });
}
async function buildOne(battleId, battle, period, label, startKey, endKey, todayKey) {
    var _a, _b, _c, _d, _e;
    const db = (0, firestore_1.getFirestore)(firebase_1.admin.app());
    const squadSnap = await db
        .collection(COLLECTION)
        .doc(battleId)
        .collection("squads")
        .where("status", "==", "locked")
        .get();
    const squads = squadSnap.docs.map((d) => {
        var _a, _b;
        const data = d.data();
        const memberUids = Array.isArray(data.memberUids)
            ? data.memberUids.map(String)
            : [];
        return {
            id: d.id,
            name: String((_a = data.name) !== null && _a !== void 0 ? _a : ""),
            memberUids,
            memberCount: Number((_b = data.memberCount) !== null && _b !== void 0 ? _b : memberUids.length) || 0,
        };
    });
    const uidSet = [...new Set(squads.flatMap((s) => s.memberUids))];
    const pointsByUid = new Map();
    for (const uid of uidSet)
        pointsByUid.set(uid, 0);
    const seasonKey = String((_a = battle.seasonKey) !== null && _a !== void 0 ? _a : "");
    const dateKeys = [];
    {
        let cur = startKey;
        while (cur <= endKey) {
            dateKeys.push(cur);
            cur = (0, nbaPeriod_1.addDaysToDateKey)(cur, 1);
        }
    }
    // 期間全体の date 範囲スキャンはしない。対象メンバー×日付だけ getAll。
    if (uidSet.length > 0 && dateKeys.length > 0) {
        const col = db.collection("user_stats_v2_daily");
        const refs = uidSet.flatMap((uid) => dateKeys.map((dateKey) => col.doc(`${uid}_${dateKey}`)));
        const CHUNK = 300;
        for (let i = 0; i < refs.length; i += CHUNK) {
            const docs = await db.getAll(...refs.slice(i, i + CHUNK));
            for (const doc of docs) {
                if (!doc.exists)
                    continue;
                const data = doc.data();
                const dateKey = String((_b = data.date) !== null && _b !== void 0 ? _b : "");
                const uid = uidFromDailyDocId(doc.id, dateKey);
                if (!uid || !pointsByUid.has(uid))
                    continue;
                pointsByUid.set(uid, ((_c = pointsByUid.get(uid)) !== null && _c !== void 0 ? _c : 0) + pickPoints(data, seasonKey));
            }
        }
    }
    const snapId = `${battleId}_${period}_${label}`;
    const prevRef = db.collection(SNAPSHOTS).doc(snapId);
    const prev = await prevRef.get();
    const prevRanks = new Map();
    if (prev.exists) {
        const rows = (_e = (_d = prev.data()) === null || _d === void 0 ? void 0 : _d.rows) !== null && _e !== void 0 ? _e : [];
        for (const r of rows)
            prevRanks.set(r.squadId, r.rank);
    }
    const rows = rankRows(squads.map((s) => {
        var _a;
        return ({
            squadId: s.id,
            name: s.name,
            memberCount: s.memberCount,
            memberScores: s.memberUids.map((uid) => {
                var _a;
                return ({
                    uid,
                    points: (_a = pointsByUid.get(uid)) !== null && _a !== void 0 ? _a : 0,
                });
            }),
            prevRank: (_a = prevRanks.get(s.id)) !== null && _a !== void 0 ? _a : null,
        });
    }));
    const graceEnd = (0, nbaPeriod_1.addDaysToDateKey)(endKey, GRACE_DAYS);
    const shouldFinal = todayKey > graceEnd;
    await prevRef.set({
        battleId,
        period,
        label,
        status: shouldFinal ? "final" : "live",
        range: { startKey, endKey },
        rows,
        builtAt: firestore_1.FieldValue.serverTimestamp(),
        finalizedAt: shouldFinal ? firestore_1.FieldValue.serverTimestamp() : null,
    }, { merge: true });
}
async function buildGroupBattlePeriodSnapshots() {
    var _a, _b, _c, _d, _e, _f;
    const db = (0, firestore_1.getFirestore)(firebase_1.admin.app());
    const todayKey = (0, nbaPeriod_1.dateKeyJST)(new Date());
    const snap = await db
        .collection(COLLECTION)
        .where("phase", "in", ["battle", "settling", "final"])
        .get();
    let built = 0;
    for (const doc of snap.docs) {
        const battle = doc.data();
        const weeklyLabels = Array.isArray(battle.weeklyLabels)
            ? battle.weeklyLabels.map(String)
            : [];
        const monthlyRange = ((_a = battle.monthlyRange) !== null && _a !== void 0 ? _a : {});
        for (const label of weeklyLabels) {
            const startKey = label;
            const endKey = (0, nbaPeriod_1.addDaysToDateKey)(label, 6);
            const rangeStart = String((_b = monthlyRange.startKey) !== null && _b !== void 0 ? _b : startKey);
            const rangeEnd = String((_c = monthlyRange.endKey) !== null && _c !== void 0 ? _c : endKey);
            const clippedStart = startKey < rangeStart ? rangeStart : startKey;
            const clippedEnd = endKey > rangeEnd ? rangeEnd : endKey;
            if (clippedStart > clippedEnd || clippedStart > todayKey)
                continue;
            await buildOne(doc.id, battle, "weekly", label, clippedStart, clippedEnd < todayKey ? clippedEnd : todayKey, todayKey);
            built += 1;
        }
        const mStart = String((_d = monthlyRange.startKey) !== null && _d !== void 0 ? _d : "");
        const mEnd = String((_e = monthlyRange.endKey) !== null && _e !== void 0 ? _e : "");
        const mLabel = String((_f = monthlyRange.label) !== null && _f !== void 0 ? _f : "battle");
        if (mStart && mEnd && mStart <= todayKey) {
            await buildOne(doc.id, battle, "monthly", mLabel, mStart, mEnd < todayKey ? mEnd : todayKey, todayKey);
            built += 1;
        }
    }
    console.log(`[buildGroupBattlePeriodSnapshots] built=${built}`);
    return built;
}
//# sourceMappingURL=buildGroupBattlePeriodSnapshots.js.map