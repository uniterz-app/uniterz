"use strict";
// functions/src/rankings/buildCumulativeRankingSnapshot.ts
// NBA シーズンキー付きスライス（rankingBySeason.<key>）から s<key>_<metric> doc を日次で作る。
Object.defineProperty(exports, "__esModule", { value: true });
exports.RANK_DELTA_PRIOR_MAX_LOOKBACK_DAYS = exports.RANK_SNAPSHOT_HISTORY_SUBCOL = exports.NBA_SEASON_WIN_RATE_MIN_POSTS = void 0;
exports.getYesterdayDateKeyJST = getYesterdayDateKeyJST;
exports.subtractOneDayFromDateKeyJST = subtractOneDayFromDateKeyJST;
exports.nbaSeasonRankingSlice = nbaSeasonRankingSlice;
exports.nbaOpenSeasonRankingSlice = nbaOpenSeasonRankingSlice;
exports.loadNbaSeasonTop20RowsLive = loadNbaSeasonTop20RowsLive;
exports.buildCumulativeRankingSnapshot = buildCumulativeRankingSnapshot;
const firestore_1 = require("firebase-admin/firestore");
const safeRankMetricNum_1 = require("./safeRankMetricNum");
const activeWinStreakRanking_1 = require("./activeWinStreakRanking");
const loadUidsWhoPredictedOnDateFromDaily_1 = require("../notifications/loadUidsWhoPredictedOnDateFromDaily");
const cumulativeSnapshotIndex_1 = require("./cumulativeSnapshotIndex");
const nbaSeason_1 = require("./nbaSeason");
const mergeProfileCharts_1 = require("../profile/mergeProfileCharts");
/* =========================================================
 * Firestore
 * =======================================================*/
