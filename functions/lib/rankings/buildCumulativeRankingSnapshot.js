"use strict";
// functions/src/rankings/buildCumulativeRankingSnapshot.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.RANK_DELTA_PRIOR_MAX_LOOKBACK_DAYS = exports.RANK_SNAPSHOT_HISTORY_SUBCOL = exports.SNAPSHOT_BUILD_PHASES = void 0;
exports.getYesterdayDateKeyJST = getYesterdayDateKeyJST;
exports.subtractOneDayFromDateKeyJST = subtractOneDayFromDateKeyJST;
exports.buildCumulativeRankingSnapshot = buildCumulativeRankingSnapshot;
const firestore_1 = require("firebase-admin/firestore");
/* =========================================================
 * Firestore
 * =======================================================*/
function db() {
    return (0, firestore_1.getFirestore)();
}
const MIN_POSTS_FOR_WIN_RATE = 15;
const METRICS = [
    "totalPoints",
    "winRate",
    "totalPrecision",
    "totalUpset",
    "activeWinStreak",
];
const PLAYOFF_ROUND_KEYS = ["r1", "r2", "cf", "finals"];
/**
 * 日次スナップショットで再計算・書き込みするフェーズ。プレーイン終了後は確定表示のため除外する。
 * Next の `RANKING_SNAPSHOT_BUILD_PHASES` と同期すること。
 */
