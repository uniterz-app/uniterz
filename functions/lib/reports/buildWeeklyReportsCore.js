"use strict";
// NBA weekly report builder — period ranking snapshots + user_reports.
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildWeeklyReportsCore = buildWeeklyReportsCore;
const firestore_1 = require("firebase-admin/firestore");
const nbaSeason_1 = require("../rankings/nbaSeason");
const nbaPeriod_1 = require("../rankings/nbaPeriod");
const weeklyReportTypes_1 = require("./weeklyReportTypes");
const METRICS = [
    "totalPoints",
    "winRate",
    "totalUpset",
    "totalGoalScorerHits",
];
const PROFILE_CHUNK = 80;
const WRITE_CHUNK = 400;
function db() {
    return (0, firestore_1.getFirestore)();
}
function emptyAgg() {
    return {
        posts: 0,
        wins: 0,
        totalPoints: 0,
        totalUpset: 0,
        totalGoalScorerHits: 0,
    };
}
function num(v) {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
}
function addDaily(agg, data) {
    var _a;
    const bySeason = data.rankingBySeason;
    const leagues = data.leagues;
    const inc = (_a = bySeason === null || bySeason === void 0 ? void 0 : bySeason[nbaSeason_1.CURRENT_NBA_SEASON_KEY]) !== null && _a !== void 0 ? _a : leagues === null || leagues === void 0 ? void 0 : leagues.nba;
    if (!inc || typeof inc !== "object")
        return;
    agg.posts += num(inc.posts);
    agg.wins += num(inc.wins);
    agg.totalPoints += num(inc.pointsSumV3);
    agg.totalUpset += num(inc.upsetPointsSum);
    agg.totalGoalScorerHits += num(inc.goalScorerHitCount);
}
function uidFromDailyDoc(docId, dateKey) {
    const suffix = `_${dateKey}`;
    if (dateKey && docId.endsWith(suffix))
        return docId.slice(0, -suffix.length);
    const i = docId.lastIndexOf("_");
    return i > 0 ? docId.slice(0, i) : null;
}
function asRanks(data) {
    const source = data === null || data === void 0 ? void 0 : data.ranks;
    if (!source || typeof source !== "object")
        return {};
    const result = {};
    for (const [uid, rank] of Object.entries(source)) {
        const n = Number(rank);
        if (Number.isFinite(n) && n > 0)
            result[uid] = n;
    }
    return result;
}
function asRows(data) {
    const result = new Map();
    const rows = Array.isArray(data === null || data === void 0 ? void 0 : data.rows) ? data.rows : [];
    for (const raw of rows) {
        if (!raw || typeof raw !== "object")
            continue;
        const r = raw;
        const uid = typeof r.uid === "string" ? r.uid : "";
        if (!uid)
            continue;
        result.set(uid, {
            uid,
            posts: num(r.totalPosts),
            wins: num(r.totalWins),
            totalPoints: num(r.totalPoints),
            totalUpset: num(r.totalUpset),
            totalGoalScorerHits: num(r.totalGoalScorerHits),
            winRate: num(r.winRate),
            displayName: typeof r.displayName === "string" ? r.displayName : undefined,
            photoURL: typeof r.photoURL === "string" ? r.photoURL : null,
        });
    }
    return result;
}
async function loadPeriodSnapshots(label) {
    const refs = METRICS.map((metric) => db().collection("period_ranking_snapshots").doc(`nba_weekly_${label}_${metric}`));
    const snaps = await db().getAll(...refs);
    const ranks = {};
    const rows = new Map();
    let participantCount = 0;
    snaps.forEach((snap, index) => {
        const data = (snap.exists ? snap.data() : {});
        const metric = METRICS[index];
        ranks[metric] = asRanks(data);
        if (metric === "totalPoints")
            participantCount = num(data.count);
        for (const [uid, row] of asRows(data)) {
            if (!rows.has(uid) || metric === "totalPoints")
                rows.set(uid, row);
        }
    });
    return { ranks, rows, participantCount };
}
async function loadAggs(range, snapshotRows) {
    var _a;
    const stats = await db()
        .collection("user_stats_v2_daily")
        .where("date", ">=", range.startKey)
        .where("date", "<=", range.endKey)
        .get();
    const aggs = new Map();
    for (const doc of stats.docs) {
        const data = doc.data();
        const uid = uidFromDailyDoc(doc.id, String((_a = data.date) !== null && _a !== void 0 ? _a : ""));
        if (!uid || snapshotRows.has(uid))
            continue;
        if (!aggs.has(uid))
            aggs.set(uid, emptyAgg());
        addDaily(aggs.get(uid), data);
    }
    for (const [uid, row] of snapshotRows) {
        aggs.set(uid, {
            posts: row.posts,
            wins: row.wins,
            totalPoints: row.totalPoints,
            totalUpset: row.totalUpset,
            totalGoalScorerHits: row.totalGoalScorerHits,
        });
    }
    return aggs;
}
async function loadProfiles(uids, snapshotRows) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
    const profiles = new Map();
    for (const [uid, row] of snapshotRows) {
        if (row.displayName) {
            profiles.set(uid, {
                displayName: row.displayName,
                photoURL: (_a = row.photoURL) !== null && _a !== void 0 ? _a : null,
                plan: "free",
            });
        }
    }
    const nowMs = Date.now();
    for (let i = 0; i < uids.length; i += PROFILE_CHUNK) {
        const slice = uids.slice(i, i + PROFILE_CHUNK);
        const snaps = await db().getAll(...slice.flatMap((uid) => [
            db().collection("cumulative_stats").doc(uid),
            db().collection("users").doc(uid),
        ]));
        for (let j = 0; j < slice.length; j++) {
            const cumulative = snaps[j * 2];
            const user = snaps[j * 2 + 1];
            const c = (cumulative === null || cumulative === void 0 ? void 0 : cumulative.exists) ? (_b = cumulative.data()) !== null && _b !== void 0 ? _b : {} : {};
            const u = (user === null || user === void 0 ? void 0 : user.exists) ? (_c = user.data()) !== null && _c !== void 0 ? _c : {} : {};
            const displayName = String((_g = (_e = (_d = c.displayName) !== null && _d !== void 0 ? _d : u.displayName) !== null && _e !== void 0 ? _e : (_f = profiles.get(slice[j])) === null || _f === void 0 ? void 0 : _f.displayName) !== null && _g !== void 0 ? _g : "user");
            const photo = (_l = (_j = (_h = c.photoURL) !== null && _h !== void 0 ? _h : u.photoURL) !== null && _j !== void 0 ? _j : (_k = profiles.get(slice[j])) === null || _k === void 0 ? void 0 : _k.photoURL) !== null && _l !== void 0 ? _l : null;
            let plan = "free";
            if (u.plan === "pro") {
                const until = u.proUntil;
                if (!(until &&
                    typeof until.toMillis === "function" &&
                    until.toMillis() <= nowMs)) {
                    plan = "pro";
                }
            }
            profiles.set(slice[j], {
                displayName,
                photoURL: typeof photo === "string" ? photo : null,
                plan,
            });
        }
    }
    return profiles;
}
async function loadReports(uids, label, previousWeek) {
    const existing = new Map();
    const priorFinal = new Map();
    for (let i = 0; i < uids.length; i += PROFILE_CHUNK) {
        const slice = uids.slice(i, i + PROFILE_CHUNK);
        const snaps = await db().getAll(...slice.flatMap((uid) => [
            db().collection("user_reports").doc(`${uid}_weekly_${label}`),
            db().collection("user_reports").doc(`${uid}_weekly_${previousWeek}`),
        ]));
        slice.forEach((uid, j) => {
            var _a;
            const current = snaps[j * 2];
            const previous = snaps[j * 2 + 1];
            if (current === null || current === void 0 ? void 0 : current.exists)
                existing.set(uid, current.data());
            if ((previous === null || previous === void 0 ? void 0 : previous.exists) && ((_a = previous.data()) === null || _a === void 0 ? void 0 : _a.status) === "final") {
                priorFinal.set(uid, previous.data());
            }
        });
    }
    return { existing, priorFinal };
}
function divisions(agg, previous) {
    const priorByKey = new Map((Array.isArray(previous === null || previous === void 0 ? void 0 : previous.divisions) ? previous.divisions : []).map((d) => [d.key, d]));
    const winRate = agg.posts > 0 ? (agg.wins / agg.posts) * 100 : 0;
    const division = (key, value, minPosts) => {
        var _a, _b;
        const qualified = agg.posts >= minPosts;
        return {
            key,
            value,
            prevValue: (_b = (_a = priorByKey.get(key)) === null || _a === void 0 ? void 0 : _a.value) !== null && _b !== void 0 ? _b : null,
            rank: null,
            postsToQualify: qualified ? null : minPosts - agg.posts,
        };
    };
    const result = [
        division("winRate", winRate, (0, nbaPeriod_1.periodWinRateMinPosts)("weekly")),
        division("goalScorerHits", agg.totalGoalScorerHits, (0, nbaPeriod_1.periodMinPosts)("weekly")),
        division("upset", agg.totalUpset, (0, nbaPeriod_1.periodMinPosts)("weekly")),
    ];
    return result;
}
function rival(uid, rank, profiles) {
    var _a, _b, _c;
    const profile = profiles.get(uid);
    return {
        uid,
        rank,
        displayName: (_a = profile === null || profile === void 0 ? void 0 : profile.displayName) !== null && _a !== void 0 ? _a : "user",
        photoURL: (_b = profile === null || profile === void 0 ? void 0 : profile.photoURL) !== null && _b !== void 0 ? _b : null,
        plan: (_c = profile === null || profile === void 0 ? void 0 : profile.plan) !== null && _c !== void 0 ? _c : "free",
    };
}
function buildComment(input) {
    const tone = input.rankDelta == null
        ? "firstWeek"
        : input.rankDelta >= 10
            ? "climbedBig"
            : input.rankDelta > 0
                ? "climbed"
                : input.rankDelta < 0
                    ? "dropped"
                    : "held";
    if (input.nextTarget && input.nextTarget.pointsBehind <= 2) {
        return { tone, factor: { kind: "targetGap", rank: input.nextTarget.rival.rank, displayName: input.nextTarget.rival.displayName, pointsBehind: input.nextTarget.pointsBehind } };
    }
    if (input.rankDelta != null && input.rankDelta < 0 && input.overtakenBy[0]) {
        return { tone, factor: { kind: "overtakenBy", displayName: input.overtakenBy[0].displayName } };
    }
    const changed = input.divisions
        .map((d) => ({ division: d.key, delta: d.prevValue == null ? 0 : d.value - d.prevValue }))
        .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))[0];
    if (changed && changed.delta > 0)
        return { tone, factor: { kind: "divisionUp", division: changed.division } };
    if (changed && changed.delta < 0)
        return { tone, factor: { kind: "divisionDown", division: changed.division } };
    if (input.previousPosts != null && input.previousPosts - input.posts >= 3 && input.posts * 2 <= input.previousPosts) {
        return { tone, factor: { kind: "lowVolume", posts: input.posts } };
    }
    return { tone, factor: { kind: "none" } };
}
async function buildWeeklyReportsCore(opts) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
    const now = (_a = opts === null || opts === void 0 ? void 0 : opts.now) !== null && _a !== void 0 ? _a : new Date();
    const status = (_b = opts === null || opts === void 0 ? void 0 : opts.status) !== null && _b !== void 0 ? _b : "final";
    const weekLabel = (_c = opts === null || opts === void 0 ? void 0 : opts.weekLabel) !== null && _c !== void 0 ? _c : (0, nbaPeriod_1.weekStartDateKeyJST)(now);
    const range = (0, nbaPeriod_1.rangeForLabel)("weekly", weekLabel, now);
    const previousWeek = (0, nbaPeriod_1.previousLabel)("weekly", weekLabel);
    const [current, prior] = await Promise.all([
        loadPeriodSnapshots(weekLabel),
        loadPeriodSnapshots(previousWeek),
    ]);
    if (Object.keys(current.ranks.totalPoints).length === 0) {
        console.warn(`[buildWeeklyReportsCore] no totalPoints snapshot for ${weekLabel}`);
        return { weekLabel, status, written: 0 };
    }
    const aggs = await loadAggs(range, current.rows);
    let uids = Object.keys(current.ranks.totalPoints).filter((uid) => { var _a, _b; return ((_b = (_a = aggs.get(uid)) === null || _a === void 0 ? void 0 : _a.posts) !== null && _b !== void 0 ? _b : 0) >= (0, nbaPeriod_1.periodMinPosts)("weekly"); });
    if ((opts === null || opts === void 0 ? void 0 : opts.limit) != null)
        uids = uids.slice(0, Math.max(0, opts.limit));
    const [profiles, reportHistory] = await Promise.all([
        loadProfiles(uids, current.rows),
        loadReports(uids, weekLabel, previousWeek),
    ]);
    const todayKey = (0, nbaPeriod_1.dateKeyJST)(now);
    const ranked = [...uids].sort((a, b) => current.ranks.totalPoints[a] - current.ranks.totalPoints[b]);
    const indexByUid = new Map(ranked.map((uid, index) => [uid, index]));
    let written = 0;
    for (let offset = 0; offset < uids.length; offset += WRITE_CHUNK) {
        const batch = db().batch();
        for (const uid of uids.slice(offset, offset + WRITE_CHUNK)) {
            const agg = aggs.get(uid);
            const existing = reportHistory.existing.get(uid);
            const priorFinal = reportHistory.priorFinal.get(uid);
            const yesterdayLive = status === "live" &&
                (existing === null || existing === void 0 ? void 0 : existing.status) === "live" &&
                existing.snapshotDateKey &&
                existing.snapshotDateKey < todayKey
                ? existing
                : undefined;
            const priorSnapshotRow = prior.rows.get(uid);
            const snapshotComparison = priorSnapshotRow
                ? {
                    totalPoints: priorSnapshotRow.totalPoints,
                    totalPosts: priorSnapshotRow.posts,
                    divisions: [
                        {
                            key: "winRate",
                            value: priorSnapshotRow.posts > 0
                                ? (priorSnapshotRow.wins / priorSnapshotRow.posts) * 100
                                : 0,
                            prevValue: null,
                            rank: null,
                            postsToQualify: null,
                        },
                        {
                            key: "goalScorerHits",
                            value: priorSnapshotRow.totalGoalScorerHits,
                            prevValue: null,
                            rank: null,
                            postsToQualify: null,
                        },
                        {
                            key: "upset",
                            value: priorSnapshotRow.totalUpset,
                            prevValue: null,
                            rank: null,
                            postsToQualify: null,
                        },
                    ],
                }
                : undefined;
            const comparison = status === "final"
                ? priorFinal !== null && priorFinal !== void 0 ? priorFinal : snapshotComparison
                : (_d = yesterdayLive !== null && yesterdayLive !== void 0 ? yesterdayLive : priorFinal) !== null && _d !== void 0 ? _d : snapshotComparison;
            const rank = current.ranks.totalPoints[uid];
            const prevRank = (_f = (_e = comparison === null || comparison === void 0 ? void 0 : comparison.rank) !== null && _e !== void 0 ? _e : prior.ranks.totalPoints[uid]) !== null && _f !== void 0 ? _f : null;
            const rankDeltaPlaces = prevRank == null ? null : prevRank - rank;
            const divs = divisions(agg, comparison);
            divs[0].rank = agg.posts >= (0, nbaPeriod_1.periodWinRateMinPosts)("weekly") ? (_g = current.ranks.winRate[uid]) !== null && _g !== void 0 ? _g : null : null;
            divs[1].rank = agg.posts >= (0, nbaPeriod_1.periodMinPosts)("weekly") ? (_h = current.ranks.totalGoalScorerHits[uid]) !== null && _h !== void 0 ? _h : null : null;
            divs[2].rank = agg.posts >= (0, nbaPeriod_1.periodMinPosts)("weekly") ? (_j = current.ranks.totalUpset[uid]) !== null && _j !== void 0 ? _j : null : null;
            const prevRanks = prior.ranks.totalPoints;
            const overtakenIds = ranked.filter((other) => other !== uid && prevRanks[other] != null && prevRanks[uid] != null && prevRanks[other] < prevRanks[uid] && current.ranks.totalPoints[other] > rank);
            const overtakenByIds = ranked.filter((other) => other !== uid && prevRanks[other] != null && prevRanks[uid] != null && prevRanks[other] > prevRanks[uid] && current.ranks.totalPoints[other] < rank);
            const overtaken = overtakenIds.slice(0, weeklyReportTypes_1.MAX_REPORT_RIVALS).map((other) => rival(other, current.ranks.totalPoints[other], profiles));
            const overtakenBy = overtakenByIds.slice(0, weeklyReportTypes_1.MAX_REPORT_RIVALS).map((other) => rival(other, current.ranks.totalPoints[other], profiles));
            const rankIndex = indexByUid.get(uid);
            const above = ranked[rankIndex - 1];
            const below = ranked[rankIndex + 1];
            const nextTarget = above == null ? null : {
                rival: rival(above, current.ranks.totalPoints[above], profiles),
                pointsBehind: Math.max(0, aggs.get(above).totalPoints - agg.totalPoints),
            };
            const threat = below == null ? null : {
                rival: rival(below, current.ranks.totalPoints[below], profiles),
                pointsGap: Math.max(0, agg.totalPoints - aggs.get(below).totalPoints),
            };
            const report = {
                uid,
                type: "weekly",
                league: "nba",
                label: weekLabel,
                range: { startKey: range.startKey, endKey: range.endKey },
                status,
                snapshotDateKey: todayKey,
                participantCount: current.participantCount || ranked.length,
                rank,
                prevRank,
                rankDeltaPlaces,
                topPercent: (current.participantCount || ranked.length) > 0
                    ? (rank / (current.participantCount || ranked.length)) * 100
                    : null,
                totalPoints: agg.totalPoints,
                prevTotalPoints: (_k = comparison === null || comparison === void 0 ? void 0 : comparison.totalPoints) !== null && _k !== void 0 ? _k : null,
                totalPosts: agg.posts,
                totalWins: agg.wins,
                divisions: divs,
                overtaken,
                overtakenCount: overtakenIds.length,
                overtakenBy,
                overtakenByCount: overtakenByIds.length,
                nextTarget,
                threat,
                comment: buildComment({ rankDelta: rankDeltaPlaces, nextTarget, overtakenBy, divisions: divs, previousPosts: (_l = comparison === null || comparison === void 0 ? void 0 : comparison.totalPosts) !== null && _l !== void 0 ? _l : null, posts: agg.posts }),
                builtAt: firestore_1.FieldValue.serverTimestamp(),
                updatedAt: firestore_1.FieldValue.serverTimestamp(),
            };
            batch.set(db().collection("user_reports").doc(`${uid}_weekly_${weekLabel}`), report, { merge: true });
            written++;
        }
        await batch.commit();
    }
    return { weekLabel, status, written };
}
//# sourceMappingURL=buildWeeklyReportsCore.js.map