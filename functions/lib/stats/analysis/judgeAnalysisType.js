"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.judgeAnalysisType = judgeAnalysisType;
function judgeAnalysisType(summary) {
    const { levels, counts } = summary;
    const { S, M, W } = counts;
    if (S >= 5) {
        return "COMPLETE_PLAYER";
    }
    if (S === 4) {
        return "ELITE_ALLROUNDER";
    }
    if (S === 3) {
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
            levels.accuracy === "S") {
            return "PRECISE_CLOSER";
        }
        if (levels.winRate === "S" &&
            levels.streak === "S" &&
            levels.accuracy === "S") {
            return "CONFIDENT_FINISHER";
        }
        if (levels.precision === "S" &&
            levels.volume === "S" &&
            levels.streak === "S") {
            return "DATA_GRINDER";
        }
        if (levels.precision === "S" &&
            levels.volume === "S" &&
            levels.accuracy === "S") {
            return "PROBABILITY_READER";
        }
        if (levels.precision === "S" &&
            levels.streak === "S" &&
            levels.accuracy === "S") {
            return "STABLE_ANALYST";
        }
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
        if (levels.accuracy === "S" &&
            levels.volume === "S" &&
            levels.streak === "S") {
            return "ACCURACY_CONTROLLER";
        }
        if (levels.accuracy === "S" &&
            levels.winRate === "S" &&
            levels.volume === "S") {
            return "CONSISTENT_PRODUCER";
        }
    }
    if (S === 2) {
        if (levels.winRate === "S" && levels.precision === "S") {
            return "SHARP_EXECUTOR";
        }
        if (levels.winRate === "S" && levels.streak === "S") {
            return "MOMENTUM_EDGE";
        }
        if (levels.winRate === "S" && levels.volume === "S") {
            return "RELENTLESS_OUTPUT";
        }
        if (levels.winRate === "S" && levels.accuracy === "S") {
            return "CONFIDENCE_DOMINANCE";
        }
        if (levels.winRate === "S" && levels.accuracy === "W") {
            return "HIGH_RISK_READER";
        }
        if (levels.precision === "S" && levels.volume === "S") {
            return "DATA_FORGE";
        }
        if (levels.precision === "S" && levels.streak === "S") {
            return "RHYTHM_BLADE";
        }
        if (levels.precision === "S" && levels.accuracy === "S") {
            return "PROBABILITY_COMMANDER";
        }
        if (levels.precision === "S" && levels.accuracy === "W") {
            return "VOLATILE_READER";
        }
        if (levels.upset === "S" && levels.winRate === "S") {
            return "BOLD_STRIKER";
        }
        if (levels.upset === "S" && levels.precision === "S") {
            return "EDGE_HUNTER";
        }
        if (levels.upset === "S" && levels.streak === "S") {
            return "CHAOS_SURGE";
        }
        if (levels.upset === "S" && levels.accuracy === "W") {
            return "BOLD_READER";
        }
        if (levels.volume === "S" && levels.streak === "S") {
            return "ENDURANCE_CORE";
        }
        if (levels.volume === "S" && levels.accuracy === "S") {
            return "ACCURACY_ENGINE";
        }
        if (levels.volume === "S" && levels.accuracy === "W") {
            return "RISK_ENGINE";
        }
    }
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
        if (levels.accuracy === "S")
            return "ACCURACY_PATH";
        if (levels.accuracy === "W")
            return "VOLATILE_PATH";
    }
    if (S === 0) {
        if (W >= 4)
            return "RAW";
        if (W >= 3)
            return "UNSTABLE";
        if (M >= 4)
            return "FOUNDATION";
        return "BASELINE";
    }
    return "WILD_CARD";
}
//# sourceMappingURL=judgeAnalysisType.js.map