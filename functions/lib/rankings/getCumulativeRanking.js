"use strict";
// functions/src/rankings/getCumulativeRanking.ts
// ランキング一覧は cumulative_ranking_snapshots をそのまま返す。
// 自分の順位は snapshotRanks / 一覧行の rank を参照（live count しない）。
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCumulativeRanking = void 0;
const https_1 = require("firebase-functions/v2/https");
const firestore_1 = require("firebase-admin/firestore");
const buildCumulativeRankingSnapshot_1 = require("./buildCumulativeRankingSnapshot");
const readSnapshotRanksFromCumulative_1 = require("./readSnapshotRanksFromCumulative");
const safeRankMetricNum_1 = require("./safeRankMetricNum");
const wcRankingStage_1 = require("./wcRankingStage");
function db() {
    return (0, firestore_1.getFirestore)();
}
const MIN_POSTS_FOR_WIN_RATE_BASE = 1;
function minPostsForWinRate(phase, round) {
    if (phase === "playoffs" && (round === "overall" || round === "r1")) {
        return 20;
    }
    return MIN_POSTS_FOR_WIN_RATE_BASE;
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
function isRankingPhase(v) {
    return v === "play_in" || v === "playoffs";
}
function isPlayoffRoundKey(v) {
    return (v === "overall" || v === "r1" || v === "r2" || v === "cf" || v === "finals");
}
function rankingSlice(d, phase, round = "overall") {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r;
    if (phase === "playoffs" && round !== "overall") {
        const byRound = (_a = d.rankingByPlayoffRound) === null || _a === void 0 ? void 0 : _a[round];
        if (byRound && typeof byRound === "object") {
            const tp = (_b = byRound.totalPosts) !== null && _b !== void 0 ? _b : 0;
            const tw = (_c = byRound.totalWins) !== null && _c !== void 0 ? _c : 0;
            return {
                totalPosts: tp,
                totalWins: tw,
                winRate: tp > 0 ? tw / tp : (_d = byRound.winRate) !== null && _d !== void 0 ? _d : 0,
                totalPoints: (_e = byRound.totalPoints) !== null && _e !== void 0 ? _e : 0,
                totalPrecision: (_f = byRound.totalPrecision) !== null && _f !== void 0 ? _f : 0,
                totalUpset: (_g = byRound.totalUpset) !== null && _g !== void 0 ? _g : 0,
                totalGoalScorerHits: (_h = byRound.totalGoalScorerHits) !== null && _h !== void 0 ? _h : 0,
            };
        }
    }
    const byPhase = (_j = d.rankingByPhase) === null || _j === void 0 ? void 0 : _j[phase];
    if (byPhase && typeof byPhase === "object") {
        const tp = (_k = byPhase.totalPosts) !== null && _k !== void 0 ? _k : 0;
        const tw = (_l = byPhase.totalWins) !== null && _l !== void 0 ? _l : 0;
        return {
            totalPosts: tp,
            totalWins: tw,
            winRate: tp > 0 ? tw / tp : (_m = byPhase.winRate) !== null && _m !== void 0 ? _m : 0,
            totalPoints: (_o = byPhase.totalPoints) !== null && _o !== void 0 ? _o : 0,
            totalPrecision: (_p = byPhase.totalPrecision) !== null && _p !== void 0 ? _p : 0,
            totalUpset: (_q = byPhase.totalUpset) !== null && _q !== void 0 ? _q : 0,
            totalGoalScorerHits: (_r = byPhase.totalGoalScorerHits) !== null && _r !== void 0 ? _r : 0,
        };
    }
    return {
        totalPosts: 0,
        totalWins: 0,
        winRate: 0,
        totalPoints: 0,
        totalPrecision: 0,
        totalUpset: 0,
        totalGoalScorerHits: 0,
    };
}
function rankingSliceWc(d, stage) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    const block = (_a = d.rankingByWcStage) === null || _a === void 0 ? void 0 : _a[stage];
    if (!block || typeof block !== "object") {
        return {
            totalPosts: 0,
            totalWins: 0,
            winRate: 0,
            totalPoints: 0,
            totalPrecision: 0,
            totalUpset: 0,
            totalGoalScorerHits: 0,
        };
    }
    const tp = (_b = block.totalPosts) !== null && _b !== void 0 ? _b : 0;
    const tw = (_c = block.totalWins) !== null && _c !== void 0 ? _c : 0;
    return {
        totalPosts: tp,
        totalWins: tw,
        winRate: tp > 0 ? tw / tp : (_d = block.winRate) !== null && _d !== void 0 ? _d : 0,
        totalPoints: (_e = block.totalPoints) !== null && _e !== void 0 ? _e : 0,
        totalPrecision: (_f = block.totalPrecision) !== null && _f !== void 0 ? _f : 0,
        totalUpset: (_g = block.totalUpset) !== null && _g !== void 0 ? _g : 0,
        totalGoalScorerHits: (_h = block.totalGoalScorerHits) !== null && _h !== void 0 ? _h : 0,
    };
}
function activeBasketballStreak(d) {
    var _a, _b, _c, _d, _e;
    const signed = (_e = (_d = (_c = (_a = d.activeWinStreakBasketball) !== null && _a !== void 0 ? _a : (_b = d.streakBySport) === null || _b === void 0 ? void 0 : _b.basketball) !== null && _c !== void 0 ? _c : d.currentStreak) !== null && _d !== void 0 ? _d : d.activeWinStreak) !== null && _e !== void 0 ? _e : 0;
    return typeof signed === "number" && signed > 0 ? signed : 0;
}
function activeFootballStreak(d) {
    var _a, _b, _c, _d;
    const signed = (_d = (_c = (_a = d.activeWinStreakFootball) !== null && _a !== void 0 ? _a : (_b = d.streakBySport) === null || _b === void 0 ? void 0 : _b.football) !== null && _c !== void 0 ? _c : d.streakFootball) !== null && _d !== void 0 ? _d : 0;
    return typeof signed === "number" && signed > 0 ? signed : 0;
}
function activeFootballStreakForWcStage(d, wcStage) {
    var _a, _b, _c;
    if (wcStage === "qualifying" || wcStage === "main") {
        const byStage = ((_a = d.activeWinStreakByWcStage) !== null && _a !== void 0 ? _a : {});
        const live = byStage[wcStage];
        if (typeof live === "number" && live > 0)
            return live;
        const nested = (_c = (_b = d.rankingByWcStage) === null || _b === void 0 ? void 0 : _b[wcStage]) === null || _c === void 0 ? void 0 : _c.activeWinStreak;
        if (typeof nested === "number" && nested > 0)
            return nested;
    }
    return activeFootballStreak(d);
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
function readStoredRankFromUser(me, metric, phase, round, wcStage) {
    return (0, readSnapshotRanksFromCumulative_1.readStoredRankFromUser)(me, metric, phase, round, wcStage);
}
function readPriorRankFromHist(histSnap, metric, phase, round, wcStage) {
    var _a, _b, _c, _d, _e;
    if (!(histSnap === null || histSnap === void 0 ? void 0 : histSnap.exists))
        return undefined;
    const hd = histSnap.data();
    if (wcStage) {
        return (_b = (_a = hd.wc) === null || _a === void 0 ? void 0 : _a[wcStage]) === null || _b === void 0 ? void 0 : _b[metric];
    }
    if (phase === "playoffs" && round !== "overall") {
        return (_d = (_c = hd.playoffRounds) === null || _c === void 0 ? void 0 : _c[round]) === null || _d === void 0 ? void 0 : _d[metric];
    }
    return (_e = hd[phase]) === null || _e === void 0 ? void 0 : _e[metric];
}
function buildMyRowFromStats(uid, me, rk, opts) {
    var _a, _b, _c, _d, _e, _f, _g;
    const streak = opts.wcStage
        ? activeFootballStreakForWcStage(me, opts.wcStage)
        : activeBasketballStreak(me);
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
        activeWinStreak: streak,
        rank: (_g = opts.myRank) !== null && _g !== void 0 ? _g : 0,
        rankDeltaPlaces: opts.myRankDeltaPlaces,
    };
}
async function personalRankingPayloadForMetric(metric, phase, round, uid, snaps, wcStage) {
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
    const rk = wcStage
        ? rankingSliceWc(me, wcStage)
        : rankingSlice(me, phase, round);
    const minPosts = metric === "winRate"
        ? wcStage
            ? (0, wcRankingStage_1.minPostsForWcWinRate)(wcStage)
            : minPostsForWinRate(phase, round)
        : 1;
    if (((_b = rk.totalPosts) !== null && _b !== void 0 ? _b : 0) < minPosts) {
        return {
            count: 0,
            rows: [],
            myRank: null,
            myRow: null,
            myRankDeltaPlaces: null,
        };
    }
    const myRank = readStoredRankFromUser(me, metric, phase, round, wcStage !== null && wcStage !== void 0 ? wcStage : null);
    const myRankDeltaPlaces = rankDeltaPlacesFromHist(snaps.histSnap, myRank, readPriorRankFromHist(snaps.histSnap, metric, phase, round, wcStage !== null && wcStage !== void 0 ? wcStage : null));
    const myRow = buildMyRowFromStats(uid, me, rk, {
        wcStage: wcStage !== null && wcStage !== void 0 ? wcStage : null,
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
async function rankingPayloadForMetric(metric, phase, round, uid, snaps, wcStage, personalOnly = false) {
    var _a, _b, _c, _d, _e;
    if (personalOnly && uid) {
        return personalRankingPayloadForMetric(metric, phase, round, uid, snaps, wcStage);
    }
    const snapshotDocId = wcStage
        ? `wc_${wcStage}_${metric}`
        : round === "overall"
            ? `${phase}_${metric}`
            : `${phase}_${round}_${metric}`;
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
    /** スナップショット未生成時のみ live フォールバック */
    /** 連勝は 16:00 スナップショットのみ（live フォールバックなし） */
    if (rows.length === 0 && wcStage && metric !== "activeWinStreak") {
        const live = await (0, buildCumulativeRankingSnapshot_1.loadWcStageTop20RowsLive)(wcStage, metric);
        rows = normalizeSnapshotRows(live.rows, metric);
        totalCount = live.totalCount;
    }
    if (rows.length === 0 &&
        metric !== "activeWinStreak" &&
        !wcStage &&
        phase === "playoffs" &&
        round !== "overall" &&
        (round === "r1" || round === "r2" || round === "cf" || round === "finals")) {
        const live = await (0, buildCumulativeRankingSnapshot_1.loadPlayoffRoundTop20RowsLive)(round, metric);
        rows = normalizeSnapshotRows(live.rows, metric);
        totalCount = live.totalCount;
    }
    let myRank = null;
    let myRow = null;
    let myRankDeltaPlaces = null;
    if (uid && ((_c = snaps.mySnap) === null || _c === void 0 ? void 0 : _c.exists)) {
        const me = snaps.mySnap.data();
        const rk = wcStage
            ? rankingSliceWc(me, wcStage)
            : rankingSlice(me, phase, round);
        const minPosts = metric === "winRate"
            ? wcStage
                ? (0, wcRankingStage_1.minPostsForWcWinRate)(wcStage)
                : minPostsForWinRate(phase, round)
            : 1;
        if (((_d = rk.totalPosts) !== null && _d !== void 0 ? _d : 0) < minPosts) {
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
            myRank = readStoredRankFromUser(me, metric, phase, round, wcStage !== null && wcStage !== void 0 ? wcStage : null);
            myRankDeltaPlaces = rankDeltaPlacesFromHist(snaps.histSnap, myRank, readPriorRankFromHist(snaps.histSnap, metric, phase, round, wcStage !== null && wcStage !== void 0 ? wcStage : null));
        }
        myRow = buildMyRowFromStats(uid, me, rk, {
            wcStage: wcStage !== null && wcStage !== void 0 ? wcStage : null,
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
        const rawPhase = req.query.phase;
        const phase = isRankingPhase(rawPhase) ? rawPhase : "playoffs";
        const rawRound = req.query.round;
        const round = isPlayoffRoundKey(rawRound)
            ? rawRound
            : "overall";
        const rawWcStage = req.query.wcStage;
        const wcStage = (0, wcRankingStage_1.isWcRankingStage)(rawWcStage) ? rawWcStage : null;
        const bulkMetrics = parseMetricsParam(req.query.metrics);
        const personalOnly = req.query.personalOnly === "1" || req.query.personalOnly === "true";
        if (bulkMetrics) {
            const snaps = uid ? await loadUserRankingSnaps(uid) : EMPTY_USER_SNAPS;
            const byMetric = {};
            const payloads = await Promise.all(bulkMetrics.map((m) => rankingPayloadForMetric(m, phase, round, uid, snaps, wcStage, personalOnly)));
            bulkMetrics.forEach((m, i) => {
                byMetric[m] = payloads[i];
            });
            res.status(200).json({
                ok: true,
                phase,
                round,
                wcStage,
                byMetric,
            });
            return;
        }
        const rawMetric = req.query.metric;
        const metric = isMetric(rawMetric) ? rawMetric : "totalPoints";
        const snaps = uid ? await loadUserRankingSnaps(uid) : EMPTY_USER_SNAPS;
        const payload = await rankingPayloadForMetric(metric, phase, round, uid, snaps, wcStage, personalOnly);
        res.status(200).json({
            ok: true,
            metric,
            phase,
            round,
            wcStage,
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