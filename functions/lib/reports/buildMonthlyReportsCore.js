"use strict";
// 月次レポート builder — daily 1 パス + period snapshots → user_reports
// 旧 user_stats_v2_monthly は読まない。
// docs/pro-subscription-plan.md § 月次レポート集計スキーム
Object.defineProperty(exports, "__esModule", { value: true });
exports.rebuildMonthlyReportsCore = rebuildMonthlyReportsCore;
const firestore_1 = require("firebase-admin/firestore");
const nbaSeason_1 = require("../rankings/nbaSeason");
const nbaPeriod_1 = require("../rankings/nbaPeriod");
const monthlyRadarJudge_1 = require("./monthlyRadarJudge");
const buildMonthlyTeamAffinity_1 = require("./buildMonthlyTeamAffinity");
const resolveNbaTeamAbbr_1 = require("./resolveNbaTeamAbbr");
const buildMonthlyHighlights_1 = require("./buildMonthlyHighlights");
const buildMonthlyOutlookSummary_1 = require("./buildMonthlyOutlookSummary");
const buildMonthlyHabits_1 = require("./buildMonthlyHabits");
function db() {
    return (0, firestore_1.getFirestore)();
}
const PERIOD_METRICS = [
    "totalPoints",
    "winRate",
    "totalUpset",
    "totalGoalScorerHits",
];
/** 耐性 raw（既存月次 Pro Stats と同系） */
const STREAK_RUN_CAP = 10;
function emptyAgg() {
    return { posts: 0, wins: 0, points: 0, upset: 0, scorer: 0 };
}
function emptyHabitsRaw() {
    return {
        home: { posts: 0, wins: 0 },
        away: { posts: 0, wins: 0 },
        favorite: { posts: 0, wins: 0 },
        underdog: { posts: 0, wins: 0 },
    };
}
function addInc(agg, inc) {
    var _a, _b, _c, _d, _e;
    if (!inc || typeof inc !== "object")
        return;
    agg.posts += Number((_a = inc.posts) !== null && _a !== void 0 ? _a : 0) || 0;
    agg.wins += Number((_b = inc.wins) !== null && _b !== void 0 ? _b : 0) || 0;
    agg.points += Number((_c = inc.pointsSumV3) !== null && _c !== void 0 ? _c : 0) || 0;
    agg.upset += Number((_d = inc.upsetPointsSum) !== null && _d !== void 0 ? _d : 0) || 0;
    agg.scorer += Number((_e = inc.goalScorerHitCount) !== null && _e !== void 0 ? _e : 0) || 0;
}
function pickNbaInc(data) {
    const bySeason = data.rankingBySeason;
    const seasonInc = bySeason === null || bySeason === void 0 ? void 0 : bySeason[nbaSeason_1.CURRENT_NBA_SEASON_KEY];
    if (seasonInc && typeof seasonInc === "object")
        return seasonInc;
    const leagues = data.leagues;
    if ((leagues === null || leagues === void 0 ? void 0 : leagues.nba) && typeof leagues.nba === "object")
        return leagues.nba;
    return null;
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
function calcStreakFromEvents(events) {
    const sorted = [...events].sort((a, b) => a.settledAtMs - b.settledAtMs);
    let curWin = 0;
    let maxWin = 0;
    let curLose = 0;
    let maxLose = 0;
    for (const e of sorted) {
        if (e.isWin) {
            curWin += 1;
            curLose = 0;
            if (curWin > maxWin)
                maxWin = curWin;
        }
        else {
            curLose += 1;
            curWin = 0;
            if (curLose > maxLose)
                maxLose = curLose;
        }
    }
    return { maxWin, maxLose };
}
function staminaRaw(maxWin, maxLose) {
    return (7 +
        Math.min(maxWin, STREAK_RUN_CAP) * 0.35 -
        Math.min(maxLose, STREAK_RUN_CAP) * 0.9);
}
/** 暦月 YYYY-MM の daily NBA 合算 */
async function loadMonthAggByUid(monthKey) {
    var _a;
    const [y, m] = monthKey.split("-").map(Number);
    const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
    const startKey = `${y}-${String(m).padStart(2, "0")}-01`;
    const endKey = `${y}-${String(m).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
    const statsSnap = await db()
        .collection("user_stats_v2_daily")
        .where("date", ">=", startKey)
        .where("date", "<=", endKey)
        .get();
    const aggByUid = new Map();
    for (const doc of statsSnap.docs) {
        const data = doc.data();
        const dateKey = String((_a = data.date) !== null && _a !== void 0 ? _a : "");
        const uid = uidFromDailyDocId(doc.id, dateKey);
        if (!uid)
            continue;
        const inc = pickNbaInc(data);
        if (!inc)
            continue;
        if (!aggByUid.has(uid))
            aggByUid.set(uid, emptyAgg());
        addInc(aggByUid.get(uid), inc);
    }
    return aggByUid;
}
function percentile(sorted, value) {
    if (sorted.length === 0)
        return 0;
    let below = 0;
    let equal = 0;
    for (const v of sorted) {
        if (v < value)
            below++;
        else if (v === value)
            equal++;
    }
    return ((below + equal * 0.5) / sorted.length) * 100;
}
function median(sorted) {
    if (sorted.length === 0)
        return 0;
    const mid = Math.floor(sorted.length / 2);
    if (sorted.length % 2 === 1)
        return sorted[mid];
    return (sorted[mid - 1] + sorted[mid]) / 2;
}
function top10Mean(sorted) {
    if (sorted.length === 0)
        return 0;
    const n = Math.max(1, Math.ceil(sorted.length * 0.1));
    const slice = sorted.slice(-n);
    return slice.reduce((a, b) => a + b, 0) / slice.length;
}
function previousMonthKey(monthKey) {
    return (0, nbaPeriod_1.previousLabel)("monthly", monthKey);
}
/** 月に重なるピックアップ試合数（週 doc の gameIds 和集合） */
async function resolvePickupGameCount(monthKey) {
    var _a;
    const range = (0, nbaPeriod_1.rangeForLabel)("monthly", monthKey);
    // 月初の週月曜〜月末をカバーする weekKey を列挙
    const weekKeys = [];
    let cursor = range.startKey;
    // 月曜揃え
    const [y, m, d] = cursor.split("-").map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d));
    const daysSinceMonday = (dt.getUTCDay() + 6) % 7;
    cursor = (0, nbaPeriod_1.addDaysToDateKey)(cursor, -daysSinceMonday);
    while (cursor <= range.endKey) {
        weekKeys.push(cursor);
        cursor = (0, nbaPeriod_1.addDaysToDateKey)(cursor, 7);
    }
    const refs = weekKeys.map((wk) => db().collection("nba_pickup_weeks").doc(wk));
    if (refs.length === 0)
        return { pickupGameCount: 0, pickupGameIds: [] };
    const snaps = await db().getAll(...refs);
    const idSet = new Set();
    for (const snap of snaps) {
        if (!snap.exists)
            continue;
        const data = (_a = snap.data()) !== null && _a !== void 0 ? _a : {};
        if (data.status !== "final" && data.status !== "draft")
            continue;
        const ids = Array.isArray(data.gameIds) ? data.gameIds : [];
        for (const id of ids) {
            if (typeof id === "string" && id)
                idSet.add(id);
        }
    }
    const pickupGameIds = [...idSet];
    return { pickupGameCount: pickupGameIds.length, pickupGameIds };
}
async function loadPeriodRanks(monthKey) {
    var _a;
    const firestore = db();
    const refs = PERIOD_METRICS.map((metric) => firestore
        .collection("period_ranking_snapshots")
        .doc(`nba_monthly_${monthKey}_${metric}`));
    const snaps = await firestore.getAll(...refs);
    const ranks = {};
    let participantCount = 0;
    PERIOD_METRICS.forEach((metric, i) => {
        var _a, _b, _c;
        const data = ((_a = snaps[i]) === null || _a === void 0 ? void 0 : _a.exists) ? (_b = snaps[i].data()) !== null && _b !== void 0 ? _b : {} : {};
        ranks[metric] =
            data.ranks && typeof data.ranks === "object"
                ? data.ranks
                : {};
        if (metric === "totalPoints") {
            participantCount = Number((_c = data.count) !== null && _c !== void 0 ? _c : 0) || Object.keys(ranks[metric]).length;
        }
    });
    const prevKey = previousMonthKey(monthKey);
    const prevSnap = await firestore
        .collection("period_ranking_snapshots")
        .doc(`nba_monthly_${prevKey}_totalPoints`)
        .get();
    const prevPointsRanks = prevSnap.exists && ((_a = prevSnap.data()) === null || _a === void 0 ? void 0 : _a.ranks)
        ? prevSnap.data().ranks
        : {};
    return { ranks, prevPointsRanks, participantCount };
}
function toDateKeyJstFromDate(d) {
    const j = new Date(d.getTime() + 9 * 60 * 60 * 1000);
    const y = j.getUTCFullYear();
    const m = String(j.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(j.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${dd}`;
}
function numOr(v, fallback = 0) {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
}
function metricRow(key, value, prev, med, top10, rank) {
    return {
        key,
        value,
        prevDelta: prev == null ? null : value - prev,
        median: med,
        top10,
        rank,
    };
}
/**
 * @param monthKey YYYY-MM。省略時は前月 JST。
 */
async function rebuildMonthlyReportsCore(opts) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10, _11, _12, _13;
    const now = new Date();
    const currentMonth = (0, nbaPeriod_1.monthLabelJST)(now);
    const monthKey = (_a = opts === null || opts === void 0 ? void 0 : opts.monthKey) !== null && _a !== void 0 ? _a : (0, nbaPeriod_1.previousLabel)("monthly", currentMonth);
    const range = (0, nbaPeriod_1.rangeForLabel)("monthly", monthKey, now);
    // 確定月は月末までフル範囲
    const [y, m] = monthKey.split("-").map(Number);
    const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
    const fullEnd = `${y}-${String(m).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
    const startKey = range.startKey;
    const endKey = fullEnd;
    const { pickupGameCount, pickupGameIds } = await resolvePickupGameCount(monthKey);
    const pickupSet = new Set(pickupGameIds);
    const { ranks, prevPointsRanks, participantCount } = await loadPeriodRanks(monthKey);
    const prevMonthKey = previousMonthKey(monthKey);
    const [aggByUid, prevAggByUid] = await Promise.all([
        loadMonthAggByUid(monthKey),
        loadMonthAggByUid(prevMonthKey),
    ]);
    // posts 1 パス: チーム相性 + ハイライト + クセ（ピックアップのみ）
    const teamAffinityByUid = new Map();
    const highlightEventsByUid = new Map();
    const habitsRawByUid = new Map();
    if (pickupSet.size > 0) {
        const settledStart = new Date(`${startKey}T00:00:00+09:00`);
        const settledEnd = new Date(`${endKey}T23:59:59.999+09:00`);
        const postSnap = await db()
            .collection("posts")
            .where("status", "==", "final")
            .where("settledAt", ">=", settledStart)
            .where("settledAt", "<=", settledEnd)
            .get();
        for (const doc of postSnap.docs) {
            const p = doc.data();
            const uid = p.authorUid;
            if (!uid)
                continue;
            const league = String((_c = (_b = p.league) !== null && _b !== void 0 ? _b : p.sportLeague) !== null && _c !== void 0 ? _c : "nba").toLowerCase();
            if (league && league !== "nba")
                continue;
            const gameId = String((_d = p.gameId) !== null && _d !== void 0 ? _d : "");
            if (!gameId || !pickupSet.has(gameId))
                continue;
            const pick = (_e = p.prediction) === null || _e === void 0 ? void 0 : _e.winner;
            const isWin = ((_f = p.stats) === null || _f === void 0 ? void 0 : _f.isWin) === true;
            const homeId = ((_g = p.home) === null || _g === void 0 ? void 0 : _g.teamId) ? String(p.home.teamId) : "";
            const awayId = ((_h = p.away) === null || _h === void 0 ? void 0 : _h.teamId) ? String(p.away.teamId) : "";
            const homeAbbr = ((_j = p.home) === null || _j === void 0 ? void 0 : _j.abbr) ||
                ((_k = p.home) === null || _k === void 0 ? void 0 : _k.shortName) ||
                (homeId ? (0, resolveNbaTeamAbbr_1.resolveNbaTeamAbbr)(homeId) : "HOME");
            const awayAbbr = ((_l = p.away) === null || _l === void 0 ? void 0 : _l.abbr) ||
                ((_m = p.away) === null || _m === void 0 ? void 0 : _m.shortName) ||
                (awayId ? (0, resolveNbaTeamAbbr_1.resolveNbaTeamAbbr)(awayId) : "AWAY");
            const settledAt = ((_p = (_o = p.settledAt) === null || _o === void 0 ? void 0 : _o.toDate) === null || _p === void 0 ? void 0 : _p.call(_o)) instanceof Date
                ? p.settledAt.toDate()
                : settledStart;
            const resultHome = numOr((_r = (_q = p.result) === null || _q === void 0 ? void 0 : _q.home) !== null && _r !== void 0 ? _r : (_s = p.result) === null || _s === void 0 ? void 0 : _s.homeScore, 0);
            const resultAway = numOr((_u = (_t = p.result) === null || _t === void 0 ? void 0 : _t.away) !== null && _u !== void 0 ? _u : (_v = p.result) === null || _v === void 0 ? void 0 : _v.awayScore, 0);
            const myHome = numOr((_x = (_w = p.prediction) === null || _w === void 0 ? void 0 : _w.score) === null || _x === void 0 ? void 0 : _x.home, 0);
            const myAway = numOr((_z = (_y = p.prediction) === null || _y === void 0 ? void 0 : _y.score) === null || _z === void 0 ? void 0 : _z.away, 0);
            if (!highlightEventsByUid.has(uid)) {
                highlightEventsByUid.set(uid, []);
            }
            highlightEventsByUid.get(uid).push({
                settledAtMs: settledAt.getTime(),
                dateKey: toDateKeyJstFromDate(settledAt),
                points: numOr((_0 = p.stats) === null || _0 === void 0 ? void 0 : _0.pointsV3, 0),
                isWin,
                upsetPoints: numOr((_1 = p.stats) === null || _1 === void 0 ? void 0 : _1.upsetPoints, 0),
                home: {
                    teamId: homeId || "home",
                    abbr: homeAbbr,
                    score: resultHome,
                },
                away: {
                    teamId: awayId || "away",
                    abbr: awayAbbr,
                    score: resultAway,
                },
                myHome,
                myAway,
            });
            // 予想のクセ
            if (!habitsRawByUid.has(uid)) {
                habitsRawByUid.set(uid, emptyHabitsRaw());
            }
            const habit = habitsRawByUid.get(uid);
            if (pick === "home") {
                habit.home.posts += 1;
                if (isWin)
                    habit.home.wins += 1;
            }
            else if (pick === "away") {
                habit.away.posts += 1;
                if (isWin)
                    habit.away.wins += 1;
            }
            const majority = (_2 = p.marketMeta) === null || _2 === void 0 ? void 0 : _2.majoritySide;
            if (majority && pick && (pick === "home" || pick === "away")) {
                if (pick === majority) {
                    habit.favorite.posts += 1;
                    if (isWin)
                        habit.favorite.wins += 1;
                }
                else {
                    habit.underdog.posts += 1;
                    if (isWin)
                        habit.underdog.wins += 1;
                }
            }
            const side = pick === "home" ? p.home : pick === "away" ? p.away : null;
            const teamId = (side === null || side === void 0 ? void 0 : side.teamId) ? String(side.teamId) : "";
            if (!teamId)
                continue;
            if (!teamAffinityByUid.has(uid)) {
                teamAffinityByUid.set(uid, new Map());
            }
            const abbr = (side === null || side === void 0 ? void 0 : side.abbr) ||
                (side === null || side === void 0 ? void 0 : side.shortName) ||
                (0, resolveNbaTeamAbbr_1.resolveNbaTeamAbbr)(teamId);
            (0, buildMonthlyTeamAffinity_1.accumulateTeamAffinityPost)(teamAffinityByUid.get(uid), {
                teamId,
                abbr,
                isWin,
                points: numOr((_3 = p.stats) === null || _3 === void 0 ? void 0 : _3.pointsV3, 0),
            });
        }
    }
    let uids = [...aggByUid.keys()].filter((uid) => { var _a, _b; return ((_b = (_a = aggByUid.get(uid)) === null || _a === void 0 ? void 0 : _a.posts) !== null && _b !== void 0 ? _b : 0) > 0; });
    if ((opts === null || opts === void 0 ? void 0 : opts.limit) != null)
        uids = uids.slice(0, opts.limit);
    const sampleMinPosts = pickupGameCount > 0 ? Math.ceil(pickupGameCount * 0.5) : 10;
    const rows = uids.map((uid) => {
        var _a;
        const agg = aggByUid.get(uid);
        const winRate = agg.posts > 0 ? agg.wins / agg.posts : 0;
        const activityRate = pickupGameCount > 0
            ? Math.min(1, agg.posts / pickupGameCount)
            : agg.posts >= 10
                ? 1
                : agg.posts / 10;
        const streak = calcStreakFromEvents((_a = highlightEventsByUid.get(uid)) !== null && _a !== void 0 ? _a : []);
        return {
            uid,
            agg,
            winRate,
            activityRate,
            sampleEligible: agg.posts >= sampleMinPosts,
            maxWinStreak: streak.maxWin,
            maxLoseStreak: streak.maxLose,
            stamina: staminaRaw(streak.maxWin, streak.maxLose),
        };
    });
    const cohort = rows.filter((r) => r.sampleEligible);
    const sortNums = (xs) => [...xs].sort((a, b) => a - b);
    const winRates = sortNums(cohort.map((r) => r.winRate));
    const scorers = sortNums(cohort.map((r) => r.agg.scorer));
    const upsets = sortNums(cohort.map((r) => r.agg.upset));
    const activities = sortNums(cohort.map((r) => r.activityRate));
    const pointsArr = sortNums(cohort.map((r) => r.agg.points));
    const postsArr = sortNums(cohort.map((r) => r.agg.posts));
    const staminaArr = sortNums(cohort.map((r) => r.stamina));
    const scorerMedian = median(scorers);
    const upsetMedian = median(upsets);
    const WRITE_CHUNK = 400;
    let written = 0;
    const writtenUids = [];
    for (let offset = 0; offset < rows.length; offset += WRITE_CHUNK) {
        const chunk = rows.slice(offset, offset + WRITE_CHUNK);
        const batch = db().batch();
        for (const row of chunk) {
            const { uid, agg, winRate, activityRate, sampleEligible, maxLoseStreak, stamina, } = row;
            const consistencyPct = percentile(staminaArr, stamina);
            const radarPercentiles = {
                win: percentile(winRates, winRate),
                scorer: percentile(scorers, agg.scorer),
                upset: percentile(upsets, agg.upset),
                activity: percentile(activities, activityRate),
                consistency: consistencyPct,
            };
            const strengthInput = {
                win: { percentile: radarPercentiles.win, winRate },
                scorer: {
                    percentile: radarPercentiles.scorer,
                    scorerHits: agg.scorer,
                    scorerMedian,
                },
                upset: {
                    percentile: radarPercentiles.upset,
                    upsetPoints: agg.upset,
                    upsetMedian,
                    // V1 proxy: 投稿数を機会の上限として使う
                    upsetOpportunity: Math.max(agg.posts, agg.upset > 0 ? 5 : 0),
                },
                activity: {
                    percentile: radarPercentiles.activity,
                    activityRate,
                },
                consistency: {
                    percentile: radarPercentiles.consistency,
                    maxLoseStreak,
                },
            };
            const strengths = sampleEligible
                ? (0, monthlyRadarJudge_1.collectMonthlyRadarStrengths)(strengthInput)
                : [];
            const analysisTypeId = (0, monthlyRadarJudge_1.judgeMonthlyAnalysisType)({
                strengths,
                sampleEligible,
            });
            const radar = (0, monthlyRadarJudge_1.buildMonthlyRadarPercentiles)(strengthInput);
            const pointsRank = (_4 = ranks.totalPoints[uid]) !== null && _4 !== void 0 ? _4 : null;
            const prevRank = (_5 = prevPointsRanks[uid]) !== null && _5 !== void 0 ? _5 : null;
            const rank = pointsRank !== null && pointsRank !== void 0 ? pointsRank : (participantCount > 0 ? participantCount : rows.length);
            const rankDeltaPlaces = prevRank != null && pointsRank != null ? prevRank - pointsRank : null;
            const topPercent = participantCount > 0 && pointsRank != null
                ? (pointsRank / participantCount) * 100
                : null;
            const prevAgg = (_6 = prevAggByUid.get(uid)) !== null && _6 !== void 0 ? _6 : null;
            const prevPosts = prevAgg != null ? prevAgg.posts : null;
            const prevWinRatePct = prevAgg != null && prevAgg.posts > 0
                ? (prevAgg.wins / prevAgg.posts) * 100
                : null;
            const prevPoints = prevAgg != null ? prevAgg.points : null;
            const prevScorer = prevAgg != null ? prevAgg.scorer : null;
            const prevUpset = prevAgg != null ? prevAgg.upset : null;
            const metrics = [
                metricRow("posts", agg.posts, prevPosts, median(postsArr), top10Mean(postsArr), null),
                metricRow("winRate", winRate * 100, prevWinRatePct, median(winRates) * 100, top10Mean(winRates) * 100, null),
                metricRow("units", 0, null, null, null, null),
                metricRow("points", agg.points, prevPoints, median(pointsArr), top10Mean(pointsArr), (_7 = ranks.totalPoints[uid]) !== null && _7 !== void 0 ? _7 : null),
                metricRow("goalScorerHits", agg.scorer, prevScorer, scorerMedian, top10Mean(scorers), (_8 = ranks.totalGoalScorerHits[uid]) !== null && _8 !== void 0 ? _8 : null),
                metricRow("upsetPoints", agg.upset, prevUpset, upsetMedian, top10Mean(upsets), (_9 = ranks.totalUpset[uid]) !== null && _9 !== void 0 ? _9 : null),
            ];
            const teamMap = teamAffinityByUid.get(uid);
            const teamAffinity = teamMap
                ? (0, buildMonthlyTeamAffinity_1.buildMonthlyTeamAffinity)([...teamMap.values()])
                : { strong: [], weak: [] };
            const habitsRaw = habitsRawByUid.get(uid);
            const habits = habitsRaw
                ? (0, buildMonthlyHabits_1.buildMonthlyHabits)(Object.assign(Object.assign({}, habitsRaw), { winRate }))
                : null;
            const highlights = (0, buildMonthlyHighlights_1.buildMonthlyHighlights)((_10 = highlightEventsByUid.get(uid)) !== null && _10 !== void 0 ? _10 : [], {
                winRate: (_11 = ranks.winRate[uid]) !== null && _11 !== void 0 ? _11 : null,
                goalScorerHits: (_12 = ranks.totalGoalScorerHits[uid]) !== null && _12 !== void 0 ? _12 : null,
                upset: (_13 = ranks.totalUpset[uid]) !== null && _13 !== void 0 ? _13 : null,
            });
            const outlook = (0, buildMonthlyOutlookSummary_1.buildMonthlyOutlookSummary)({
                sampleEligible,
                strengths,
                radar,
                facts: {
                    winRate,
                    posts: agg.posts,
                    scorerHits: agg.scorer,
                    upsetPoints: agg.upset,
                    activityRate,
                    prevDelta: {
                        win: prevWinRatePct != null
                            ? winRate * 100 - prevWinRatePct
                            : null,
                        scorer: prevScorer != null ? agg.scorer - prevScorer : null,
                        upset: prevUpset != null ? agg.upset - prevUpset : null,
                        points: prevPoints != null ? agg.points - prevPoints : null,
                    },
                },
            });
            const reportDoc = {
                uid,
                league: "nba",
                monthKey,
                status: "final",
                sampleEligible,
                strengths,
                participantCount: participantCount || rows.length,
                rank,
                prevRank,
                rankDeltaPlaces,
                topPercent,
                totalPoints: agg.points,
                totalPosts: agg.posts,
                totalWins: agg.wins,
                unitsEarned: 0, // MONTHLY_REPORT_UNITS_FROM_LEDGER 後に loadMonthlyUnitsFromLedger 接続
                unitsEarnedRank: null,
                analysisTypeId,
                metrics,
                radar,
                habits,
                unitsBreakdown: [],
                teamAffinity,
                highlights,
                outlook,
                pickupGameCount,
                builtAt: firestore_1.FieldValue.serverTimestamp(),
                updatedAt: firestore_1.FieldValue.serverTimestamp(),
            };
            const ref = db().collection("user_reports").doc(`${uid}_monthly_${monthKey}`);
            batch.set(ref, reportDoc, { merge: true });
            written++;
            writtenUids.push(uid);
        }
        await batch.commit();
    }
    return { monthKey, written, writtenUids };
}
//# sourceMappingURL=buildMonthlyReportsCore.js.map