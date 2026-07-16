"use strict";
/**
 * cumulative_stats のスナップショット用フラット index。
 * Firestore はネストした rankingByWcStage.*.totalPosts を where できないため、
 * 試合確定時に rankingTotalPosts を同期する。
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CUMULATIVE_RANKING_TOTAL_POSTS_FIELD = void 0;
exports.readRankingTotalPosts = readRankingTotalPosts;
exports.rankingTotalPostsFromAggregate = rankingTotalPostsFromAggregate;
exports.cumulativeStatsDocsToMap = cumulativeStatsDocsToMap;
exports.loadCumulativeStatsForRankingSnapshot = loadCumulativeStatsForRankingSnapshot;
exports.CUMULATIVE_RANKING_TOTAL_POSTS_FIELD = "rankingTotalPosts";
function readRankingTotalPosts(data) {
    var _a;
    if (!data)
        return 0;
    const flat = data[exports.CUMULATIVE_RANKING_TOTAL_POSTS_FIELD];
    if (typeof flat === "number" && Number.isFinite(flat)) {
        return Math.max(0, Math.floor(flat));
    }
    const nested = (_a = data.ranking) === null || _a === void 0 ? void 0 : _a.totalPosts;
    const n = typeof nested === "number" ? nested : Number(nested);
    return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
}
/** reconcile / 集計結果から index フィールドを付与 */
function rankingTotalPostsFromAggregate(rankingTotalPosts) {
    return {
        [exports.CUMULATIVE_RANKING_TOTAL_POSTS_FIELD]: Math.max(0, Math.floor(rankingTotalPosts)),
    };
}
function cumulativeStatsDocsToMap(snap) {
    const statsByUid = new Map();
    for (const doc of snap.docs) {
        statsByUid.set(doc.id, doc.data());
    }
    return statsByUid;
}
/** 既存 doc の ranking.totalPosts から index を 1 回だけ埋める */
async function backfillRankingTotalPostsIndex(db) {
    const coll = db.collection("cumulative_stats");
    const snap = await coll.get();
    let batch = db.batch();
    let ops = 0;
    let written = 0;
    const flush = async () => {
        if (ops > 0) {
            await batch.commit();
            batch = db.batch();
            ops = 0;
        }
    };
    for (const doc of snap.docs) {
        const data = doc.data();
        if (data[exports.CUMULATIVE_RANKING_TOTAL_POSTS_FIELD] != null)
            continue;
        const posts = readRankingTotalPosts(data);
        if (posts <= 0)
            continue;
        batch.set(doc.ref, { [exports.CUMULATIVE_RANKING_TOTAL_POSTS_FIELD]: posts }, { merge: true });
        ops++;
        written++;
        if (ops >= 500)
            await flush();
    }
    await flush();
    return written;
}
/**
 * ランキング参加者のみ読む（0 投稿 doc をスキップ）。
 * index が空なら 1 回だけ backfill → 再クエリ。それでも空なら full scan。
 */
async function loadCumulativeStatsForRankingSnapshot(db) {
    const coll = db.collection("cumulative_stats");
    let indexed = await coll
        .where(exports.CUMULATIVE_RANKING_TOTAL_POSTS_FIELD, ">", 0)
        .get();
    if (indexed.size === 0) {
        const filled = await backfillRankingTotalPostsIndex(db);
        console.log(`[buildCumulativeRankingSnapshot] backfilled rankingTotalPosts on ${filled} docs`);
        indexed = await coll
            .where(exports.CUMULATIVE_RANKING_TOTAL_POSTS_FIELD, ">", 0)
            .get();
    }
    if (indexed.size > 0) {
        return indexed;
    }
    console.warn("[buildCumulativeRankingSnapshot] rankingTotalPosts still empty; falling back to full cumulative_stats read");
    return coll.get();
}
//# sourceMappingURL=cumulativeSnapshotIndex.js.map