"use strict";
// synced from lib/reports/buildMonthlyOutlookSummary.ts — run npm run sync:monthly-report-builders
// 月次レポート「今月のサマリー」— テンプレ生成。
// docs/pro-subscription-plan.md §7
// 数字優先: パーセンタイル（上位%）→ 前月比 → 順位
// functions/src/reports/buildMonthlyOutlookSummary.ts と同期すること。
Object.defineProperty(exports, "__esModule", { value: true });
exports.percentileToTopPercentLabel = percentileToTopPercentLabel;
exports.buildMonthlyOutlookSummary = buildMonthlyOutlookSummary;
const monthlyRadarJudge_1 = require("./monthlyRadarJudge");
const AXIS_LABEL = {
    win: { ja: "WIN", en: "WIN" },
    scorer: { ja: "SCORER", en: "SCORER" },
    upset: { ja: "UPSET", en: "UPSET" },
    activity: { ja: "ACTIVITY", en: "ACTIVITY" },
    consistency: { ja: "CONSISTENCY", en: "CONSISTENCY" },
};
function axisLabel(axis, lang) {
    return AXIS_LABEL[axis][lang];
}
/** パーセンタイル → 「上位 N%」（最低1） */
function percentileToTopPercentLabel(p) {
    const top = Math.round(100 - p);
    return Math.max(1, Math.min(99, top));
}
function pickStrengthAxis(strengths, radar) {
    var _a, _b;
    const pool = strengths.length > 0 ? strengths : [...monthlyRadarJudge_1.MONTHLY_RADAR_AXIS_ORDER];
    let best = pool[0];
    for (const a of pool) {
        if (((_a = radar[a]) !== null && _a !== void 0 ? _a : 0) > ((_b = radar[best]) !== null && _b !== void 0 ? _b : 0))
            best = a;
    }
    return best;
}
function pickImproveAxis(strengthAxis, radar, activityRate) {
    var _a, _b;
    if (activityRate < 0.5)
        return "activity";
    let worst = null;
    for (const a of monthlyRadarJudge_1.MONTHLY_RADAR_AXIS_ORDER) {
        if (a === strengthAxis)
            continue;
        if (worst == null || ((_a = radar[a]) !== null && _a !== void 0 ? _a : 0) < ((_b = radar[worst]) !== null && _b !== void 0 ? _b : 0))
            worst = a;
    }
    return worst !== null && worst !== void 0 ? worst : "scorer";
}
function strengthFact(axis, p, facts, lang) {
    var _a;
    const top = percentileToTopPercentLabel(p);
    const name = axisLabel(axis, lang);
    const base = lang === "en"
        ? `${name} landed in the top ${top}%`
        : `${name} は上位 ${top}% 帯`;
    const deltaKey = axis === "win"
        ? "win"
        : axis === "scorer"
            ? "scorer"
            : axis === "upset"
                ? "upset"
                : axis === "activity"
                    ? "activity"
                    : null;
    const d = deltaKey ? (_a = facts.prevDelta) === null || _a === void 0 ? void 0 : _a[deltaKey] : null;
    if (d != null && Number.isFinite(d) && d !== 0) {
        if (lang === "en") {
            const sign = d > 0 ? "+" : "";
            return `${base}, MoM ${sign}${Math.round(d * 10) / 10}`;
        }
        const sign = d > 0 ? "+" : "−";
        const abs = Math.abs(Math.round(d * 10) / 10);
        return `${base}で、前月比 ${sign}${abs}`;
    }
    return base;
}
function improveLine(axis, p, lang) {
    const name = axisLabel(axis, lang);
    const pr = Math.round(p);
    if (lang === "en") {
        if (axis === "activity") {
            return `${name} lagged (p${pr}) — pickup volume is still thin`;
        }
        return `${name} was the softest axis (p${pr})`;
    }
    if (axis === "activity") {
        return `${name} は p${pr} と参加が薄く、量の土台が課題`;
    }
    if (p < 40) {
        return `${name} は p${pr} とチャート低帯で穴になっている`;
    }
    return `${name} が相対的に弱く（p${pr}）、伸ばししろがある`;
}
function goalLine(axis, lang) {
    if (lang === "en") {
        switch (axis) {
            case "win":
                return "get win rate back above the cohort median";
            case "scorer":
                return "enter scorer picks in at least 10 games";
            case "upset":
                return "slot in a couple of upset candidates each week";
            case "activity":
                return "hit at least half of the pickup slate";
            case "consistency":
                return "cut losing runs and keep the week-to-week floor higher";
        }
    }
    switch (axis) {
        case "win":
            return "勝率を中央値以上に戻す";
        case "scorer":
            return "得点者予想に 10 試合以上入る";
        case "upset":
            return "週あたり UPSET 候補を意識して入れる";
        case "activity":
            return "ピックアップの半分以上に参加する";
        case "consistency":
            return "連敗の傷を抑えて週の安定を上げる";
    }
}
/**
 * レーダー・強み・事実値 → 今月のサマリー1本文。
 */
function buildMonthlyOutlookSummary(input) {
    var _a, _b, _c;
    const lang = (_a = input.lang) !== null && _a !== void 0 ? _a : "ja";
    const { sampleEligible, strengths, radar, facts } = input;
    if (!sampleEligible) {
        return {
            summary: lang === "en"
                ? "Pickup participation stayed under half, so style matters less than volume right now. Next month, clear the halfway mark on the pickup slate first."
                : "ピックアップ参加が半分未満で、型より先に量の土台が必要。来月はまず半分以上への参加を目標にしたい。",
        };
    }
    if (strengths.length >= 5) {
        return {
            summary: lang === "en"
                ? "All five axes cleared the strength line — almost no hole this month. Next month the theme is holding the floor, not adding a new spike."
                : "5軸すべてが強みラインに乗り、穴はほぼない月だった。来月は新しい尖りより、この水準を落とさない運用がテーマ。",
        };
    }
    const strengthAxis = pickStrengthAxis(strengths, radar);
    const improveAxis = pickImproveAxis(strengthAxis, radar, facts.activityRate);
    const sp = (_b = radar[strengthAxis]) !== null && _b !== void 0 ? _b : 50;
    const ip = (_c = radar[improveAxis]) !== null && _c !== void 0 ? _c : 50;
    const sFact = strengthFact(strengthAxis, sp, facts, lang);
    const iLine = improveLine(improveAxis, ip, lang);
    const gLine = goalLine(improveAxis, lang);
    if (lang === "en") {
        return {
            summary: `${sFact}. Meanwhile ${iLine}. Next month, ${gLine}.`,
        };
    }
    return {
        summary: `${sFact}。一方、${iLine}。来月は${gLine}ことを目標にしたい。`,
    };
}
//# sourceMappingURL=buildMonthlyOutlookSummary.js.map