function db() {
    return (0, firestore_1.getFirestore)();
}
const MIN_POSTS_FOR_WIN_RATE_BASE = 1;
/** NBA シーズン勝率ランキングの最低投稿数（Next の minPostsForWinRate と同期） */
exports.NBA_SEASON_WIN_RATE_MIN_POSTS = 20;
function filterRowsForMetricEligibility(baseRows, metric, opts) {
    if (metric === "winRate") {
        return baseRows.filter((row) => {
            var _a;
            return ((_a = row.totalPosts) !== null && _a !== void 0 ? _a : 0) >=
                Math.max(exports.NBA_SEASON_WIN_RATE_MIN_POSTS, MIN_POSTS_FOR_WIN_RATE_BASE);
        });
    }
    if (metric === "activeWinStreak") {
        if (opts.streakAllEligible) {
            return baseRows.filter((row) => { var _a; return ((_a = row.activeWinStreak) !== null && _a !== void 0 ? _a : 0) > 0; });
        }
        if (opts.postedTodayUids) {
            // JST 16:00 スナップショット: 当日確定投稿者かつ連勝>0 のみ
            return baseRows.filter((row) => {
                var _a;
                return (0, activeWinStreakRanking_1.isActiveWinStreakRankingEligible)(row.uid, (_a = row.activeWinStreak) !== null && _a !== void 0 ? _a : 0, opts.postedTodayUids);
            });
        }
    }
    return baseRows;
}
const METRICS = [
    "totalPoints",
    "winRate",
    "totalUpset",
    "totalGoalScorerHits",
];
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
const EMPTY_SLICE = {
    totalPosts: 0,
    totalWins: 0,
    winRate: 0,
    totalPoints: 0,
    totalPrecision: 0,
    totalUpset: 0,
    totalGoalScorerHits: 0,
};
function sliceFromBucket(rr) {
    var _a, _b, _c, _d, _e, _f;
    if (!rr || typeof rr !== "object")
        return Object.assign({}, EMPTY_SLICE);
    const tp = Number((_a = rr.totalPosts) !== null && _a !== void 0 ? _a : 0);
    const tw = Number((_b = rr.totalWins) !== null && _b !== void 0 ? _b : 0);
    return {
        totalPosts: tp,
        totalWins: tw,
        winRate: tp > 0 ? tw / tp : Number((_c = rr.winRate) !== null && _c !== void 0 ? _c : 0),
        totalPoints: Number((_d = rr.totalPoints) !== null && _d !== void 0 ? _d : 0),
        totalPrecision: Number((_e = rr.totalPrecision) !== null && _e !== void 0 ? _e : 0),
        totalUpset: Number((_f = rr.totalUpset) !== null && _f !== void 0 ? _f : 0),
        totalGoalScorerHits: (0, safeRankMetricNum_1.safeRankMetricNum)(rr.totalGoalScorerHits),
    };
}
/** NBA 現行シーズンのスライス（rankingBySeason.<CURRENT_NBA_SEASON_KEY>） */
function nbaSeasonRankingSlice(d, seasonKey = nbaSeason_1.CURRENT_NBA_SEASON_KEY) {
    const bySeason = d.rankingBySeason;
    return sliceFromBucket(bySeason === null || bySeason === void 0 ? void 0 : bySeason[seasonKey]);
}
/** PRO LEAGUE 用。openRankingBySeason 優先、未移行は rankingBySeason にフォールバック */
function nbaOpenSeasonRankingSlice(d, seasonKey = nbaSeason_1.CURRENT_NBA_SEASON_KEY) {
    var _a;
    const openBySeason = d.openRankingBySeason;
    const open = sliceFromBucket(openBySeason === null || openBySeason === void 0 ? void 0 : openBySeason[seasonKey]);
    if (((_a = open.totalPosts) !== null && _a !== void 0 ? _a : 0) > 0)
        return open;
    return nbaSeasonRankingSlice(d, seasonKey);
}
function activeBasketballStreak(d) {
    var _a, _b, _c, _d, _e;
    const signed = (_e = (_d = (_c = (_a = d.activeWinStreakBasketball) !== null && _a !== void 0 ? _a : (_b = d.streakBySport) === null || _b === void 0 ? void 0 : _b.basketball) !== null && _c !== void 0 ? _c : d.currentStreak) !== null && _d !== void 0 ? _d : d.activeWinStreak) !== null && _e !== void 0 ? _e : 0;
    return typeof signed === "number" && signed > 0 ? signed : 0;
}
function getRowMetricValue(row, metric) {
    if (metric === "activeWinStreak")
        return (0, safeRankMetricNum_1.safeRankMetricNum)(row.activeWinStreak);
    if (metric === "winRate")
        return (0, safeRankMetricNum_1.safeRankMetricNum)(row.winRate);
    if (metric === "totalPoints")
        return (0, safeRankMetricNum_1.safeRankMetricNum)(row.totalPoints);
    if (metric === "totalExactHits")
        return (0, safeRankMetricNum_1.safeRankMetricNum)(row.totalPrecision);
    if (metric === "totalPrecision")
        return (0, safeRankMetricNum_1.safeRankMetricNum)(row.totalPrecision);
    if (metric === "totalGoalScorerHits")
        return (0, safeRankMetricNum_1.safeRankMetricNum)(row.totalGoalScorerHits);
    return (0, safeRankMetricNum_1.safeRankMetricNum)(row.totalUpset);
}
/** Same ordering as snapshot sort (desc). Returns 0 when tied for rank. */
function cmpSortRows(a, b, metric) {
    var _a, _b;
    const diff = getRowMetricValue(b, metric) - getRowMetricValue(a, metric);
    if (diff !== 0)
        return diff;
    if (metric === "winRate") {
        const postsDiff = ((_a = b.totalPosts) !== null && _a !== void 0 ? _a : 0) - ((_b = a.totalPosts) !== null && _b !== void 0 ? _b : 0);
        if (postsDiff !== 0)
            return postsDiff;
    }
    return (0, safeRankMetricNum_1.safeRankMetricNum)(b.totalPoints) - (0, safeRankMetricNum_1.safeRankMetricNum)(a.totalPoints);
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
function toSnapshotMetricValues(r) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
    const tp = (_a = r.totalPosts) !== null && _a !== void 0 ? _a : 0;
    const tw = (_b = r.totalWins) !== null && _b !== void 0 ? _b : 0;
    return {
        totalPoints: (_c = r.totalPoints) !== null && _c !== void 0 ? _c : 0,
        totalPrecision: (_d = r.totalPrecision) !== null && _d !== void 0 ? _d : 0,
        totalUpset: (_e = r.totalUpset) !== null && _e !== void 0 ? _e : 0,
        winRate: tp > 0 ? tw / tp : ((_f = r.winRate) !== null && _f !== void 0 ? _f : 0),
        exactHitCount: (_h = (_g = r.exactHitCount) !== null && _g !== void 0 ? _g : r.totalPrecision) !== null && _h !== void 0 ? _h : 0,
        upsetBonusSum: (_k = (_j = r.upsetBonusSum) !== null && _j !== void 0 ? _j : r.totalUpset) !== null && _k !== void 0 ? _k : 0,
        streakBonusSum: (_l = r.streakBonusSum) !== null && _l !== void 0 ? _l : 0,
        goalScorerBonusSum: (_m = r.goalScorerBonusSum) !== null && _m !== void 0 ? _m : 0,
    };
}
function buildMetricValuesBlock(d) {
    var _a;
    const seasons = {};
    const bySeason = ((_a = d.rankingBySeason) !== null && _a !== void 0 ? _a : {});
    for (const [seasonKey, bucket] of Object.entries(bySeason)) {
        const slice = sliceFromBucket(bucket);
        if (slice.totalPosts > 0) {
            seasons[seasonKey] = toSnapshotMetricValues(slice);
        }
    }
    return { seasons };
}
function computeRankDeltaPlaces(prevRank, currentRank) {
    if (prevRank == null || currentRank < 1)
        return null;
    const d = prevRank - currentRank;
    if (d === 0)
        return null;
    return d;
}
function pickPriorMetricValues(block, opts) {
    var _a, _b;
    if (!block)
        return null;
    return (_b = (_a = block.seasons) === null || _a === void 0 ? void 0 : _a[opts.seasonKey]) !== null && _b !== void 0 ? _b : null;
}
function metricValueFromRow(row, metric) {
    var _a, _b, _c, _d, _e, _f, _g;
    if (metric === "activeWinStreak")
        return (_a = row.activeWinStreak) !== null && _a !== void 0 ? _a : 0;
    if (metric === "totalGoalScorerHits")
        return (_b = row.totalGoalScorerHits) !== null && _b !== void 0 ? _b : 0;
    if (metric === "winRate")
        return (_c = row.winRate) !== null && _c !== void 0 ? _c : 0;
    if (metric === "totalPoints")
        return (_d = row.totalPoints) !== null && _d !== void 0 ? _d : 0;
    if (metric === "totalExactHits")
        return (_e = row.totalPrecision) !== null && _e !== void 0 ? _e : 0;
    if (metric === "totalPrecision")
        return (_f = row.totalPrecision) !== null && _f !== void 0 ? _f : 0;
    return (_g = row.totalUpset) !== null && _g !== void 0 ? _g : 0;
}
function metricValueFromSnapshot(values, metric) {
    var _a, _b, _c, _d;
    if (metric === "activeWinStreak" || metric === "totalGoalScorerHits") {
        return null;
    }
    if (metric === "winRate")
        return (_a = values.winRate) !== null && _a !== void 0 ? _a : 0;
    if (metric === "totalPoints")
        return (_b = values.totalPoints) !== null && _b !== void 0 ? _b : 0;
    if (metric === "totalExactHits" || metric === "totalPrecision") {
        return (_c = values.totalPrecision) !== null && _c !== void 0 ? _c : 0;
    }
    return (_d = values.totalUpset) !== null && _d !== void 0 ? _d : 0;
}
function computeMetricValueDelta(row, metric, prior) {
    if (!prior)
        return null;
    const curRaw = metricValueFromRow(row, metric);
    const prevRaw = metricValueFromSnapshot(prior, metric);
    if (curRaw == null || prevRaw == null)
        return null;
    if (metric === "winRate") {
        const curPct = curRaw <= 1 ? curRaw * 100 : curRaw;
        const prevPct = prevRaw <= 1 ? prevRaw * 100 : prevRaw;
        const d = curPct - prevPct;
        if (!Number.isFinite(d) || Math.abs(d) < 1e-9)
            return null;
        return d;
    }
    const d = curRaw - prevRaw;
    if (!Number.isFinite(d) || Math.abs(d) < 1e-9)
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
                var _a;
                const uid = chunk[j];
                if (!pending.has(uid))
                    return;
                if (s.exists) {
                    const d = s.data();
                    out.set(uid, {
                        seasons: ((_a = d === null || d === void 0 ? void 0 : d.seasons) !== null && _a !== void 0 ? _a : {}),
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
async function fetchLatestPriorMetricValuesForUids(uids, startKey, maxLookbackDays) {
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
                const uid = chunk[j];
                if (!pending.has(uid))
                    return;
                if (s.exists) {
                    const d = s.data();
                    if (d === null || d === void 0 ? void 0 : d.metricValues) {
                        out.set(uid, d.metricValues);
                        pending.delete(uid);
                    }
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
/** NBA 現行シーズンの live フォールバック */
async function loadNbaSeasonTop20RowsLive(metric, postedTodayUids) {
    const snap = await db().collection("cumulative_stats").get();
    const baseRows = snap.docs
        .map((doc) => {
        var _a, _b, _c, _d;
        const d = doc.data();
        const r = nbaSeasonRankingSlice(d);
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
            totalGoalScorerHits: r.totalGoalScorerHits,
            activeWinStreak: activeBasketballStreak(d),
        };
    })
        .filter((row) => { var _a; return ((_a = row.totalPosts) !== null && _a !== void 0 ? _a : 0) > 0; });
    const eligibleRows = filterRowsForMetricEligibility(baseRows, metric, {
        postedTodayUids: postedTodayUids,
    });
    const sortedFull = [...eligibleRows].sort((a, b) => cmpSortRows(a, b, metric));
    const ranks = assignCompetitionRanks(sortedFull, metric);
    return {
        totalCount: sortedFull.length,
        rankByUid: ranks,
        rows: sortedFull.slice(0, 20).map((row) => {
            var _a;
            return (Object.assign(Object.assign({}, row), { rank: (_a = ranks.get(row.uid)) !== null && _a !== void 0 ? _a : 0, rankDeltaPlaces: null }));
        }),
    };
}
async function buildCumulativeRankingSnapshot(options = {}) {
    var _a, _b;
    const streakAllEligible = options.streakAllEligible === true;
    const seasonKey = nbaSeason_1.CURRENT_NBA_SEASON_KEY;
    const snap = await (0, cumulativeSnapshotIndex_1.loadCumulativeStatsForRankingSnapshot)(db());
    const statsByUid = (0, cumulativeSnapshotIndex_1.cumulativeStatsDocsToMap)(snap);
    const nbaSettledTodayUids = await (0, activeWinStreakRanking_1.loadAuthorUidsSettledToday)("nba");
    /** uid → 現行シーズンの指標別順位 */
    const rankByUidSeason = new Map();
    function ensureSeason(uid) {
        if (!rankByUidSeason.has(uid)) {
            rankByUidSeason.set(uid, {});
        }
        return rankByUidSeason.get(uid);
    }
    const seasonTop20Jobs = [];
    const topUidSet = new Set();
    const baseRows = snap.docs
        .map((doc) => {
        var _a, _b, _c, _d;
        const d = doc.data();
        const r = nbaSeasonRankingSlice(d, seasonKey);
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
            totalGoalScorerHits: r.totalGoalScorerHits,
            activeWinStreak: activeBasketballStreak(d),
        };
    })
        .filter((row) => { var _a; return ((_a = row.totalPosts) !== null && _a !== void 0 ? _a : 0) > 0; });
    const openSeasonBaseRows = snap.docs
        .map((doc) => {
        var _a, _b, _c, _d;
        const d = doc.data();
        const r = nbaOpenSeasonRankingSlice(d, seasonKey);
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
            totalGoalScorerHits: r.totalGoalScorerHits,
            activeWinStreak: activeBasketballStreak(d),
        };
    })
        .filter((row) => { var _a; return ((_a = row.totalPosts) !== null && _a !== void 0 ? _a : 0) > 0; })
        .filter((row) => row.plan === "pro");
    const baseRowsForOpenSeason = openSeasonBaseRows;
    for (const metric of METRICS) {
        const eligibleRows = filterRowsForMetricEligibility(baseRows, metric, {
            postedTodayUids: metric === "activeWinStreak" && !streakAllEligible
                ? nbaSettledTodayUids
                : undefined,
            streakAllEligible: metric === "activeWinStreak" ? streakAllEligible : undefined,
        });
        const sortedFull = [...eligibleRows].sort((a, b) => cmpSortRows(a, b, metric));
        const ranks = assignCompetitionRanks(sortedFull, metric);
        for (const [uid, rank] of ranks) {
            ensureSeason(uid)[metric] = rank;
        }
        const top20 = sortedFull.slice(0, 20).map((row) => {
            var _a;
            return (Object.assign(Object.assign({}, row), { rank: (_a = ranks.get(row.uid)) !== null && _a !== void 0 ? _a : 0 }));
        });
        for (const r of top20) {
            topUidSet.add(r.uid);
        }
        seasonTop20Jobs.push({
            metric,
            rows: top20,
            totalCount: sortedFull.length,
        });
    }
    const yesterdayKey = getYesterdayDateKeyJST();
    const topUids = [...topUidSet];
    const [prevByUid, priorMetricByUid] = await Promise.all([
        fetchLatestPriorRankMapsForUids(topUids, yesterdayKey, exports.RANK_DELTA_PRIOR_MAX_LOOKBACK_DAYS),
        fetchLatestPriorMetricValuesForUids(topUids, yesterdayKey, exports.RANK_DELTA_PRIOR_MAX_LOOKBACK_DAYS),
    ]);
    for (const { metric, rows, totalCount } of seasonTop20Jobs) {
        const enriched = rows.map((row) => {
            var _a, _b;
            const prevBlock = prevByUid.get(row.uid);
            const prevRaw = (_b = (_a = prevBlock === null || prevBlock === void 0 ? void 0 : prevBlock.seasons) === null || _a === void 0 ? void 0 : _a[seasonKey]) === null || _b === void 0 ? void 0 : _b[metric];
            const prevRank = typeof prevRaw === "number" &&
                Number.isFinite(prevRaw) &&
                prevRaw >= 1
                ? Math.floor(prevRaw)
                : null;
            const priorMetrics = pickPriorMetricValues(priorMetricByUid.get(row.uid), { kind: "season", seasonKey });
            return Object.assign(Object.assign({}, row), { rankDeltaPlaces: computeRankDeltaPlaces(prevRank, row.rank), metricValueDelta: computeMetricValueDelta(row, metric, priorMetrics) });
        });
        await db()
            .collection("cumulative_ranking_snapshots")
            .doc((0, nbaSeason_1.nbaSeasonSnapshotDocId)(seasonKey, metric))
            .set({
            kind: "nbaSeason",
            seasonKey,
            metric,
            rows: enriched,
            totalCount,
            updatedAt: firestore_1.FieldValue.serverTimestamp(),
            rankDeltaBasisDateKey: yesterdayKey,
        }, { merge: true });
    }
    // 無差別級（Pro のみ）シーズンスナップショット
    const openBaseRows = baseRowsForOpenSeason;
    for (const metric of METRICS) {
        const eligibleRows = filterRowsForMetricEligibility(openBaseRows, metric, {
            postedTodayUids: metric === "activeWinStreak" && !streakAllEligible
                ? nbaSettledTodayUids
                : undefined,
            streakAllEligible: metric === "activeWinStreak" ? streakAllEligible : undefined,
        });
        const sortedFull = [...eligibleRows].sort((a, b) => cmpSortRows(a, b, metric));
        const ranksMap = assignCompetitionRanks(sortedFull, metric);
        const ranks = {};
        for (const [uid, rank] of ranksMap)
            ranks[uid] = rank;
        const top20 = sortedFull.slice(0, 20).map((row) => {
            var _a;
            return (Object.assign(Object.assign({}, row), { rank: (_a = ranksMap.get(row.uid)) !== null && _a !== void 0 ? _a : 0, rankDeltaPlaces: null, metricValueDelta: null }));
        });
        await db()
            .collection("cumulative_ranking_snapshots")
            .doc((0, nbaSeason_1.nbaSeasonOpenSnapshotDocId)(seasonKey, metric))
            .set({
            kind: "nbaSeasonOpen",
            division: "open",
            seasonKey,
            metric,
            rows: top20,
            ranks,
            totalCount: sortedFull.length,
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
    const historyUids = new Set(rankByUidSeason.keys());
    const metricValuesByUid = new Map();
    for (const uid of historyUids) {
        const docData = statsByUid.get(uid);
        if (docData) {
            metricValuesByUid.set(uid, buildMetricValuesBlock(docData));
        }
    }
    for (const uid of historyUids) {
        const seasonRanks = (_a = rankByUidSeason.get(uid)) !== null && _a !== void 0 ? _a : {};
        const totalPointsRank = Number((_b = seasonRanks.totalPoints) !== null && _b !== void 0 ? _b : 0);
        const cumData = statsByUid.get(uid);
        const profileChartsPatch = Number.isFinite(totalPointsRank) && totalPointsRank > 0
            ? (() => {
                var _a, _b;
                const charts = (0, mergeProfileCharts_1.mergeProfileChartsOnRankSnapshot)({
                    cumulative: cumData !== null && cumData !== void 0 ? cumData : null,
                    seasonKey,
                    dateKey,
                    totalPointsRank,
                });
                return {
                    "profileCharts.v": charts.v,
                    "profileCharts.seasonKey": charts.seasonKey,
                    "profileCharts.dailyTrend": (_a = charts.dailyTrend) !== null && _a !== void 0 ? _a : [],
                    "profileCharts.rankTrend": charts.rankTrend,
                    "profileCharts.last20": (_b = charts.last20) !== null && _b !== void 0 ? _b : [],
                    "profileCharts.builtAtMs": Date.now(),
                };
            })()
            : {};
        batch.set(firestore.doc(`cumulative_stats/${uid}`), Object.assign({ "snapshotRanks.updatedAt": firestore_1.FieldValue.serverTimestamp(), [`snapshotRanks.seasons.${seasonKey}`]: seasonRanks }, profileChartsPatch), { merge: true });
        batch.set(firestore
            .collection("cumulative_stats")
            .doc(uid)
            .collection(exports.RANK_SNAPSHOT_HISTORY_SUBCOL)
            .doc(dateKey), {
            dateKey,
            seasons: { [seasonKey]: seasonRanks },
            metricValues: metricValuesByUid.get(uid),
            writtenAt: firestore_1.FieldValue.serverTimestamp(),
        }, { merge: true });
        ops += 2;
        if (ops >= 500) {
            await flush();
        }
    }
    await flush();
    const generationMs = Date.now();
    await db()
        .collection("cumulative_ranking_snapshots")
        .doc("_generation")
        .set({
        updatedAt: firestore_1.FieldValue.serverTimestamp(),
        nba: {
            updatedAtMs: generationMs,
            rankDeltaBasisDateKey: yesterdayKey,
        },
    }, { merge: true });
    const todayPredictorUids = await (0, loadUidsWhoPredictedOnDateFromDaily_1.loadUidsWhoPredictedOnDateFromDaily)(dateKey);
    return {
        ok: true,
        seasonKey,
        metrics: METRICS.length,
        ranksWritten: rankByUidSeason.size,
        historyDateKey: dateKey,
        rankDeltaBasisDateKey: yesterdayKey,
        snapshotGenerationMs: generationMs,
        notifiedUids: todayPredictorUids,
    };
}
//# sourceMappingURL=buildCumulativeRankingSnapshot.js.map