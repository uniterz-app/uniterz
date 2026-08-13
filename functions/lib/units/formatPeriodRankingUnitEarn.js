"use strict";
/**
 * Functions 側 — 期間ランキング Unit 獲得演出文言
 * （lib/units/formatPeriodRankingUnitEarn.ts と同趣旨）
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildPeriodRankingUnitEarnCopy = buildPeriodRankingUnitEarnCopy;
const periodRankingUnitRewards_1 = require("./periodRankingUnitRewards");
function isPeriodMetric(raw) {
    return (raw === "totalPoints" ||
        raw === "winRate" ||
        raw === "totalUpset" ||
        raw === "totalGoalScorerHits");
}
function formatLabel(period, label, language) {
    if (period === "monthly") {
        const m = /^(\d{4})-(\d{2})$/.exec(label);
        if (m) {
            const y = Number(m[1]);
            const mo = Number(m[2]);
            if (language === "en") {
                const d = new Date(Date.UTC(y, mo - 1, 1));
                return `${d.toLocaleString("en-US", { month: "short", timeZone: "UTC" })} ${y} · NBA`;
            }
            return `${y}年${mo}月 · NBA`;
        }
    }
    const w = /^(\d{4})-(\d{2})-(\d{2})$/.exec(label);
    if (w) {
        const y = Number(w[1]);
        const mo = Number(w[2]);
        const d = Number(w[3]);
        if (language === "en") {
            return `Week of ${mo}/${d}/${y} · NBA`;
        }
        return `${y}/${mo}/${d}週 · NBA`;
    }
    return `${label} · NBA`;
}
function formatTitle(period, metric, rank, language) {
    const safeRank = Math.max(1, Math.floor(rank));
    const metricLabel = metric && isPeriodMetric(metric)
        ? (0, periodRankingUnitRewards_1.periodRankingUnitMetricLabel)(metric, language)
        : null;
    const isOverall = !metric || metric === "totalPoints";
    if (language === "en") {
        if (period === "weekly")
            return `Weekly rank #${safeRank}`;
        if (isOverall || !metricLabel)
            return `Monthly rank #${safeRank}`;
        return `Monthly ${metricLabel} #${safeRank}`;
    }
    if (period === "weekly")
        return `週間ランキング ${safeRank}位`;
    if (isOverall || !metricLabel)
        return `月間ランキング ${safeRank}位`;
    return `月間${metricLabel} ${safeRank}位`;
}
function buildPeriodRankingUnitEarnCopy(input) {
    return {
        titleJa: formatTitle(input.period, input.metric, input.rank, "ja"),
        titleEn: formatTitle(input.period, input.metric, input.rank, "en"),
        subtitleJa: formatLabel(input.period, input.label, "ja"),
        subtitleEn: formatLabel(input.period, input.label, "en"),
    };
}
//# sourceMappingURL=formatPeriodRankingUnitEarn.js.map