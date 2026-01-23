"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.judgeAnalysisType = judgeAnalysisType;
/**
 * 16タイプ判定（最終確定版・TypeScriptエラーなし）
 */
function judgeAnalysisType(summary) {
    const { levels, counts } = summary;
    const { S, M, W } = counts;
    // ====================
    // Tier 1 : 完成度・総合力
    // ====================
    // S=5 → COMPLETE_PLAYER
    if (S >= 5) {
        return "COMPLETE_PLAYER";
    }
    // S=4 → ELITE_ALLROUNDER
    if (S === 4) {
        return "ELITE_ALLROUNDER";
    }
    // ====================
    // S=3
    // ====================
    if (S === 3) {
        // 勝率中核型
        if (levels.winRate === "S" &&
            levels.precision === "S" &&
            levels.streak === "S") {
            return "ELITE_CLOSER";
        }
        if (levels.winRate === "S" &&
            levels.precision === "S" &&
            levels.volume === "S") {
            return "RELIABLE_PRO";
        }
        if (levels.winRate === "S" &&
            levels.streak === "S" &&
            levels.volume === "S") {
            return "IRON_RUNNER";
        }
        if (levels.winRate === "S" &&
            levels.precision === "S" &&
            levels.market === "S") {
            return "SAFE_CLOSER";
        }
        if (levels.winRate === "S" &&
            levels.streak === "S" &&
            levels.market === "S") {
            return "Hot_Hand";
        }
        // 分析・精度中核型
        if (levels.precision === "S" &&
            levels.volume === "S" &&
            levels.streak === "S") {
            return "DATA_GRINDER";
        }
        if (levels.precision === "S" &&
            levels.volume === "S" &&
            levels.market === "S") {
            return "MODEL_FOLLOWER";
        }
        if (levels.precision === "S" &&
            levels.streak === "S" &&
            levels.market === "S") {
            return "STABLE_ANALYST";
        }
        // Upset 中核型
        if (levels.upset === "S" &&
            levels.winRate === "S" &&
            levels.streak === "S") {
            return "GIANT_SLAYER";
        }
        if (levels.upset === "S" &&
            levels.precision === "S" &&
            levels.streak === "S") {
            return "SHARP_UPSETTER";
        }
        if (levels.upset === "S" &&
            levels.volume === "S" &&
            levels.streak === "S") {
            return "CHAOS_ENGINE";
        }
        // 市場理解型（market=S）
        if (levels.market === "S" &&
            levels.volume === "S" &&
            levels.streak === "S") {
            return "PUBLIC_CONTROLLER";
        }
        if (levels.market === "S" &&
            levels.winRate === "S" &&
            levels.volume === "S") {
            return "SAFE_PRODUCER";
        }
    }
    // ====================
    // S=2
    // ====================
    if (S === 2) {
        // 勝率軸
        if (levels.winRate === "S" && levels.precision === "S") {
            return "SHARP_EXECUTOR";
        }
        if (levels.winRate === "S" && levels.streak === "S") {
            return "MOMENTUM_EDGE";
        }
        if (levels.winRate === "S" && levels.volume === "S") {
            return "RELENTLESS_OUTPUT";
        }
        if (levels.winRate === "S" && levels.market === "S") {
            return "SAFE_DOMINANCE";
        }
        if (levels.winRate === "S" && levels.market === "W") {
            return "CROWD_BREAKER";
        }
        // 精度軸
        if (levels.precision === "S" && levels.volume === "S") {
            return "DATA_FORGE";
        }
        if (levels.precision === "S" && levels.streak === "S") {
            return "RHYTHM_BLADE";
        }
        if (levels.precision === "S" && levels.market === "S") {
            return "MODEL_COMMANDER";
        }
        if (levels.precision === "S" && levels.market === "W") {
            return "LINE_CUTTER";
        }
        // Upset 軸
        if (levels.upset === "S" && levels.winRate === "S") {
            return "BOLD_STRIKER";
        }
        if (levels.upset === "S" && levels.precision === "S") {
            return "EDGE_HUNTER";
        }
        if (levels.upset === "S" && levels.streak === "S") {
            return "CHAOS_SURGE";
        }
        if (levels.upset === "S" && levels.market === "W") {
            return "FADE_ASSASSIN";
        }
        // 量・継続
        if (levels.volume === "S" && levels.streak === "S") {
            return "ENDURANCE_CORE";
        }
        if (levels.volume === "S" && levels.market === "S") {
            return "PUBLIC_ENGINE";
        }
        if (levels.volume === "S" && levels.market === "W") {
            return "DARK_ENGINE";
        }
    }
    // ====================
    // S=1
    // ====================
    if (S === 1) {
        if (levels.winRate === "S")
            return "CLEAN_HIT";
        if (levels.precision === "S")
            return "SHARP_EYE";
        if (levels.upset === "S")
            return "CHAOS_TAKER";
        if (levels.volume === "S")
            return "HIGH_ACTIVITY";
        if (levels.streak === "S")
            return "HOT_PHASE";
        if (levels.market === "S")
            return "PUBLIC_PATH";
        if (levels.market === "W")
            return "CROWD_FADE";
    }
    // ====================
    // S=0
    // ====================
    if (S === 0) {
        if (W >= 4)
            return "RAW";
        if (W >= 3)
            return "UNSTABLE";
        if (M >= 4)
            return "FOUNDATION";
        return "BASELINE";
    }
    // ====================
    // fallback（保険）
    // ====================
    return "WILD_CARD";
}
//# sourceMappingURL=judgeAnalysisType.js.map