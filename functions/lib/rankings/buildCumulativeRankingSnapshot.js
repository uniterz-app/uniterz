"use strict";
// functions/src/rankings/buildCumulativeRankingSnapshot.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.RANK_SNAPSHOT_HISTORY_SUBCOL = void 0;
exports.getYesterdayDateKeyJST = getYesterdayDateKeyJST;
exports.buildCumulativeRankingSnapshot = buildCumulativeRankingSnapshot;
const firestore_1 = require("firebase-admin/firestore");
/* =========================================================
 * Firestore
 * =======================================================*/
function db() {
    return (0, firestore_1.getFirestore)();
}
const METRICS = [
    "totalPoints",
    "winRate",
    "totalPrecision",
    "totalUpset",
    "activeWinStreak",
];
const RANKING_PHASES = ["play_in", "playoffs"];
/** Client: list cumulative_stats/{uid}/rankSnapshotHistory ordered by dateKey. */
exports.RANK_SNAPSHOT_HISTORY_SUBCOL = "rankSnapshotHistory";
function toDateKeyJST(d) {
    const j = new Date(d.getTime() + 9 * 60 * 60 * 1000);
    const y = j.getUTCFullYear();
    const m = String(j.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(j.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${dd}`;
}
function getTodayJST(now = new Date()) {
    return toDateKeyJST(now);
}
/** JST の「昨日」の dateKey（履歴 doc id と一致） */
function getYesterdayDateKeyJST(now = new Date()) {
    const todayKey = getTodayJST(now);
    const [y, m, d] = todayKey.split("-").map(Number);
    const prev = new Date(Date.UTC(y, m - 1, d - 1));
    const yy = prev.getUTCFullYear();
    const mm = String(prev.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(prev.getUTCDate()).padStart(2, "0");
    return `${yy}-${mm}-${dd}`;
}
/* =========================================================
 * Utils
 * =======================================================*/
/** Leaderboard slice: prefer `rankingByPhase[phase]` when `phase` is set. */
function rankingSlice(d, phase) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u;
    if (phase) {
        const byPhase = (_a = d.rankingByPhase) === null || _a === void 0 ? void 0 : _a[phase];
        if (byPhase && typeof byPhase === "object") {
            const tp = (_b = byPhase.totalPosts) !== null && _b !== void 0 ? _b : 0;
            const tw = (_c = byPhase.totalWins) !== null && _c !== void 0 ? _c : 0;
            return {
                totalPosts: tp,
                totalWins: tw,
                winRate: tp > 0 ? tw / tp : (_d = byPhase.winRate) !== null && _d !== void 0 ? _d : 0,
                totalPoints: (_e = byPhase.totalPoints) !== null && _e !== void 0 ? _e : 0,
                totalPrecision: (_f = byPhase.totalPrecision) !== null && _f !== void 0 ? _f : 0,
                totalUpset: (_g = byPhase.totalUpset) !== null && _g !== void 0 ? _g : 0,
            };
        }
        return {
            totalPosts: 0,
            totalWins: 0,
            winRate: 0,
            totalPoints: 0,
            totalPrecision: 0,
            totalUpset: 0,
        };
    }
    const rk = d.ranking;
    if (rk && typeof rk === "object") {
        const tp = (_h = rk.totalPosts) !== null && _h !== void 0 ? _h : 0;
        const tw = (_j = rk.totalWins) !== null && _j !== void 0 ? _j : 0;
        return {
            totalPosts: tp,
            totalWins: tw,
            winRate: tp > 0 ? tw / tp : (_k = rk.winRate) !== null && _k !== void 0 ? _k : 0,
            totalPoints: (_l = rk.totalPoints) !== null && _l !== void 0 ? _l : 0,
            totalPrecision: (_m = rk.totalPrecision) !== null && _m !== void 0 ? _m : 0,
            totalUpset: (_o = rk.totalUpset) !== null && _o !== void 0 ? _o : 0,
        };
    }
    const totalPosts = (_p = d.totalPosts) !== null && _p !== void 0 ? _p : 0;
    const totalWins = (_q = d.totalWins) !== null && _q !== void 0 ? _q : 0;
    return {
        totalPosts,
        totalWins,
        winRate: (_r = d.winRate) !== null && _r !== void 0 ? _r : 0,
        totalPoints: (_s = d.totalPoints) !== null && _s !== void 0 ? _s : 0,
        totalPrecision: (_t = d.totalPrecision) !== null && _t !== void 0 ? _t : 0,
        totalUpset: (_u = d.totalUpset) !== null && _u !== void 0 ? _u : 0,
    };
}
function getValue(d, metric, phase) {
    var _a, _b, _c, _d, _e;
    if (metric === "activeWinStreak")
        return (_a = d.activeWinStreak) !== null && _a !== void 0 ? _a : 0;
    const r = rankingSlice(d, phase);
    if (metric === "winRate")
        return (_b = r.winRate) !== null && _b !== void 0 ? _b : 0;
    if (metric === "totalPoints")
        return (_c = r.totalPoints) !== null && _c !== void 0 ? _c : 0;
    if (metric === "totalPrecision")
        return (_d = r.totalPrecision) !== null && _d !== void 0 ? _d : 0;
    return (_e = r.totalUpset) !== null && _e !== void 0 ? _e : 0;
}
function getRowMetricValue(row, metric) {
    var _a, _b, _c, _d, _e;
    if (metric === "activeWinStreak")
        return (_a = row.activeWinStreak) !== null && _a !== void 0 ? _a : 0;
    if (metric === "winRate")
        return (_b = row.winRate) !== null && _b !== void 0 ? _b : 0;
    if (metric === "totalPoints")
        return (_c = row.totalPoints) !== null && _c !== void 0 ? _c : 0;
    if (metric === "totalPrecision")
        return (_d = row.totalPrecision) !== null && _d !== void 0 ? _d : 0;
    return (_e = row.totalUpset) !== null && _e !== void 0 ? _e : 0;
}
/** Same ordering as snapshot sort (desc). Returns 0 when tied for rank. */
function cmpSortRows(a, b, metric) {
    var _a, _b, _c, _d;
    const diff = getRowMetricValue(b, metric) - getRowMetricValue(a, metric);
    if (diff !== 0)
        return diff;
    if (metric === "winRate") {
        const postsDiff = ((_a = b.totalPosts) !== null && _a !== void 0 ? _a : 0) - ((_b = a.totalPosts) !== null && _b !== void 0 ? _b : 0);
        if (postsDiff !== 0)
            return postsDiff;
    }
    return ((_c = b.totalPoints) !== null && _c !== void 0 ? _c : 0) - ((_d = a.totalPoints) !== null && _d !== void 0 ? _d : 0);
}
/** Matches getCumulativeRanking: rank = 1 + #{ strictly better values }. */
function assignCompetitionRanks(sorted, metric) {
    const out = new Map();
    let rank = 1;
    for (let i = 0; i < sorted.length; i++) {
        if (i > 0 &&
            cmpSortRows(sorted[i - 1], sorted[i], metric) !== 0) {
            rank = i + 1;
        }
        out.set(sorted[i].uid, rank);
    }
    return out;
}
function computeRankDeltaPlaces(prevRank, currentRank) {
    if (prevRank == null || currentRank < 1)
        return null;
    const d = prevRank - currentRank;
    if (d === 0)
        return null;
    return d;
}
async function fetchYesterdayRanksForUids(uids, yesterdayKey) {
    const out = new Map();
    if (uids.length === 0)
        return out;
    const firestore = db();
    const CHUNK = 200;
    for (let i = 0; i < uids.length; i += CHUNK) {
        const chunk = uids.slice(i, i + CHUNK);
        const refs = chunk.map((uid) => firestore
            .collection("cumulative_stats")
            .doc(uid)
            .collection(exports.RANK_SNAPSHOT_HISTORY_SUBCOL)
            .doc(yesterdayKey));
        const snaps = await firestore.getAll(...refs);
        snaps.forEach((s, j) => {
            var _a, _b;
            const uid = chunk[j];
            if (!s.exists) {
                out.set(uid, null);
                return;
            }
            const d = s.data();
            out.set(uid, {
                play_in: ((_a = d === null || d === void 0 ? void 0 : d.play_in) !== null && _a !== void 0 ? _a : {}),
                playoffs: ((_b = d === null || d === void 0 ? void 0 : d.playoffs) !== null && _b !== void 0 ? _b : {}),
            });
        });
    }
    return out;
}
/* =========================================================
 * Main
 * =======================================================*/
async function buildCumulativeRankingSnapshot() {
    const snap = await db().collection("cumulative_stats").get();
    const rankByUid = new Map();
    function ensure(uid) {
        if (!rankByUid.has(uid)) {
            rankByUid.set(uid, { play_in: {}, playoffs: {} });
        }
        return rankByUid.get(uid);
    }
    const top20Jobs = [];
    const topUidSet = new Set();
    for (const phase of RANKING_PHASES) {
        const baseRows = snap.docs
            .map((doc) => {
            var _a, _b, _c, _d, _e;
            const d = doc.data();
            const r = rankingSlice(d, phase);
            return {
                uid: doc.id,
                displayName: (_a = d.displayName) !== null && _a !== void 0 ? _a : "user",
                handle: (_b = d.handle) !== null && _b !== void 0 ? _b : null,
                photoURL: (_c = d.photoURL) !== null && _c !== void 0 ? _c : null,
                countryCode: (_d = d.countryCode) !== null && _d !== void 0 ? _d : null,
                plan: (d.plan === "pro" ? "pro" : "free"),
                totalPosts: r.totalPosts,
                totalWins: r.totalWins,
                winRate: r.winRate,
                totalPoints: r.totalPoints,
                totalPrecision: r.totalPrecision,
                totalUpset: r.totalUpset,
                activeWinStreak: (_e = d.activeWinStreak) !== null && _e !== void 0 ? _e : 0,
            };
        })
            .filter((row) => { var _a; return ((_a = row.totalPosts) !== null && _a !== void 0 ? _a : 0) > 0; });
        for (const metric of METRICS) {
            const sortedFull = [...baseRows].sort((a, b) => cmpSortRows(a, b, metric));
            const ranks = assignCompetitionRanks(sortedFull, metric);
            for (const [uid, rank] of ranks) {
                ensure(uid)[phase][metric] = rank;
            }
            const top20 = sortedFull.slice(0, 20).map((row) => {
                var _a;
                return (Object.assign(Object.assign({}, row), { rank: (_a = ranks.get(row.uid)) !== null && _a !== void 0 ? _a : 0 }));
            });
            for (const r of top20) {
                topUidSet.add(r.uid);
            }
            top20Jobs.push({ phase, metric, rows: top20 });
        }
    }
    const yesterdayKey = getYesterdayDateKeyJST();
    const prevByUid = await fetchYesterdayRanksForUids([...topUidSet], yesterdayKey);
    for (const { phase, metric, rows } of top20Jobs) {
        const enriched = rows.map((row) => {
            var _a;
            const prevBlock = prevByUid.get(row.uid);
            const prevRaw = (_a = prevBlock === null || prevBlock === void 0 ? void 0 : prevBlock[phase]) === null || _a === void 0 ? void 0 : _a[metric];
            const prevRank = typeof prevRaw === "number" &&
                Number.isFinite(prevRaw) &&
                prevRaw >= 1
                ? Math.floor(prevRaw)
                : null;
            return Object.assign(Object.assign({}, row), { rankDeltaPlaces: computeRankDeltaPlaces(prevRank, row.rank) });
        });
        await db()
            .collection("cumulative_ranking_snapshots")
            .doc(`${phase}_${metric}`)
            .set({
            phase,
            metric,
            rows: enriched,
            updatedAt: firestore_1.FieldValue.serverTimestamp(),
            rankDeltaBasisDateKey: yesterdayKey,
        }, { merge: true });
    }
    const firestore = db();
    const dateKey = getTodayJST();
    let batch = firestore.batch();
    let ops = 0;
    const flush = async () => {
        if (ops > 0) {
            await batch.commit();
            batch = firestore.batch();
            ops = 0;
        }
    };
    for (const [uid, per] of rankByUid) {
        batch.set(firestore.doc(`cumulative_stats/${uid}`), {
            snapshotRanks: {
                updatedAt: firestore_1.FieldValue.serverTimestamp(),
                play_in: per.play_in,
                playoffs: per.playoffs,
            },
        }, { merge: true });
        batch.set(firestore
            .collection("cumulative_stats")
            .doc(uid)
            .collection(exports.RANK_SNAPSHOT_HISTORY_SUBCOL)
            .doc(dateKey), {
            dateKey,
            play_in: per.play_in,
            playoffs: per.playoffs,
            writtenAt: firestore_1.FieldValue.serverTimestamp(),
        });
        ops += 2;
        if (ops >= 500) {
            await flush();
        }
    }
    await flush();
    return {
        ok: true,
        metrics: METRICS.length,
        ranksWritten: rankByUid.size,
        historyDateKey: dateKey,
        rankDeltaBasisDateKey: yesterdayKey,
    };
}
//# sourceMappingURL=buildCumulativeRankingSnapshot.js.map