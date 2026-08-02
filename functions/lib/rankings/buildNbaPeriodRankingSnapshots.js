"use strict";
// functions/src/rankings/buildNbaPeriodRankingSnapshots.ts
// user_stats_v2_daily から NBA Weekly / Monthly ランキングを日次で確定 doc 化する。
// doc: period_ranking_snapshots/nba_{period}_{label}_{metric}
// 無差別級: period_ranking_snapshots/nba_open_{period}_{label}_{metric}（Pro のみ）
// 期間が終わると更新されなくなり、そのまま過去ランキングのアーカイブになる。
Object.defineProperty(exports, "__esModule", { value: true });
exports.periodSnapshotDocId = periodSnapshotDocId;
exports.buildNbaPeriodRankingSnapshots = buildNbaPeriodRankingSnapshots;
const firestore_1 = require("firebase-admin/firestore");
const nbaSeason_1 = require("./nbaSeason");
const nbaPeriod_1 = require("./nbaPeriod");
function db() {
    return (0, firestore_1.getFirestore)();
}
const PERIOD_METRICS = [
    "totalPoints",
    "winRate",
    "totalUpset",
    "totalGoalScorerHits",
];
const TOP_ROWS = 50;
function emptyAgg() {
    return {
        posts: 0,
        wins: 0,
        totalPoints: 0,
        totalUpset: 0,
        totalGoalScorerHits: 0,
    };
}
function addInc(agg, inc) {
    var _a, _b, _c, _d, _e;
    if (!inc || typeof inc !== "object")
        return;
    agg.posts += Number((_a = inc.posts) !== null && _a !== void 0 ? _a : 0) || 0;
    agg.wins += Number((_b = inc.wins) !== null && _b !== void 0 ? _b : 0) || 0;
    agg.totalPoints += Number((_c = inc.pointsSumV3) !== null && _c !== void 0 ? _c : 0) || 0;
    agg.totalUpset += Number((_d = inc.upsetPointsSum) !== null && _d !== void 0 ? _d : 0) || 0;
    agg.totalGoalScorerHits += Number((_e = inc.goalScorerHitCount) !== null && _e !== void 0 ? _e : 0) || 0;
}
/** シーズンスライス（rankingBySeason.<key>）優先、なければ leagues.nba */
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
function metricValue(row, metric) {
    if (metric === "winRate")
        return row.winRate;
    if (metric === "totalUpset")
        return row.totalUpset;
    if (metric === "totalGoalScorerHits")
        return row.totalGoalScorerHits;
    return row.totalPoints;
}
function periodSnapshotDocId(period, label, metric, division = "standard") {
    const prefix = division === "open" ? "nba_open" : "nba";
    return `${prefix}_${period}_${label}_${metric}`;
}
function periodKeyForDivision(period, division) {
    return division === "open" ? `nba_open_${period}` : `nba_${period}`;
}
/**
 * 既存 doc から順位変動の基準を決める。
 * - 前日以前に書かれた doc → その ranks を基準にする
 * - 当日すでに書かれた doc（cron 再実行）→ 基準を動かさず既存の prevRanks を引き継ぐ
 * - doc なし（期間リセット直後）→ 基準なし = 変動非表示
 */
