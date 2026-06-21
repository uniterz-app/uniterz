"use strict";
/** Keep in sync with lib/rankings/wcRankingStage.ts */
Object.defineProperty(exports, "__esModule", { value: true });
exports.WC_GROUP_STAGE_WIN_RATE_MIN_POSTS = exports.WC_OVERALL_WIN_RATE_MIN_POSTS = exports.WC_RANKING_STAGES = void 0;
exports.minPostsForWcWinRate = minPostsForWcWinRate;
exports.isWcRankingStage = isWcRankingStage;
exports.WC_RANKING_STAGES = ["overall", "qualifying", "main"];
/** Keep in sync with lib/rankings/winRateMinPosts.ts */
exports.WC_OVERALL_WIN_RATE_MIN_POSTS = 20;
exports.WC_GROUP_STAGE_WIN_RATE_MIN_POSTS = 20;
function minPostsForWcWinRate(stage) {
    if (stage === "qualifying")
        return exports.WC_GROUP_STAGE_WIN_RATE_MIN_POSTS;
    if (stage === "overall")
        return exports.WC_OVERALL_WIN_RATE_MIN_POSTS;
    return 1;
}
function isWcRankingStage(v) {
    return v === "overall" || v === "qualifying" || v === "main";
}
//# sourceMappingURL=wcRankingStage.js.map