"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.judgeAnalysisType = judgeAnalysisType;
/**
 * 16タイプ判定（最終確定版・TypeScriptエラーなし）
 */
function judgeAnalysisType(summary) {
    const { levels, counts } = summary;
    const { S, M, W } = counts;
    /* =====================================================
     * Tier 1 : 完成度・総合力
     * ===================================================== */
    // ① COMPLETE_PLAYER
    if (S >= 4) {
        return "COMPLETE_PLAYER";
    }
    // ② ELITE_ANALYST
    if (S === 3 && W === 0) {
        return "ELITE_ANALYST";
    }
    // ③ BALANCED_PRO
    if (S === 2 && M === 3) {
        return "BALANCED_PRO";
    }
    // ④ CONSISTENT_VET
    if (S <= 1 && M >= 4) {
        return "CONSISTENT_VET";
    }
    /* =====================================================
     * 勝率系（WIN 軸）
     * ===================================================== */
    // ⑥ FAVORITE_PUNISHER（先判定）
    if (levels.winRate === "S" &&
        levels.accuracy === "S" &&
        levels.upset !== "S") {
        return "FAVORITE_PUNISHER";
    }
    // ⑤ CLOSER
    if (levels.winRate === "S") {
        return "CLOSER";
    }
    /* =====================================================
     * 精度系（ACCURACY / PRECISION）
     * ===================================================== */
    // ⑦ BOX_SCORE_ARTIST
    if (levels.precision === "S" &&
        levels.accuracy !== "W") {
        return "BOX_SCORE_ARTIST";
    }
    // ⑧ ANALYTICS_FIRST
    if (levels.accuracy === "S" &&
        M >= 3) {
        return "ANALYTICS_FIRST";
    }
    // ⑨ EFFICIENCY_FREAK
    // ※ ここでは winRate は M | W に確定済み
    if (levels.accuracy === "S") {
        return "EFFICIENCY_FREAK";
    }
    /* =====================================================
     * Upset 系（逆張り・爆発力）
     * ===================================================== */
    if (levels.upset === "S") {
        // ⑫ CHAOS_CREATOR
        if (levels.accuracy === "W") {
            return "CHAOS_CREATOR";
        }
        // ⑩ GIANT_KILLER
        // ※ 勝率条件は不要（型的に M | W）
        return "GIANT_KILLER";
    }
    /* =====================================================
     * Volume 系（量・継続）
     * ===================================================== */
    // ⑬ IRON_MAN
    if (levels.volume === "S" &&
        M >= 3) {
        return "IRON_MAN";
    }
    // ⑭ GRIND_ANALYST
    if (levels.volume === "S" &&
        levels.precision === "M" &&
        levels.accuracy === "M") {
        return "GRIND_ANALYST";
    }
    /* =====================================================
     * 感覚・直感型
     * ===================================================== */
    // ⑮ HEAT_CHECK
    if (levels.upset === "M" &&
        levels.accuracy === "W") {
        return "HEAT_CHECK";
    }
    /* =====================================================
     * fallback
     * ===================================================== */
    // ⑯ WILD_CARD
    return "WILD_CARD";
}
//# sourceMappingURL=judgeAnalysisType.js.map