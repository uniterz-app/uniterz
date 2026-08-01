"use strict";
// synced from lib/reports/monthlyRadarJudge.ts — run npm run sync:monthly-report-builders
// 月次能力チャート — 強み判定 + 分析タイプ（純関数）。
// docs/pro-subscription-plan.md §4.3
// UI / preview / 将来の monthly report builder が共有する。
Object.defineProperty(exports, "__esModule", { value: true });
exports.MONTHLY_RADAR_ABSOLUTE_FLOOR = exports.MONTHLY_RADAR_AXIS_ORDER = void 0;
exports.isMonthlyRadarAxisStrength = isMonthlyRadarAxisStrength;
exports.collectMonthlyRadarStrengths = collectMonthlyRadarStrengths;
exports.judgeMonthlyAnalysisType = judgeMonthlyAnalysisType;
exports.buildMonthlyRadarPercentiles = buildMonthlyRadarPercentiles;
const monthlyReportTypes_1 = require("./monthlyReportTypes");
exports.MONTHLY_RADAR_AXIS_ORDER = [
    "win",
    "scorer",
    "upset",
    "activity",
    "consistency",
];
/** 絶対下限（V1 仮置き） */
exports.MONTHLY_RADAR_ABSOLUTE_FLOOR = {
    /** WIN: 勝率 */
    winRateMin: 0.52,
    /** UPSET: 最低機会数 */
    upsetOpportunityMin: 5,
    /** ACTIVITY: ピックアップ参加率 */
    activityRateMin: 0.5,
    /** CONSISTENCY: 最大連敗の上限（以下なら絶対クリア） */
    maxLoseStreakMax: 5,
};
function finite(n) {
    return typeof n === "number" && Number.isFinite(n);
}
/** 相対 ∩ 絶対。両方満たしたら強み。 */
function isMonthlyRadarAxisStrength(axis, m) {
    if (!finite(m.percentile) || m.percentile < monthlyReportTypes_1.MONTHLY_REPORT_RADAR_STRENGTH_P) {
        return false;
    }
    switch (axis) {
        case "win":
            return finite(m.winRate) && m.winRate >= exports.MONTHLY_RADAR_ABSOLUTE_FLOOR.winRateMin;
        case "scorer":
            return (finite(m.scorerHits) &&
                finite(m.scorerMedian) &&
                m.scorerHits >= m.scorerMedian);
        case "upset":
            return (finite(m.upsetPoints) &&
                finite(m.upsetMedian) &&
                finite(m.upsetOpportunity) &&
                m.upsetPoints >= m.upsetMedian &&
                m.upsetOpportunity >= exports.MONTHLY_RADAR_ABSOLUTE_FLOOR.upsetOpportunityMin);
        case "activity":
            return (finite(m.activityRate) &&
                m.activityRate >= exports.MONTHLY_RADAR_ABSOLUTE_FLOOR.activityRateMin);
        case "consistency":
            return (finite(m.maxLoseStreak) &&
                m.maxLoseStreak <= exports.MONTHLY_RADAR_ABSOLUTE_FLOOR.maxLoseStreakMax);
        default:
            return false;
    }
}
function collectMonthlyRadarStrengths(input) {
    return exports.MONTHLY_RADAR_AXIS_ORDER.filter((axis) => isMonthlyRadarAxisStrength(axis, input[axis]));
}
/** 二軸コンボ → タイプ（軸名を辞書順でキー化） */
const DUAL_TYPE = {
    "scorer+win": "TWO_WAY_PLAYER",
    "upset+win": "BIG_GAME_HUNTER",
    "activity+win": "WALKING_BUCKET",
    "consistency+win": "HIGH_FLOOR",
    "scorer+upset": "CLUTCH",
    "activity+scorer": "DEEP_BAG",
    "consistency+scorer": "SHARPSHOOTER",
    "activity+upset": "CHAOS_RUNNER",
    "consistency+upset": "CHAOS_ANCHOR",
    "activity+consistency": "SPARK_PLUG",
};
const SINGLE_TYPE = {
    win: "FINISHER",
    scorer: "LASER",
    upset: "CHAOS_TAKER",
    activity: "HIGH_MOTOR",
    consistency: "IRON_MAN",
};
function dualKey(a, b) {
    return [a, b].sort().join("+");
}
/**
 * ハイブリッド分析タイプ判定。
 * - サンプル未達 → Prospect
 * - 強み 5 → GOAT / 4 → Complete Player / 3 → All-Rounder
 * - 強み 2 → 二軸表 / 1 → 単軸表 / 0 → Prospect
 */
function judgeMonthlyAnalysisType(input) {
    var _a;
    if (!input.sampleEligible)
        return "PROSPECT";
    const strengths = exports.MONTHLY_RADAR_AXIS_ORDER.filter((a) => input.strengths.includes(a));
    const n = strengths.length;
    if (n >= 5)
        return "GOAT";
    if (n === 4)
        return "COMPLETE_PLAYER";
    if (n === 3)
        return "ALL_ROUNDER";
    if (n === 2) {
        const id = DUAL_TYPE[dualKey(strengths[0], strengths[1])];
        return id !== null && id !== void 0 ? id : "PROSPECT";
    }
    if (n === 1) {
        return (_a = SINGLE_TYPE[strengths[0]]) !== null && _a !== void 0 ? _a : "PROSPECT";
    }
    return "PROSPECT";
}
/** レーダー表示用パーセンタイル Record（0–100） */
function buildMonthlyRadarPercentiles(input) {
    var _a;
    const out = {};
    for (const axis of exports.MONTHLY_RADAR_AXIS_ORDER) {
        const p = (_a = input[axis]) === null || _a === void 0 ? void 0 : _a.percentile;
        out[axis] = finite(p) ? Math.max(0, Math.min(100, p)) : 0;
    }
    return out;
}
//# sourceMappingURL=monthlyRadarJudge.js.map