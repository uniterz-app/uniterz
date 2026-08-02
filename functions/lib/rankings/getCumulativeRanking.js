"use strict";
// functions/src/rankings/getCumulativeRanking.ts
// ランキング一覧は cumulative_ranking_snapshots をそのまま返す。
// NBA 現行シーズン（s<key>_<metric>）のみ。
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCumulativeRanking = void 0;
const https_1 = require("firebase-functions/v2/https");
const firestore_1 = require("firebase-admin/firestore");
const buildCumulativeRankingSnapshot_1 = require("./buildCumulativeRankingSnapshot");
const readSnapshotRanksFromCumulative_1 = require("./readSnapshotRanksFromCumulative");
const safeRankMetricNum_1 = require("./safeRankMetricNum");
const nbaSeason_1 = require("./nbaSeason");
function db() {
    return (0, firestore_1.getFirestore)();
}
function isMetric(v) {
    return (v === "winRate" ||
        v === "totalPoints" ||
        v === "totalPrecision" ||
        v === "totalExactHits" ||
        v === "totalUpset" ||
        v === "activeWinStreak" ||
        v === "totalGoalScorerHits");
}
function activeBasketballStreak(d) {
    var _a, _b, _c, _d, _e;
    const signed = (_e = (_d = (_c = (_a = d.activeWinStreakBasketball) !== null && _a !== void 0 ? _a : (_b = d.streakBySport) === null || _b === void 0 ? void 0 : _b.basketball) !== null && _c !== void 0 ? _c : d.currentStreak) !== null && _d !== void 0 ? _d : d.activeWinStreak) !== null && _e !== void 0 ? _e : 0;
    return typeof signed === "number" && signed > 0 ? signed : 0;
}
const EMPTY_USER_SNAPS = { mySnap: null, histSnap: null };
async function loadLatestHistSnapForUid(uid) {
    const firestore = db();
    let key = (0, buildCumulativeRankingSnapshot_1.getYesterdayDateKeyJST)();
    for (let i = 0; i < buildCumulativeRankingSnapshot_1.RANK_DELTA_PRIOR_MAX_LOOKBACK_DAYS; i++) {
        const snap = await firestore
            .collection("cumulative_stats")
            .doc(uid)
            .collection(buildCumulativeRankingSnapshot_1.RANK_SNAPSHOT_HISTORY_SUBCOL)
            .doc(key)
            .get();
        if (snap.exists)
            return snap;
        key = (0, buildCumulativeRankingSnapshot_1.subtractOneDayFromDateKeyJST)(key);
    }
    return null;
}
async function loadUserRankingSnaps(uid) {
    if (!uid)
        return EMPTY_USER_SNAPS;
    const mySnap = await db().collection("cumulative_stats").doc(uid).get();
    if (!mySnap.exists)
        return { mySnap, histSnap: null };
    const histSnap = await loadLatestHistSnapForUid(uid);
    return { mySnap, histSnap };
}
function parseMetricsParam(raw) {
    if (typeof raw !== "string" || !raw.trim())
        return null;
    const parts = raw.split(",").map((s) => s.trim()).filter(Boolean);
    const out = [];
    for (const p of parts) {
        if (isMetric(p))
            out.push(p);
    }
    if (out.length === 0)
        return null;
    return [...new Set(out)];
}
function readSnapshotTotalCount(snapData, fallback) {
    const raw = snapData === null || snapData === void 0 ? void 0 : snapData.totalCount;
    return typeof raw === "number" && Number.isFinite(raw) && raw >= 0
        ? Math.floor(raw)
        : fallback;
}
function resolveParticipantCount(totalCount, myRank) {
    if (myRank != null && myRank > totalCount)
        return myRank;
    return totalCount;
}
function rankDeltaPlacesFromHist(histSnap, myRank, prevRankRaw) {
    if (!(histSnap === null || histSnap === void 0 ? void 0 : histSnap.exists) || myRank == null)
        return null;
    const prevRank = typeof prevRankRaw === "number" &&
        Number.isFinite(prevRankRaw) &&
        prevRankRaw >= 1
        ? Math.floor(prevRankRaw)
        : null;
    if (prevRank == null)
        return null;
    const d = prevRank - myRank;
    return d !== 0 ? d : null;
}
function normalizePlan(plan) {
    return plan === "pro" ? "pro" : "free";
}
function rowMetricValue(row, metric) {
    var _a;
    if (metric === "activeWinStreak")
        return (0, safeRankMetricNum_1.safeRankMetricNum)(row.activeWinStreak);
    if (metric === "winRate")
        return (0, safeRankMetricNum_1.safeRankMetricNum)(row.winRate);
    if (metric === "totalPoints")
        return (0, safeRankMetricNum_1.safeRankMetricNum)(row.totalPoints);
    if (metric === "totalExactHits")
        return (0, safeRankMetricNum_1.safeRankMetricNum)((_a = row.totalExactHits) !== null && _a !== void 0 ? _a : row.totalPrecision);
    if (metric === "totalPrecision")
        return (0, safeRankMetricNum_1.safeRankMetricNum)(row.totalPrecision);
    if (metric === "totalGoalScorerHits")
        return (0, safeRankMetricNum_1.safeRankMetricNum)(row.totalGoalScorerHits);
    return (0, safeRankMetricNum_1.safeRankMetricNum)(row.totalUpset);
}
/** Same ordering as buildCumulativeRankingSnapshot `cmpSortRows`. */
function cmpRankingRows(a, b, metric) {
    var _a, _b;
    const diff = rowMetricValue(b, metric) - rowMetricValue(a, metric);
    if (diff !== 0)
        return diff;
    if (metric === "winRate") {
        const postsDiff = ((_a = b.totalPosts) !== null && _a !== void 0 ? _a : 0) - ((_b = a.totalPosts) !== null && _b !== void 0 ? _b : 0);
        if (postsDiff !== 0)
            return postsDiff;
    }
    return (0, safeRankMetricNum_1.safeRankMetricNum)(b.totalPoints) - (0, safeRankMetricNum_1.safeRankMetricNum)(a.totalPoints);
}
function sortSnapshotRows(rows, metric) {
    return [...rows].sort((a, b) => cmpRankingRows(a, b, metric));
}
function normalizeSnapshotRows(rows, metric) {
    let out = rows.map((row) => (Object.assign(Object.assign({}, row), { plan: normalizePlan(row.plan) })));
    if (metric === "totalExactHits") {
        out = out.map((r) => {
            var _a, _b;
            return (Object.assign(Object.assign({}, r), { totalExactHits: (_b = (_a = r.totalExactHits) !== null && _a !== void 0 ? _a : r.totalPrecision) !== null && _b !== void 0 ? _b : 0 }));
        });
    }
    return sortSnapshotRows(out, metric);
}
function minPostsForMetric(metric) {
    if (metric !== "winRate")
        return 1;
    return buildCumulativeRankingSnapshot_1.NBA_SEASON_WIN_RATE_MIN_POSTS;
}
function readPriorRankFromHist(histSnap, metric) {
    var _a, _b;
    if (!(histSnap === null || histSnap === void 0 ? void 0 : histSnap.exists))
        return undefined;
    const hd = histSnap.data();
    return (_b = (_a = hd.seasons) === null || _a === void 0 ? void 0 : _a[nbaSeason_1.CURRENT_NBA_SEASON_KEY]) === null || _b === void 0 ? void 0 : _b[metric];
}
function buildMyRowFromStats(uid, me, rk, opts) {
    var _a, _b, _c, _d, _e, _f, _g;
    return {
        uid,
        displayName: String((_a = me.displayName) !== null && _a !== void 0 ? _a : ""),
        handle: (_b = me.handle) !== null && _b !== void 0 ? _b : null,
        photoURL: (_c = me.photoURL) !== null && _c !== void 0 ? _c : null,
        countryCode: (_d = me.countryCode) !== null && _d !== void 0 ? _d : null,
        plan: me.plan === "pro" ? "pro" : "free",
        totalPosts: rk.totalPosts,
        totalWins: rk.totalWins,
        winRate: rk.winRate,
        totalPoints: rk.totalPoints,
        totalPrecision: rk.totalPrecision,
        totalExactHits: opts.metric === "totalExactHits" ? (_e = rk.totalPrecision) !== null && _e !== void 0 ? _e : 0 : undefined,
        totalUpset: rk.totalUpset,
        totalGoalScorerHits: (_f = rk.totalGoalScorerHits) !== null && _f !== void 0 ? _f : 0,
        activeWinStreak: activeBasketballStreak(me),
        rank: (_g = opts.myRank) !== null && _g !== void 0 ? _g : 0,
        rankDeltaPlaces: opts.myRankDeltaPlaces,
    };
}
async function personalRankingPayloadForMetric(metric, uid, snaps) {
    var _a, _b;
    if (!((_a = snaps.mySnap) === null || _a === void 0 ? void 0 : _a.exists)) {
        return {
            count: 0,
            rows: [],
            myRank: null,
            myRow: null,
            myRankDeltaPlaces: null,
        };
    }
    const me = snaps.mySnap.data();
    const rk = (0, buildCumulativeRankingSnapshot_1.nbaSeasonRankingSlice)(me);
    if (((_b = rk.totalPosts) !== null && _b !== void 0 ? _b : 0) < minPostsForMetric(metric)) {
        return {
            count: 0,
            rows: [],
            myRank: null,
            myRow: null,
            myRankDeltaPlaces: null,
        };
    }
    const myRank = (0, readSnapshotRanksFromCumulative_1.readStoredRankFromUser)(me, metric);
    const myRankDeltaPlaces = rankDeltaPlacesFromHist(snaps.histSnap, myRank, readPriorRankFromHist(snaps.histSnap, metric));
    const myRow = buildMyRowFromStats(uid, me, rk, {
        metric,
        myRank,
        myRankDeltaPlaces,
    });
    return {
        count: 0,
        rows: [],
        myRank,
        myRow,
        myRankDeltaPlaces,
    };
}
async function rankingPayloadForMetric(metric, uid, snaps, personalOnly = false) {
    var _a, _b, _c, _d, _e;
    if (personalOnly && uid) {
        return personalRankingPayloadForMetric(metric, uid, snaps);
    }
    const snapshotDocId = (0, nbaSeason_1.nbaSeasonSnapshotDocId)(nbaSeason_1.CURRENT_NBA_SEASON_KEY, metric);
    const snapDoc = await db()
        .collection("cumulative_ranking_snapshots")
        .doc(snapshotDocId)
        .get();
    const snapData = snapDoc.exists
        ? snapDoc.data()
        : undefined;
    const rawRows = snapDoc.exists
        ? ((_b = (_a = snapDoc.data()) === null || _a === void 0 ? void 0 : _a.rows) !== null && _b !== void 0 ? _b : [])
        : [];
    let rows = normalizeSnapshotRows(rawRows, metric);
    let totalCount = readSnapshotTotalCount(snapData, rows.length);
    if (rows.length === 0 && metric !== "activeWinStreak") {
        console.warn(`[getCumulativeRanking] empty snapshot ${snapshotDocId}; skip live full-scan fallback`);
    }
    let myRank = null;
    let myRow = null;
    let myRankDeltaPlaces = null;
    if (uid && ((_c = snaps.mySnap) === null || _c === void 0 ? void 0 : _c.exists)) {
        const me = snaps.mySnap.data();
        const rk = (0, buildCumulativeRankingSnapshot_1.nbaSeasonRankingSlice)(me);
        if (((_d = rk.totalPosts) !== null && _d !== void 0 ? _d : 0) < minPostsForMetric(metric)) {
            return {
                count: resolveParticipantCount(totalCount, null),
                rows,
                myRank: null,
                myRow: null,
                myRankDeltaPlaces: null,
            };
        }
        const listRow = rows.find((r) => r.uid === uid);
        if (listRow) {
            myRank = listRow.rank;
            myRankDeltaPlaces = (_e = listRow.rankDeltaPlaces) !== null && _e !== void 0 ? _e : null;
        }
        else {
            myRank = (0, readSnapshotRanksFromCumulative_1.readStoredRankFromUser)(me, metric);
            myRankDeltaPlaces = rankDeltaPlacesFromHist(snaps.histSnap, myRank, readPriorRankFromHist(snaps.histSnap, metric));
        }
        myRow = buildMyRowFromStats(uid, me, rk, {
            metric,
            myRank,
            myRankDeltaPlaces,
        });
    }
    return {
        count: resolveParticipantCount(totalCount, myRank),
        rows,
        myRank,
        myRow,
        myRankDeltaPlaces,
    };
}
exports.getCumulativeRanking = (0, https_1.onRequest)(async (req, res) => {
    var _a;
    try {
        const uid = req.query.uid;
        // phase / round / wcStage パラメータは旧 UI 互換のため受け取るが無視する
        // （NBA は常に現行シーズン s<key>_<metric> を返す）。
        const bulkMetrics = parseMetricsParam(req.query.metrics);
        const personalOnly = req.query.personalOnly === "1" || req.query.personalOnly === "true";
        if (bulkMetrics) {
            const snaps = uid ? await loadUserRankingSnaps(uid) : EMPTY_USER_SNAPS;
            const byMetric = {};
            const payloads = await Promise.all(bulkMetrics.map((m) => rankingPayloadForMetric(m, uid, snaps, personalOnly)));
            bulkMetrics.forEach((m, i) => {
                byMetric[m] = payloads[i];
            });
            res.status(200).json({
                ok: true,
                seasonKey: nbaSeason_1.CURRENT_NBA_SEASON_KEY,
                wcStage: null,
                byMetric,
            });
            return;
        }
        const rawMetric = req.query.metric;
        const metric = isMetric(rawMetric) ? rawMetric : "totalPoints";
        const snaps = uid ? await loadUserRankingSnaps(uid) : EMPTY_USER_SNAPS;
        const payload = await rankingPayloadForMetric(metric, uid, snaps, personalOnly);
        res.status(200).json({
            ok: true,
            metric,
            seasonKey: nbaSeason_1.CURRENT_NBA_SEASON_KEY,
            wcStage: null,
            count: payload.count,
            rows: payload.rows,
            myRank: payload.myRank,
            myRow: payload.myRow,
            myRankDeltaPlaces: payload.myRankDeltaPlaces,
        });
        return;
    }
    catch (e) {
        res.status(500).json({
            ok: false,
            error: (_a = e === null || e === void 0 ? void 0 : e.message) !== null && _a !== void 0 ? _a : "unknown error",
        });
        return;
    }
});
//# sourceMappingURL=getCumulativeRanking.js.map