function resolvePrevRankBasis(existing, todayKey) {
    var _a;
    if (!existing.exists)
        return { prevRanks: null, prevDateKey: null };
    const data = (_a = existing.data()) !== null && _a !== void 0 ? _a : {};
    const snapshotDateKey = typeof data.snapshotDateKey === "string" ? data.snapshotDateKey : null;
    if (snapshotDateKey === todayKey) {
        const prev = data.prevRanks;
        return {
            prevRanks: prev && typeof prev === "object"
                ? prev
                : null,
            prevDateKey: typeof data.prevDateKey === "string" ? data.prevDateKey : null,
        };
    }
    const ranks = data.ranks;
    return {
        prevRanks: ranks && typeof ranks === "object"
            ? ranks
            : null,
        prevDateKey: snapshotDateKey,
    };
}
async function buildOne(range, todayKey) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    const firestore = db();
    const minPosts = (0, nbaPeriod_1.periodMinPosts)(range.period);
    const winRateMin = (0, nbaPeriod_1.periodWinRateMinPosts)(range.period);
    const statsSnap = await firestore
        .collection("user_stats_v2_daily")
        .where("date", ">=", range.startKey)
        .where("date", "<=", range.endKey)
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
    const uids = [...aggByUid.keys()].filter((uid) => { var _a, _b; return ((_b = (_a = aggByUid.get(uid)) === null || _a === void 0 ? void 0 : _a.posts) !== null && _b !== void 0 ? _b : 0) >= minPosts; });
    // 表示用プロフィール（cumulative_stats に集約済み）
    const profileByUid = new Map();
    const CHUNK = 80;
    for (let i = 0; i < uids.length; i += CHUNK) {
        const slice = uids.slice(i, i + CHUNK);
        const refs = slice.map((uid) => firestore.collection("cumulative_stats").doc(uid));
        const snaps = await firestore.getAll(...refs);
        for (const snap of snaps) {
            if (!snap.exists)
                continue;
            const d = (_b = snap.data()) !== null && _b !== void 0 ? _b : {};
            profileByUid.set(snap.id, {
                displayName: String((_c = d.displayName) !== null && _c !== void 0 ? _c : "user"),
                handle: (_d = d.handle) !== null && _d !== void 0 ? _d : null,
                photoURL: (_e = d.photoURL) !== null && _e !== void 0 ? _e : null,
                countryCode: (_f = d.countryCode) !== null && _f !== void 0 ? _f : null,
                plan: (_g = d.plan) !== null && _g !== void 0 ? _g : null,
            });
        }
    }
    // 無差別級は users.plan を正とする（cumulative_stats の古さを避ける）
    const proUidSet = new Set();
    for (let i = 0; i < uids.length; i += CHUNK) {
        const slice = uids.slice(i, i + CHUNK);
        const refs = slice.map((uid) => firestore.collection("users").doc(uid));
        const snaps = await firestore.getAll(...refs);
        const nowMs = Date.now();
        for (let j = 0; j < snaps.length; j++) {
            const snap = snaps[j];
            if (!snap.exists)
                continue;
            const d = (_h = snap.data()) !== null && _h !== void 0 ? _h : {};
            if (d.plan !== "pro")
                continue;
            const until = d.proUntil;
            if (until && typeof until.toMillis === "function" && until.toMillis() <= nowMs) {
                continue;
            }
            proUidSet.add(slice[j]);
            const profile = profileByUid.get(slice[j]);
            if (profile)
                profile.plan = "pro";
        }
    }
    const allBaseRows = uids.map((uid) => {
        var _a, _b, _c, _d, _e;
        const agg = aggByUid.get(uid);
        const profile = profileByUid.get(uid);
        return {
            uid,
            displayName: (_a = profile === null || profile === void 0 ? void 0 : profile.displayName) !== null && _a !== void 0 ? _a : "user",
            handle: (_b = profile === null || profile === void 0 ? void 0 : profile.handle) !== null && _b !== void 0 ? _b : null,
            photoURL: (_c = profile === null || profile === void 0 ? void 0 : profile.photoURL) !== null && _c !== void 0 ? _c : null,
            countryCode: (_d = profile === null || profile === void 0 ? void 0 : profile.countryCode) !== null && _d !== void 0 ? _d : null,
            plan: (_e = profile === null || profile === void 0 ? void 0 : profile.plan) !== null && _e !== void 0 ? _e : null,
            totalPosts: agg.posts,
            totalWins: agg.wins,
            totalPoints: agg.totalPoints,
            totalUpset: agg.totalUpset,
            totalGoalScorerHits: agg.totalGoalScorerHits,
            totalPrecision: 0,
            activeWinStreak: 0,
            winRate: agg.posts > 0 ? agg.wins / agg.posts : 0,
        };
    });
    const divisions = ["standard", "open"];
    for (const division of divisions) {
        const baseRows = division === "open"
            ? allBaseRows.filter((r) => proUidSet.has(r.uid))
            : allBaseRows;
        await writePeriodDivisionSnapshots({
            firestore,
            range,
            todayKey,
            division,
            baseRows,
            winRateMin,
        });
    }
    console.log(`[buildNbaPeriodRankingSnapshots] ${range.period} ${range.labelKey} rows=${allBaseRows.length} open=${proUidSet.size}`);
}
async function writePeriodDivisionSnapshots(opts) {
    const { firestore, range, todayKey, division, baseRows, winRateMin } = opts;
    const metricRefs = PERIOD_METRICS.map((metric) => firestore
        .collection("period_ranking_snapshots")
        .doc(periodSnapshotDocId(range.period, range.labelKey, metric, division)));
    const existingSnaps = await firestore.getAll(...metricRefs);
    const prevBasisByMetric = new Map();
    PERIOD_METRICS.forEach((metric, i) => {
        prevBasisByMetric.set(metric, resolvePrevRankBasis(existingSnaps[i], todayKey));
    });
    const batch = firestore.batch();
    PERIOD_METRICS.forEach((metric, metricIndex) => {
        var _a;
        const eligible = metric === "winRate"
            ? baseRows.filter((r) => r.totalPosts >= winRateMin)
            : baseRows;
        const sorted = [...eligible].sort((a, b) => {
            const diff = metricValue(b, metric) - metricValue(a, metric);
            if (diff !== 0)
                return diff;
            if (metric === "winRate") {
                const postsDiff = b.totalPosts - a.totalPosts;
                if (postsDiff !== 0)
                    return postsDiff;
            }
            return b.totalPoints - a.totalPoints;
        });
        const basis = (_a = prevBasisByMetric.get(metric)) !== null && _a !== void 0 ? _a : {
            prevRanks: null,
            prevDateKey: null,
        };
        // 同値は同順位
        const ranks = {};
        let lastVal = null;
        let lastRank = 0;
        const rankedRows = [];
        sorted.forEach((row, i) => {
            var _a;
            const v = metricValue(row, metric);
            const rank = lastVal != null && v === lastVal ? lastRank : i + 1;
            lastVal = v;
            lastRank = rank;
            ranks[row.uid] = rank;
            if (rankedRows.length < TOP_ROWS) {
                const prevRank = (_a = basis.prevRanks) === null || _a === void 0 ? void 0 : _a[row.uid];
                rankedRows.push(Object.assign(Object.assign({}, row), { rank, rankDeltaPlaces: typeof prevRank === "number" && Number.isFinite(prevRank)
                        ? prevRank - rank
                        : null }));
            }
        });
        batch.set(metricRefs[metricIndex], {
            league: "nba",
            division,
            period: range.period,
            periodKey: periodKeyForDivision(range.period, division),
            label: range.labelKey,
            metric,
            range: { startKey: range.startKey, endKey: range.endKey },
            count: sorted.length,
            rows: rankedRows,
            ranks,
            // 圏外ユーザーの変動計算・翌日の基準引き継ぎ用
            prevRanks: basis.prevRanks,
            prevDateKey: basis.prevDateKey,
            snapshotDateKey: todayKey,
            updatedAt: firestore_1.FieldValue.serverTimestamp(),
        });
    });
    await batch.commit();
}
/**
 * 現在の週・月のスナップショットを再構築する。
 * 期間開始直後（猶予日数内）は前期間も再集計して遅延精算を反映する。
 */
