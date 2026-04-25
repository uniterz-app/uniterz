"use strict";
// functions/src/rankings/getCumulativeRanking.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCumulativeRanking = void 0;
const https_1 = require("firebase-functions/v2/https");
const firestore_1 = require("firebase-admin/firestore");
const buildCumulativeRankingSnapshot_1 = require("./buildCumulativeRankingSnapshot");
function db() {
    return (0, firestore_1.getFirestore)();
}
const MIN_POSTS_FOR_WIN_RATE = 15;
function isMetric(v) {
    return (v === "winRate" ||
        v === "totalPoints" ||
        v === "totalPrecision" ||
        v === "totalUpset" ||
        v === "activeWinStreak");
}
function isRankingPhase(v) {
    return v === "play_in" || v === "playoffs";
}
function isPlayoffRoundKey(v) {
    return (v === "overall" || v === "r1" || v === "r2" || v === "cf" || v === "finals");
}
function isPhaseSnapshotBuiltDaily(phase) {
    return buildCumulativeRankingSnapshot_1.SNAPSHOT_BUILD_PHASES.includes(phase);
}
function rankingSlice(d, phase, round = "overall") {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p;
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
            };
        }
    }
    const byPhase = (_h = d.rankingByPhase) === null || _h === void 0 ? void 0 : _h[phase];
    if (byPhase && typeof byPhase === "object") {
        const tp = (_j = byPhase.totalPosts) !== null && _j !== void 0 ? _j : 0;
        const tw = (_k = byPhase.totalWins) !== null && _k !== void 0 ? _k : 0;
        return {
            totalPosts: tp,
            totalWins: tw,
            winRate: tp > 0 ? tw / tp : (_l = byPhase.winRate) !== null && _l !== void 0 ? _l : 0,
            totalPoints: (_m = byPhase.totalPoints) !== null && _m !== void 0 ? _m : 0,
            totalPrecision: (_o = byPhase.totalPrecision) !== null && _o !== void 0 ? _o : 0,
            totalUpset: (_p = byPhase.totalUpset) !== null && _p !== void 0 ? _p : 0,
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
async function loadLatestHistSnapForUidFromNewest(uid) {
    var _a;
    const firestore = db();
    const snap = await firestore
        .collection("cumulative_stats")
        .doc(uid)
        .collection(buildCumulativeRankingSnapshot_1.RANK_SNAPSHOT_HISTORY_SUBCOL)
        .get();
    if (snap.empty)
        return null;
    const sorted = [...snap.docs].sort((a, b) => a.id.localeCompare(b.id));
    return (_a = sorted[sorted.length - 1]) !== null && _a !== void 0 ? _a : null;
}
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
        return { mySnap: null, latestHistSnap: null, histSnap: null };
    const mySnap = await db().collection("cumulative_stats").doc(uid).get();
    if (!mySnap.exists)
        return { mySnap, latestHistSnap: null, histSnap: null };
    const [latestHistSnap, histSnap] = await Promise.all([
        loadLatestHistSnapForUidFromNewest(uid),
        loadLatestHistSnapForUid(uid),
    ]);
    return { mySnap, latestHistSnap, histSnap };
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
async function rankingPayloadForMetric(metric, phase, round, uid, snaps) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y;
    const snapDoc = await db()
        .collection("cumulative_ranking_snapshots")
        .doc(round === "overall" ? `${phase}_${metric}` : `${phase}_${round}_${metric}`)
        .get();
    const rawRows = snapDoc.exists
        ? ((_b = (_a = snapDoc.data()) === null || _a === void 0 ? void 0 : _a.rows) !== null && _b !== void 0 ? _b : [])
        : [];
    let rows = rawRows.map((row) => (Object.assign(Object.assign({}, row), { plan: row.plan === "pro" ? "pro" : "free" })));
    if (rows.length === 0 &&
        phase === "playoffs" &&
        round !== "overall" &&
        (round === "r1" || round === "r2" || round === "cf" || round === "finals")) {
        const live = await (0, buildCumulativeRankingSnapshot_1.loadPlayoffRoundTop20RowsLive)(round, metric);
        rows = live.map((row) => (Object.assign(Object.assign({}, row), { plan: row.plan === "pro" ? "pro" : "free" })));
    }
    const missingPlanUids = rows
        .filter((r) => (r === null || r === void 0 ? void 0 : r.uid) && r.plan !== "pro" && r.plan !== "free")
        .map((r) => r.uid);
    const rowUids = [...new Set(missingPlanUids)];
    const planByUid = new Map();
    if (rowUids.length > 0) {
        const refs = rowUids.map((id) => db().collection("users").doc(id));
        const userSnaps = await db().getAll(...refs);
        userSnaps.forEach((s, i) => {
            const id = rowUids[i];
            if (!id)
                return;
            if (!s.exists) {
                planByUid.set(id, "free");
                return;
            }
            const u = s.data();
            planByUid.set(id, (u === null || u === void 0 ? void 0 : u.plan) === "pro" ? "pro" : "free");
        });
        rows = rows.map((r) => {
            var _a;
            return (Object.assign(Object.assign({}, r), { plan: (_a = planByUid.get(r.uid)) !== null && _a !== void 0 ? _a : r.plan }));
        });
    }
    // 住んでいる国は users が最新（プロフィール保存直後も国旗表示できるよう反映）
    const rowUidsForCountry = [
        ...new Set(rows.map((r) => r.uid).filter(Boolean)),
    ];
    if (uid && !rowUidsForCountry.includes(uid)) {
        rowUidsForCountry.push(uid);
    }
    const countryByUid = new Map();
    if (rowUidsForCountry.length > 0) {
        const userRefs = rowUidsForCountry.map((id) => db().collection("users").doc(id));
        const countrySnaps = await db().getAll(...userRefs);
        countrySnaps.forEach((s, i) => {
            const id = rowUidsForCountry[i];
            if (!id)
                return;
            if (!s.exists) {
                countryByUid.set(id, undefined);
                return;
            }
            const u = s.data();
            const raw = u === null || u === void 0 ? void 0 : u.countryCode;
            const c = typeof raw === "string" && raw.trim() !== ""
                ? raw.trim().slice(0, 8)
                : null;
            countryByUid.set(id, c);
        });
        rows = rows.map((r) => {
            const v = countryByUid.get(r.uid);
            if (v === undefined)
                return r;
            return Object.assign(Object.assign({}, r), { countryCode: v });
        });
    }
    let myRank = null;
    let myRow = null;
    let myRankDeltaPlaces = null;
    if (uid && ((_c = snaps.mySnap) === null || _c === void 0 ? void 0 : _c.exists)) {
        const mySnap = snaps.mySnap;
        const me = mySnap.data();
        const rk = rankingSlice(me, phase, round);
        const minPosts = metric === "winRate" ? MIN_POSTS_FOR_WIN_RATE : 1;
        if (((_d = rk.totalPosts) !== null && _d !== void 0 ? _d : 0) < minPosts) {
            return {
                count: rows.length,
                rows,
                myRank: null,
                myRow: null,
                myRankDeltaPlaces: null,
            };
        }
        const histLatestData = ((_e = snaps.latestHistSnap) === null || _e === void 0 ? void 0 : _e.exists)
            ? snaps.latestHistSnap.data()
            : undefined;
        const latestHistRaw = phase === "playoffs" && round !== "overall"
            ? (_f = histLatestData === null || histLatestData === void 0 ? void 0 : histLatestData.playoffRounds) === null || _f === void 0 ? void 0 : _f[round]
            : histLatestData === null || histLatestData === void 0 ? void 0 : histLatestData[phase];
        const latestHistRankRaw = latestHistRaw === null || latestHistRaw === void 0 ? void 0 : latestHistRaw[metric];
        const latestHistRank = typeof latestHistRankRaw === "number" &&
            Number.isFinite(latestHistRankRaw) &&
            latestHistRankRaw >= 1
            ? Math.floor(latestHistRankRaw)
            : null;
        const storedRankRaw = phase === "playoffs" && round !== "overall"
            ? (_j = (_h = (_g = me.snapshotRanks) === null || _g === void 0 ? void 0 : _g.playoffRounds) === null || _h === void 0 ? void 0 : _h[round]) === null || _j === void 0 ? void 0 : _j[metric]
            : round === "overall"
                ? (_l = (_k = me.snapshotRanks) === null || _k === void 0 ? void 0 : _k[phase]) === null || _l === void 0 ? void 0 : _l[metric]
                : undefined;
        const storedRank = typeof storedRankRaw === "number" &&
            Number.isFinite(storedRankRaw) &&
            storedRankRaw >= 1
            ? Math.floor(storedRankRaw)
            : null;
        if (latestHistRank != null) {
            myRank = latestHistRank;
        }
        else if (storedRank != null) {
            myRank = storedRank;
        }
        else if (!isPhaseSnapshotBuiltDaily(phase)) {
            /** プレーイン確定後はスナップショットに無いユーザーは live count しない（順位が動かない前提） */
            myRank = null;
        }
        else {
            const myValue = metric === "activeWinStreak"
                ? (_m = me.activeWinStreak) !== null && _m !== void 0 ? _m : 0
                : metric === "winRate"
                    ? (_o = rk.winRate) !== null && _o !== void 0 ? _o : 0
                    : (_p = rk[metric]) !== null && _p !== void 0 ? _p : 0;
            const hasRankingObj = round === "overall"
                ? ((_q = me.rankingByPhase) === null || _q === void 0 ? void 0 : _q[phase]) &&
                    typeof me.rankingByPhase[phase] === "object" &&
                    (me.rankingByPhase[phase].totalPosts != null ||
                        me.rankingByPhase[phase].totalPoints != null)
                : ((_r = me.rankingByPlayoffRound) === null || _r === void 0 ? void 0 : _r[round]) &&
                    typeof me.rankingByPlayoffRound[round] === "object" &&
                    (me.rankingByPlayoffRound[round].totalPosts != null ||
                        me.rankingByPlayoffRound[round].totalPoints != null);
            const rankField = metric === "activeWinStreak"
                ? new firestore_1.FieldPath("activeWinStreak")
                : hasRankingObj
                    ? round === "overall"
                        ? metric === "winRate"
                            ? new firestore_1.FieldPath("rankingByPhase", phase, "winRate")
                            : new firestore_1.FieldPath("rankingByPhase", phase, metric)
                        : metric === "winRate"
                            ? new firestore_1.FieldPath("rankingByPlayoffRound", round, "winRate")
                            : new firestore_1.FieldPath("rankingByPlayoffRound", round, metric)
                    : metric === "winRate"
                        ? "winRate"
                        : metric;
            const higherQuery = db()
                .collection("cumulative_stats")
                .where(rankField, ">", myValue);
            const higherSnap = metric === "winRate"
                ? await higherQuery
                    .where((round === "overall"
                    ? new firestore_1.FieldPath("rankingByPhase", phase, "totalPosts")
                    : new firestore_1.FieldPath("rankingByPlayoffRound", round, "totalPosts")), ">=", MIN_POSTS_FOR_WIN_RATE)
                    .count()
                    .get()
                : await higherQuery.count().get();
            myRank = ((_s = higherSnap.data().count) !== null && _s !== void 0 ? _s : 0) + 1;
        }
        const histSnap = snaps.histSnap;
        if ((histSnap === null || histSnap === void 0 ? void 0 : histSnap.exists) && myRank != null) {
            const hd = histSnap.data();
            const phaseBlock = phase === "playoffs" && round !== "overall"
                ? (_t = hd === null || hd === void 0 ? void 0 : hd.playoffRounds) === null || _t === void 0 ? void 0 : _t[round]
                : hd === null || hd === void 0 ? void 0 : hd[phase];
            const prevRaw = phaseBlock === null || phaseBlock === void 0 ? void 0 : phaseBlock[metric];
            const prevRank = typeof prevRaw === "number" &&
                Number.isFinite(prevRaw) &&
                prevRaw >= 1
                ? Math.floor(prevRaw)
                : null;
            if (prevRank != null) {
                const d = prevRank - myRank;
                if (d !== 0) {
                    myRankDeltaPlaces = d;
                }
            }
        }
        const myPlanResolved = me.plan === "pro" ? "pro" : "free";
        const myCountryFresh = uid ? countryByUid.get(uid) : undefined;
        myRow = {
            uid,
            displayName: (_u = me.displayName) !== null && _u !== void 0 ? _u : "",
            handle: (_v = me.handle) !== null && _v !== void 0 ? _v : null,
            photoURL: (_w = me.photoURL) !== null && _w !== void 0 ? _w : null,
            countryCode: myCountryFresh !== undefined
                ? myCountryFresh
                : ((_x = me.countryCode) !== null && _x !== void 0 ? _x : null),
            plan: myPlanResolved,
            totalPosts: rk.totalPosts,
            totalWins: rk.totalWins,
            winRate: rk.winRate,
            totalPoints: rk.totalPoints,
            totalPrecision: rk.totalPrecision,
            totalUpset: rk.totalUpset,
            activeWinStreak: (_y = me.activeWinStreak) !== null && _y !== void 0 ? _y : 0,
            rank: myRank,
            rankDeltaPlaces: myRankDeltaPlaces,
        };
    }
    return {
        count: rows.length,
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
        const bulkMetrics = parseMetricsParam(req.query.metrics);
        if (bulkMetrics) {
            const snaps = await loadUserRankingSnaps(uid);
            const byMetric = {};
            for (const m of bulkMetrics) {
                byMetric[m] = await rankingPayloadForMetric(m, phase, round, uid, snaps);
            }
            res.status(200).json({ ok: true, phase, round, byMetric });
            return;
        }
        const rawMetric = req.query.metric;
        const metric = isMetric(rawMetric) ? rawMetric : "totalPoints";
        const snaps = await loadUserRankingSnaps(uid);
        const payload = await rankingPayloadForMetric(metric, phase, round, uid, snaps);
        res.status(200).json({
            ok: true,
            metric,
            phase,
            round,
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