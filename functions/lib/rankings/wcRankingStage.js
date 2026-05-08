"use strict";
/** Keep in sync with lib/rankings/wcRankingStage.ts */
Object.defineProperty(exports, "__esModule", { value: true });
exports.WC_RANKING_STAGES = void 0;
exports.isWcRankingStage = isWcRankingStage;
exports.WC_RANKING_STAGES = ["overall", "qualifying", "main"];
function isWcRankingStage(v) {
    return v === "overall" || v === "qualifying" || v === "main";
}
//# sourceMappingURL=wcRankingStage.js.map