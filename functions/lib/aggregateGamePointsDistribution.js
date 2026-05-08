"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aggregateGamePointsDistributionFromPostsSnap = aggregateGamePointsDistributionFromPostsSnap;
const gamePointsDistributionAgg_1 = require("./gamePointsDistributionAgg");
const computePostSettlement_1 = require("./computePostSettlement");
/**
 * 既に取得済みの posts スナップから pointsV3 分布を構築（追加の posts クエリなし）。
 */
function aggregateGamePointsDistributionFromPostsSnap({ postsSnap, game, market, hadUpsetGame, streakResultMap, }) {
    const scores = [];
    for (const doc of postsSnap.docs) {
        const p = doc.data();
        const { totalPoints } = (0, computePostSettlement_1.computePostSettlement)({
            p,
            game: Object.assign({}, game),
            market,
            hadUpsetGame,
            streakResultMap,
        });
        scores.push(totalPoints);
    }
    return (0, gamePointsDistributionAgg_1.buildGamePointsDistributionAgg)(scores);
}
//# sourceMappingURL=aggregateGamePointsDistribution.js.map