exports.SNAPSHOT_BUILD_PHASES = ["playoffs"];
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
/** Step a JST calendar dateKey (YYYY-MM-DD) back one day (rankSnapshotHistory doc id). */
function subtractOneDayFromDateKeyJST(dateKey) {
    const [y, m, d] = dateKey.split("-").map(Number);
    const prev = new Date(Date.UTC(y, m - 1, d - 1));
    const yy = prev.getUTCFullYear();
    const mm = String(prev.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(prev.getUTCDate()).padStart(2, "0");
    return `${yy}-${mm}-${dd}`;
}
/** Max days to walk back when yesterday's per-user rank snapshot doc is missing. */
exports.RANK_DELTA_PRIOR_MAX_LOOKBACK_DAYS = 30;
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
/**
 * For each uid, use the first existing rankSnapshotHistory doc when walking back
 * from startKey (usually yesterday) up to maxLookbackDays days.
 */
async function fetchLatestPriorRankMapsForUids(uids, startKey, maxLookbackDays) {
    const out = new Map();
    if (uids.length === 0)
        return out;
    const pending = new Set(uids);
    let key = startKey;
    const firestore = db();
    const CHUNK = 200;
    for (let day = 0; day < maxLookbackDays && pending.size > 0; day++) {
        const chunkList = [...pending];
        for (let i = 0; i < chunkList.length; i += CHUNK) {
            const chunk = chunkList.slice(i, i + CHUNK);
            const refs = chunk.map((uid) => firestore
                .collection("cumulative_stats")
                .doc(uid)
                .collection(exports.RANK_SNAPSHOT_HISTORY_SUBCOL)
                .doc(key));
            const snaps = await firestore.getAll(...refs);
            snaps.forEach((s, j) => {
                var _a, _b, _c;
                const uid = chunk[j];
                if (!pending.has(uid))
                    return;
                if (s.exists) {
                    const d = s.data();
                    out.set(uid, {
                        play_in: ((_a = d === null || d === void 0 ? void 0 : d.play_in) !== null && _a !== void 0 ? _a : {}),
                        playoffs: ((_b = d === null || d === void 0 ? void 0 : d.playoffs) !== null && _b !== void 0 ? _b : {}),
                        playoffRounds: ((_c = d === null || d === void 0 ? void 0 : d.playoffRounds) !== null && _c !== void 0 ? _c : {}),
                    });
                    pending.delete(uid);
                }
            });
        }
        key = subtractOneDayFromDateKeyJST(key);
    }
    for (const uid of pending) {
        out.set(uid, null);
    }
    return out;
}
/* =========================================================
 * Main
 * =======================================================*/
async function buildCumulativeRankingSnapshot() {
    var _a;
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
    for (const phase of exports.SNAPSHOT_BUILD_PHASES) {
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
            const eligibleRows = metric === "winRate"
                ? baseRows.filter((row) => { var _a; return ((_a = row.totalPosts) !== null && _a !== void 0 ? _a : 0) >= MIN_POSTS_FOR_WIN_RATE; })
                : baseRows;
            const sortedFull = [...eligibleRows].sort((a, b) => cmpSortRows(a, b, metric));
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
    const roundTop20Jobs = [];
    const rankByUidPlayoffRound = new Map();
    function ensurePlayoffRound(uid) {
        if (!rankByUidPlayoffRound.has(uid)) {
            rankByUidPlayoffRound.set(uid, {});
        }
        return rankByUidPlayoffRound.get(uid);
    }
    for (const round of PLAYOFF_ROUND_KEYS) {
        const baseRows = snap.docs
            .map((doc) => {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
            const d = doc.data();
            const rr = (_a = d.rankingByPlayoffRound) === null || _a === void 0 ? void 0 : _a[round];
            const tp = (_b = rr === null || rr === void 0 ? void 0 : rr.totalPosts) !== null && _b !== void 0 ? _b : 0;
            const tw = (_c = rr === null || rr === void 0 ? void 0 : rr.totalWins) !== null && _c !== void 0 ? _c : 0;
            return {
                uid: doc.id,
                displayName: (_d = d.displayName) !== null && _d !== void 0 ? _d : "user",
                handle: (_e = d.handle) !== null && _e !== void 0 ? _e : null,
                photoURL: (_f = d.photoURL) !== null && _f !== void 0 ? _f : null,
                countryCode: (_g = d.countryCode) !== null && _g !== void 0 ? _g : null,
                plan: (d.plan === "pro" ? "pro" : "free"),
                totalPosts: tp,
                totalWins: tw,
                winRate: tp > 0 ? tw / tp : (_h = rr === null || rr === void 0 ? void 0 : rr.winRate) !== null && _h !== void 0 ? _h : 0,
                totalPoints: (_j = rr === null || rr === void 0 ? void 0 : rr.totalPoints) !== null && _j !== void 0 ? _j : 0,
                totalPrecision: (_k = rr === null || rr === void 0 ? void 0 : rr.totalPrecision) !== null && _k !== void 0 ? _k : 0,
                totalUpset: (_l = rr === null || rr === void 0 ? void 0 : rr.totalUpset) !== null && _l !== void 0 ? _l : 0,
                activeWinStreak: (_m = d.activeWinStreak) !== null && _m !== void 0 ? _m : 0,
            };
        })
            .filter((row) => { var _a; return ((_a = row.totalPosts) !== null && _a !== void 0 ? _a : 0) > 0; });
        for (const metric of METRICS) {
            const eligibleRows = metric === "winRate"
                ? baseRows.filter((row) => { var _a; return ((_a = row.totalPosts) !== null && _a !== void 0 ? _a : 0) >= MIN_POSTS_FOR_WIN_RATE; })
                : baseRows;
            const sortedFull = [...eligibleRows].sort((a, b) => cmpSortRows(a, b, metric));
            const ranks = assignCompetitionRanks(sortedFull, metric);
            for (const [uid, rank] of ranks) {
                const slot = ensurePlayoffRound(uid);
                if (!slot[round])
                    slot[round] = {};
                slot[round][metric] = rank;
            }
            const top20 = sortedFull.slice(0, 20).map((row) => {
                var _a;
                return (Object.assign(Object.assign({}, row), { rank: (_a = ranks.get(row.uid)) !== null && _a !== void 0 ? _a : 0 }));
            });
            for (const r of top20) {
                topUidSet.add(r.uid);
            }
            roundTop20Jobs.push({ round, metric, rows: top20 });
        }
    }
    const yesterdayKey = getYesterdayDateKeyJST();
    const prevByUid = await fetchLatestPriorRankMapsForUids([...topUidSet], yesterdayKey, exports.RANK_DELTA_PRIOR_MAX_LOOKBACK_DAYS);
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
    for (const { round, metric, rows } of roundTop20Jobs) {
        const enriched = rows.map((row) => {
            var _a, _b;
            const prevBlock = prevByUid.get(row.uid);
            const prevRaw = (_b = (_a = prevBlock === null || prevBlock === void 0 ? void 0 : prevBlock.playoffRounds) === null || _a === void 0 ? void 0 : _a[round]) === null || _b === void 0 ? void 0 : _b[metric];
            const prevRank = typeof prevRaw === "number" &&
                Number.isFinite(prevRaw) &&
                prevRaw >= 1
                ? Math.floor(prevRaw)
                : null;
            return Object.assign(Object.assign({}, row), { rankDeltaPlaces: computeRankDeltaPlaces(prevRank, row.rank) });
        });
        await db()
            .collection("cumulative_ranking_snapshots")
            .doc(`playoffs_${round}_${metric}`)
            .set({
            phase: "playoffs",
            round,
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
        const playoffRounds = (_a = rankByUidPlayoffRound.get(uid)) !== null && _a !== void 0 ? _a : {};
        /**
         * merge のネストは play_in を消さないよう、更新するフィールドだけドットパスで書く。
         * （プレーインは SNAPSHOT_BUILD_PHASES 外のため per.play_in は空のまま）
         */
        batch.set(firestore.doc(`cumulative_stats/${uid}`), {
            "snapshotRanks.updatedAt": firestore_1.FieldValue.serverTimestamp(),
            "snapshotRanks.playoffs": per.playoffs,
            "snapshotRanks.playoffRounds": playoffRounds,
        }, { merge: true });
        batch.set(firestore
            .collection("cumulative_stats")
            .doc(uid)
            .collection(exports.RANK_SNAPSHOT_HISTORY_SUBCOL)
            .doc(dateKey), {
            dateKey,
            playoffs: per.playoffs,
            playoffRounds,
            writtenAt: firestore_1.FieldValue.serverTimestamp(),
        }, { merge: true });
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