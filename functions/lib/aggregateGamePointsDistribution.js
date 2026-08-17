"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aggregateGamePointsDistributionFromPostsSnap = void 0;
exports.resolveScoreRelFromSummary = resolveScoreRelFromSummary;
exports.aggregateGamePointsSummaryFromPostsSnap = aggregateGamePointsSummaryFromPostsSnap;
const computePostSettlement_1 = require("./computePostSettlement");
function resolveScoreRelFromSummary(myScore, summary) {
    if (!summary || summary.n <= 0 || !Number.isFinite(myScore))
        return "none";
    const max = summary.max;
    if (typeof max === "number" &&
        Number.isFinite(max) &&
        myScore >= max - 1e-9) {
        return "max";
    }
    const p95 = summary.p95;
    if (typeof p95 === "number" &&
        Number.isFinite(p95) &&
        myScore >= p95 - 1e-9) {
        return "top5";
    }
    const p90 = summary.p90;
    if (typeof p90 === "number" &&
        Number.isFinite(p90) &&
        myScore >= p90 - 1e-9) {
        return "top10";
    }
    return "none";
}
function percentileFloorFromSortedAsc(sortedAsc, topFraction) {
    var _a;
    const n = sortedAsc.length;
    if (n <= 0)
        return null;
    const k = Math.max(1, Math.ceil(n * topFraction));
    return (_a = sortedAsc[n - k]) !== null && _a !== void 0 ? _a : null;
}
function buildSummaryFromScores(scores, top) {
    var _a;
    const sorted = scores.filter(Number.isFinite).sort((a, b) => a - b);
    const n = sorted.length;
    if (n === 0) {
        return {
            v: 1,
            n: 0,
            median: null,
            max: null,
            p95: null,
            p90: null,
            top: [],
        };
    }
    const mid = Math.floor(n / 2);
    const median = n % 2 === 1 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
    return {
        v: 1,
        n,
        median,
        max: (_a = sorted[n - 1]) !== null && _a !== void 0 ? _a : null,
        p95: percentileFloorFromSortedAsc(sorted, 0.05),
        p90: percentileFloorFromSortedAsc(sorted, 0.1),
        top: top.slice(0, 10),
    };
}
function authorMetaFromPost(data) {
    var _a, _b;
    const uid = typeof data.authorUid === "string" && data.authorUid.trim()
        ? data.authorUid.trim()
        : null;
    const author = data.author !== null && typeof data.author === "object"
        ? data.author
        : null;
    const handleRaw = (_a = (typeof data.authorHandle === "string" && data.authorHandle.trim()
        ? data.authorHandle.trim()
        : null)) !== null && _a !== void 0 ? _a : (typeof (author === null || author === void 0 ? void 0 : author.handle) === "string" && String(author.handle).trim()
        ? String(author.handle).trim()
        : null);
    const displayNameRaw = typeof (author === null || author === void 0 ? void 0 : author.name) === "string" && String(author.name).trim()
        ? String(author.name).trim()
        : null;
    const handle = (_b = handleRaw !== null && handleRaw !== void 0 ? handleRaw : displayNameRaw) !== null && _b !== void 0 ? _b : "—";
    const displayName = displayNameRaw !== null && displayNameRaw !== void 0 ? displayNameRaw : handle;
    const photoURL = typeof (author === null || author === void 0 ? void 0 : author.avatarUrl) === "string" && String(author.avatarUrl).trim()
        ? String(author.avatarUrl).trim()
        : null;
    const isPro = data.authorIsPro === true ||
        (author === null || author === void 0 ? void 0 : author.plan) === "pro" ||
        (author === null || author === void 0 ? void 0 : author.isPro) === true;
    return { uid, handle, displayName, photoURL, isPro };
}
/**
 * 既取得の posts スナップから pointsSummary + 各投稿の決済結果を構築。
 * 追加 posts クエリなし。finalize は settlement を再利用して再計算しない。
 */
function aggregateGamePointsSummaryFromPostsSnap({ postsSnap, game, market, hadUpsetGame, streakResultMap, }) {
    const scores = [];
    const scoredRows = [];
    const settlementByPostId = new Map();
    for (const doc of postsSnap.docs) {
        const p = doc.data();
        const settlement = (0, computePostSettlement_1.computePostSettlement)({
            p,
            game: Object.assign({}, game),
            market,
            hadUpsetGame,
            streakResultMap,
        });
        scores.push(settlement.totalPoints);
        settlementByPostId.set(doc.id, settlement);
        const author = authorMetaFromPost(p);
        scoredRows.push({
            rank: 0,
            postId: doc.id,
            uid: author.uid,
            handle: author.handle,
            displayName: author.displayName,
            photoURL: author.photoURL,
            isPro: author.isPro,
            points: settlement.totalPoints,
        });
    }
    const top = scoredRows
        .sort((a, b) => b.points - a.points || a.postId.localeCompare(b.postId))
        .slice(0, 10)
        .map((row, i) => (Object.assign(Object.assign({}, row), { rank: i + 1 })));
    return {
        summary: buildSummaryFromScores(scores, top),
        settlementByPostId,
    };
}
/** @deprecated */
exports.aggregateGamePointsDistributionFromPostsSnap = aggregateGamePointsSummaryFromPostsSnap;
//# sourceMappingURL=aggregateGamePointsDistribution.js.map