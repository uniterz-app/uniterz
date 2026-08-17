"use strict";
// synced from lib/reports/buildMonthlyHighlights.ts — run npm run sync:monthly-report-builders
// 月次レポート「月間ハイライト」— ピックアップ候補から価値の高い最大 3 件。
// docs/pro-subscription-plan.md §6
// functions/src/reports/buildMonthlyHighlights.ts と同期すること。
Object.defineProperty(exports, "__esModule", { value: true });
exports.MONTHLY_HIGHLIGHT_MIN_STREAK = exports.MONTHLY_HIGHLIGHTS_LIMIT = void 0;
exports.buildMonthlyHighlights = buildMonthlyHighlights;
exports.MONTHLY_HIGHLIGHTS_LIMIT = 3;
exports.MONTHLY_HIGHLIGHT_MIN_STREAK = 3;
function calcMaxWinStreak(events) {
    const sorted = [...events].sort((a, b) => a.settledAtMs - b.settledAtMs);
    let cur = 0;
    let max = 0;
    for (const e of sorted) {
        if (e.isWin) {
            cur += 1;
            if (cur > max)
                max = cur;
        }
        else {
            cur = 0;
        }
    }
    return max;
}
function bestDivisionTop10(ranks) {
    if (!ranks)
        return null;
    const cands = [];
    if (ranks.winRate != null && ranks.winRate >= 1 && ranks.winRate <= 10) {
        cands.push({ division: "winRate", rank: ranks.winRate });
    }
    if (ranks.goalScorerHits != null &&
        ranks.goalScorerHits >= 1 &&
        ranks.goalScorerHits <= 10) {
        cands.push({ division: "goalScorerHits", rank: ranks.goalScorerHits });
    }
    if (ranks.upset != null && ranks.upset >= 1 && ranks.upset <= 10) {
        cands.push({ division: "upset", rank: ranks.upset });
    }
    if (cands.length === 0)
        return null;
    cands.sort((a, b) => a.rank - b.rank);
    const best = cands[0];
    return { kind: "divisionTop10", division: best.division, rank: best.rank };
}
/**
 * 月内 posts イベント + 部門順位 → ハイライト最大 limit 件。
 * 種別は重複させず、価値スコア上位を採用。bestPick があれば先頭。
 */
function buildMonthlyHighlights(events, ranks, opts) {
    var _a, _b, _c;
    const limit = (_a = opts === null || opts === void 0 ? void 0 : opts.limit) !== null && _a !== void 0 ? _a : exports.MONTHLY_HIGHLIGHTS_LIMIT;
    const minStreak = (_b = opts === null || opts === void 0 ? void 0 : opts.minStreak) !== null && _b !== void 0 ? _b : exports.MONTHLY_HIGHLIGHT_MIN_STREAK;
    const scored = [];
    if (events.length > 0) {
        let best = events[0];
        for (const e of events) {
            if (e.points > best.points)
                best = e;
        }
        if (best.points > 0) {
            scored.push({
                value: best.points,
                item: {
                    kind: "bestPick",
                    dateKey: best.dateKey,
                    home: best.home,
                    away: best.away,
                    myHome: best.myHome,
                    myAway: best.myAway,
                    points: best.points,
                },
            });
        }
        const byDay = new Map();
        for (const e of events) {
            const d = (_c = byDay.get(e.dateKey)) !== null && _c !== void 0 ? _c : { points: 0, wins: 0, posts: 0 };
            d.points += e.points;
            d.posts += 1;
            if (e.isWin)
                d.wins += 1;
            byDay.set(e.dateKey, d);
        }
        let bestDayKey = "";
        let bestDay = { points: 0, wins: 0, posts: 0 };
        for (const [k, v] of byDay) {
            if (v.points > bestDay.points ||
                (v.points === bestDay.points && v.posts > bestDay.posts)) {
                bestDayKey = k;
                bestDay = v;
            }
        }
        if (bestDayKey && bestDay.points > 0) {
            scored.push({
                value: bestDay.points * 0.85,
                item: {
                    kind: "bestDay",
                    dateKey: bestDayKey,
                    points: bestDay.points,
                    wins: bestDay.wins,
                    posts: bestDay.posts,
                },
            });
        }
        let bestUpset = events[0];
        for (const e of events) {
            if (e.upsetPoints > bestUpset.upsetPoints)
                bestUpset = e;
        }
        if (bestUpset.upsetPoints > 0) {
            scored.push({
                value: bestUpset.upsetPoints * 1.2,
                item: {
                    kind: "upset",
                    dateKey: bestUpset.dateKey,
                    label: `${bestUpset.away.abbr} @ ${bestUpset.home.abbr}`,
                    points: bestUpset.upsetPoints,
                },
            });
        }
        const streak = calcMaxWinStreak(events);
        if (streak >= minStreak) {
            scored.push({
                value: streak * 2.5,
                item: { kind: "winStreak", length: streak },
            });
        }
    }
    const div = bestDivisionTop10(ranks);
    if (div) {
        scored.push({
            value: (11 - div.rank) * 2,
            item: div,
        });
    }
    scored.sort((a, b) => b.value - a.value);
    const picked = [];
    const seen = new Set();
    for (const s of scored) {
        if (picked.length >= limit)
            break;
        if (seen.has(s.item.kind))
            continue;
        seen.add(s.item.kind);
        picked.push(s.item);
    }
    // UI は bestPick を先頭に置く
    const bestPick = picked.find((h) => h.kind === "bestPick");
    if (!bestPick)
        return picked;
    return [bestPick, ...picked.filter((h) => h !== bestPick)];
}
//# sourceMappingURL=buildMonthlyHighlights.js.map