async function buildNbaPeriodRankingSnapshots(now = new Date()) {
    const todayKey = (0, nbaPeriod_1.dateKeyJST)(now);
    const targets = [];
    const weekLabel = (0, nbaPeriod_1.weekStartDateKeyJST)(now);
    targets.push((0, nbaPeriod_1.rangeForLabel)("weekly", weekLabel, now));
    if (todayKey <= addGrace(weekLabel)) {
        targets.push((0, nbaPeriod_1.rangeForLabel)("weekly", (0, nbaPeriod_1.previousLabel)("weekly", weekLabel), now));
    }
    const monthLabel = (0, nbaPeriod_1.monthLabelJST)(now);
    targets.push((0, nbaPeriod_1.rangeForLabel)("monthly", monthLabel, now));
    if (todayKey <= addGrace(`${monthLabel}-01`)) {
        targets.push((0, nbaPeriod_1.rangeForLabel)("monthly", (0, nbaPeriod_1.previousLabel)("monthly", monthLabel), now));
    }
    for (const range of targets) {
        try {
            await buildOne(range, todayKey);
        }
        catch (err) {
            console.error(`[buildNbaPeriodRankingSnapshots] failed ${range.period} ${range.labelKey}`, err);
        }
    }
}
/** 期間開始日 + 猶予日数の dateKey */
function addGrace(periodStartKey) {
    const [y, m, d] = periodStartKey.split("-").map(Number);
    const base = new Date(Date.UTC(y, m - 1, d + nbaPeriod_1.PERIOD_FINALIZE_GRACE_DAYS));
    const pad = (n) => String(n).padStart(2, "0");
    return `${base.getUTCFullYear()}-${pad(base.getUTCMonth() + 1)}-${pad(base.getUTCDate())}`;
}
//# sourceMappingURL=buildNbaPeriodRankingSnapshots.js.map