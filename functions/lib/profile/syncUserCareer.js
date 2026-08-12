"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncUserCareerOnNbaSettle = syncUserCareerOnNbaSettle;
exports.syncUserCareerPeriodRank = syncUserCareerPeriodRank;
exports.syncUserCareerGroupBattleRank = syncUserCareerGroupBattleRank;
exports.syncUserCareerUnitsEarned = syncUserCareerUnitsEarned;
exports.syncUserCareerUnlockedSkinCount = syncUserCareerUnlockedSkinCount;
/**
 * user_career/{uid} を settle / 期間確定 / GB / Unit / Skin から差分更新。
 * lib/profile/userCareer.ts と同じスキーマ（v1）。
 */
const firestore_1 = require("firebase-admin/firestore");
const nbaSeason_1 = require("../rankings/nbaSeason");
const COLLECTION = "user_career";
const SCHEMA_V = 1;
function safeInt(v) {
    const n = typeof v === "number" ? v : Number(v);
    return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
}
function betterRank(a, b) {
    const aa = safeInt(a);
    const bb = safeInt(b);
    const aOk = aa >= 1 ? aa : null;
    const bOk = bb >= 1 ? bb : null;
    if (aOk == null)
        return bOk;
    if (bOk == null)
        return aOk;
    return Math.min(aOk, bOk);
}
function maxStreak(a, b) {
    const aa = safeInt(a);
    const bb = safeInt(b);
    const aOk = aa >= 1 ? aa : null;
    const bOk = bb >= 1 ? bb : null;
    if (aOk == null)
        return bOk;
    if (bOk == null)
        return aOk;
    return Math.max(aOk, bOk);
}
function winRatePct(posts, wins) {
    if (posts <= 0)
        return 0;
    return Math.round((wins / posts) * 1000) / 10;
}
function emptyBoard() {
    return {
        predictions: 0,
        hits: 0,
        exactHits: 0,
        winRatePct: 0,
        maxWinStreak: null,
        bestWeeklyRank: null,
        bestMonthlyRank: null,
        weeklyTop10Count: 0,
        monthlyTop10Count: 0,
    };
}
function readBoard(raw) {
    var _a, _b;
    if (!raw || typeof raw !== "object")
        return emptyBoard();
    const o = raw;
    const predictions = safeInt((_a = o.predictions) !== null && _a !== void 0 ? _a : o.posts);
    const hits = safeInt((_b = o.hits) !== null && _b !== void 0 ? _b : o.wins);
    return {
        predictions,
        hits,
        exactHits: safeInt(o.exactHits),
        winRatePct: typeof o.winRatePct === "number" && Number.isFinite(o.winRatePct)
            ? o.winRatePct
            : winRatePct(predictions, hits),
        maxWinStreak: safeInt(o.maxWinStreak) >= 1 ? safeInt(o.maxWinStreak) : null,
        bestWeeklyRank: safeInt(o.bestWeeklyRank) >= 1 ? safeInt(o.bestWeeklyRank) : null,
        bestMonthlyRank: safeInt(o.bestMonthlyRank) >= 1 ? safeInt(o.bestMonthlyRank) : null,
        weeklyTop10Count: safeInt(o.weeklyTop10Count),
        monthlyTop10Count: safeInt(o.monthlyTop10Count),
    };
}
function toStartDate(startAt) {
    if (startAt &&
        typeof startAt.toDate === "function") {
        return startAt.toDate();
    }
    if (startAt instanceof Date)
        return startAt;
    return new Date();
}
/** settle 1 件を career に反映（doc が無ければ作成） */
async function syncUserCareerOnNbaSettle(opts) {
    var _a;
    if (!opts.countsForRanking)
        return;
    const leagueKey = String((_a = opts.league) !== null && _a !== void 0 ? _a : "")
        .trim()
        .toLowerCase();
    if (leagueKey !== "nba")
        return;
    const phase = (0, nbaSeason_1.normalizeNbaSeasonPhase)(opts.seasonPhase);
    const keys = (0, nbaSeason_1.resolveNbaRankingBucketKeys)("nba", true, toStartDate(opts.startAt), phase);
    const board = phase === "playoffs" ? "playoffs" : "regular";
    const seasonKey = board === "playoffs" ? keys.nbaPlayoffsSeasonKey : keys.nbaSeasonKey;
    if (!seasonKey)
        return;
    const db = (0, firestore_1.getFirestore)();
    const ref = db.collection(COLLECTION).doc(opts.uid);
    await db.runTransaction(async (tx) => {
        var _a;
        const snap = await tx.get(ref);
        const data = (snap.exists ? snap.data() : {});
        const summaryObj = data.summary && typeof data.summary === "object"
            ? Object.assign({}, data.summary)
            : {};
        const seasons = data.seasons && typeof data.seasons === "object"
            ? Object.assign({}, data.seasons)
            : {};
        const chapterRaw = seasons[seasonKey] && typeof seasons[seasonKey] === "object"
            ? Object.assign({}, seasons[seasonKey])
            : { regular: emptyBoard(), playoffs: emptyBoard() };
        const boardStats = readBoard(chapterRaw[board]);
        boardStats.predictions += 1;
        if (opts.isWin)
            boardStats.hits += 1;
        if (opts.exactHit)
            boardStats.exactHits += 1;
        boardStats.winRatePct = winRatePct(boardStats.predictions, boardStats.hits);
        const streakPeak = safeInt(opts.maxWinStreak) >= 1
            ? safeInt(opts.maxWinStreak)
            : opts.activeWinStreak;
        boardStats.maxWinStreak = maxStreak(boardStats.maxWinStreak, streakPeak);
        chapterRaw[board] = boardStats;
        if (!chapterRaw.regular)
            chapterRaw.regular = emptyBoard();
        if (!chapterRaw.playoffs)
            chapterRaw.playoffs = emptyBoard();
        seasons[seasonKey] = chapterRaw;
        const nextSummaryBoard = readBoard(summaryObj);
        nextSummaryBoard.predictions += 1;
        if (opts.isWin)
            nextSummaryBoard.hits += 1;
        if (opts.exactHit)
            nextSummaryBoard.exactHits += 1;
        nextSummaryBoard.winRatePct = winRatePct(nextSummaryBoard.predictions, nextSummaryBoard.hits);
        nextSummaryBoard.maxWinStreak = maxStreak(nextSummaryBoard.maxWinStreak, streakPeak);
        tx.set(ref, {
            v: SCHEMA_V,
            uid: opts.uid,
            summary: Object.assign(Object.assign(Object.assign({}, summaryObj), nextSummaryBoard), { sinceYear: (_a = summaryObj.sinceYear) !== null && _a !== void 0 ? _a : null, unlockedSkinCount: safeInt(summaryObj.unlockedSkinCount), lifetimeUnitsEarned: summaryObj.lifetimeUnitsEarned == null
                    ? null
                    : safeInt(summaryObj.lifetimeUnitsEarned), bestGroupBattleRank: safeInt(summaryObj.bestGroupBattleRank) >= 1
                    ? safeInt(summaryObj.bestGroupBattleRank)
                    : null }),
            seasons,
            updatedAtMs: Date.now(),
            source: "settle",
            updatedAt: firestore_1.FieldValue.serverTimestamp(),
        }, { merge: true });
    });
}
/** 週/月 totalPoints 順位を career に冪等反映 */
async function syncUserCareerPeriodRank(opts) {
    const rank = safeInt(opts.rank);
    if (rank < 1)
        return;
    const seenKey = opts.period === "weekly" ? `w:${opts.label}` : `m:${opts.label}`;
    const db = (0, firestore_1.getFirestore)();
    const ref = db.collection(COLLECTION).doc(opts.uid);
    await db.runTransaction(async (tx) => {
        var _a;
        const snap = await tx.get(ref);
        const data = (snap.exists ? snap.data() : {});
        const periodSeen = data.periodSeen && typeof data.periodSeen === "object"
            ? Object.assign({}, data.periodSeen)
            : {};
        const already = safeInt(periodSeen[seenKey]) >= 1;
        const summaryObj = data.summary && typeof data.summary === "object"
            ? Object.assign({}, data.summary)
            : {};
        const board = readBoard(summaryObj);
        if (opts.period === "weekly") {
            board.bestWeeklyRank = betterRank(board.bestWeeklyRank, rank);
            if (!already && rank <= 10)
                board.weeklyTop10Count += 1;
        }
        else {
            board.bestMonthlyRank = betterRank(board.bestMonthlyRank, rank);
            if (!already && rank <= 10)
                board.monthlyTop10Count += 1;
        }
        periodSeen[seenKey] = rank;
        const seasons = data.seasons && typeof data.seasons === "object"
            ? Object.assign({}, data.seasons)
            : {};
        const seasonKey = ((_a = opts.seasonKey) === null || _a === void 0 ? void 0 : _a.trim()) || "";
        if (seasonKey) {
            const chapterRaw = seasons[seasonKey] && typeof seasons[seasonKey] === "object"
                ? Object.assign({}, seasons[seasonKey])
                : { regular: emptyBoard(), playoffs: emptyBoard() };
            const regular = readBoard(chapterRaw.regular);
            if (opts.period === "weekly") {
                regular.bestWeeklyRank = betterRank(regular.bestWeeklyRank, rank);
                if (!already && rank <= 10)
                    regular.weeklyTop10Count += 1;
            }
            else {
                regular.bestMonthlyRank = betterRank(regular.bestMonthlyRank, rank);
                if (!already && rank <= 10)
                    regular.monthlyTop10Count += 1;
            }
            chapterRaw.regular = regular;
            if (!chapterRaw.playoffs)
                chapterRaw.playoffs = emptyBoard();
            seasons[seasonKey] = chapterRaw;
        }
        tx.set(ref, {
            v: SCHEMA_V,
            uid: opts.uid,
            summary: Object.assign(Object.assign({}, summaryObj), board),
            seasons,
            periodSeen,
            updatedAtMs: Date.now(),
            source: "period",
            updatedAt: firestore_1.FieldValue.serverTimestamp(),
        }, { merge: true });
    });
}
async function syncUserCareerGroupBattleRank(opts) {
    const rank = safeInt(opts.rank);
    if (rank < 1)
        return;
    const seenKey = `gb:${opts.battleId}:${opts.period}:${opts.label}`;
    const db = (0, firestore_1.getFirestore)();
    const ref = db.collection(COLLECTION).doc(opts.uid);
    await db.runTransaction(async (tx) => {
        const snap = await tx.get(ref);
        const data = (snap.exists ? snap.data() : {});
        const groupBattleSeen = data.groupBattleSeen && typeof data.groupBattleSeen === "object"
            ? Object.assign({}, data.groupBattleSeen)
            : {};
        groupBattleSeen[seenKey] = rank;
        const summaryObj = data.summary && typeof data.summary === "object"
            ? Object.assign({}, data.summary)
            : {};
        summaryObj.bestGroupBattleRank = betterRank(summaryObj.bestGroupBattleRank, rank);
        tx.set(ref, {
            v: SCHEMA_V,
            uid: opts.uid,
            summary: summaryObj,
            groupBattleSeen,
            updatedAtMs: Date.now(),
            source: "group_battle",
            updatedAt: firestore_1.FieldValue.serverTimestamp(),
        }, { merge: true });
    });
}
async function syncUserCareerUnitsEarned(uid, amount) {
    const add = safeInt(amount);
    if (add <= 0)
        return;
    const db = (0, firestore_1.getFirestore)();
    const ref = db.collection(COLLECTION).doc(uid);
    await ref.set({
        v: SCHEMA_V,
        uid,
        "summary.lifetimeUnitsEarned": firestore_1.FieldValue.increment(add),
        updatedAtMs: Date.now(),
        source: "units",
        updatedAt: firestore_1.FieldValue.serverTimestamp(),
    }, { merge: true });
}
async function syncUserCareerUnlockedSkinCount(uid, unlockedSkinCount) {
    const n = safeInt(unlockedSkinCount);
    const db = (0, firestore_1.getFirestore)();
    const ref = db.collection(COLLECTION).doc(uid);
    await db.runTransaction(async (tx) => {
        const snap = await tx.get(ref);
        const data = (snap.exists ? snap.data() : {});
        const summaryObj = data.summary && typeof data.summary === "object"
            ? Object.assign({}, data.summary)
            : {};
        const prev = safeInt(summaryObj.unlockedSkinCount);
        if (n === prev)
            return;
        summaryObj.unlockedSkinCount = n;
        tx.set(ref, {
            v: SCHEMA_V,
            uid,
            summary: summaryObj,
            updatedAtMs: Date.now(),
            source: "skin",
            updatedAt: firestore_1.FieldValue.serverTimestamp(),
        }, { merge: true });
    });
}
// deploy-marker 20260810091655
//# sourceMappingURL=syncUserCareer.js.map