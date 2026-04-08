"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.judgeAnalysisType = judgeAnalysisType;
/**
 * 分析タイプは勝率・投稿量・精度・Upset・耐性の 5 軸のみで判定する（pointsV3 は含めない）。
 */
function judgeAnalysisType(summary) {
    const { levels } = summary;
    const W = levels.winRate === "S";
    const V = levels.volume === "S";
    const P = levels.precision === "S";
    const U = levels.upset === "S";
    const T = levels.streak === "S";
    const sCount = [W, V, P, U, T].filter(Boolean).length;
    if (sCount === 5) {
        return "COMPLETE_PLAYER";
    }
    if (sCount === 4) {
        return U ? "CHEAT_CODE" : "ELITE_ALLROUNDER";
    }
    if (sCount === 3) {
        if (W && U && T)
            return "GIANT_SLAYER";
        if (W && V && U)
            return "GIANT_SLAYER";
        if (V && U && T)
            return "GIANT_SLAYER";
        if (V && P && U)
            return "HOT_HAND";
        if (W && P && U)
            return "UNICORN";
        if (W && P && T)
            return "ASSASSIN";
        if (W && P && V)
            return "KILLER_INSTINCT";
        if (W && V && T)
            return "SWISS_ARMY_KNIFE";
        if (P && U && T)
            return "TECHNICIAN";
        if (V && P && T)
            return "IRON_ENGINE";
        return "PROSPECT";
    }
    if (sCount === 2) {
        if (W && P && !V && !U && !T)
            return "TWO_WAY_PLAYER";
        if (P && V && !W && !U && !T)
            return "DEEP_BAG";
        if (V && T && !W && !P && !U)
            return "SPARK_PLUG";
        if (W && U && !V && !P && !T)
            return "BIG_GAME_HUNTER";
        if (P && T && !W && !V && !U)
            return "SHARPSHOOTER";
        if (P && U && !W && !V && !T)
            return "CLUTCH";
        if (V && U && !W && !P && !T)
            return "CHAOS_RUNNER";
        if (W && V && !P && !U && !T)
            return "WALKING_BUCKET";
        if (W && T && !V && !P && !U)
            return "BULLDOG";
        if (U && T && !W && !V && !P)
            return "SCRAPPER";
        return "PROSPECT";
    }
    if (sCount === 1) {
        if (W && !V && !P && !U && !T)
            return "FINISHER";
        if (P && !W && !V && !U && !T)
            return "LASER";
        if (V && !W && !P && !U && !T)
            return "HIGH_MOTOR";
        if (U && !W && !V && !P && !T)
            return "CHAOS_TAKER";
        if (T && !W && !V && !P && !U)
            return "IRON_MAN";
        return "PROSPECT";
    }
    return "PROSPECT";
}
//# sourceMappingURL=judgeAnalysisType.js.map