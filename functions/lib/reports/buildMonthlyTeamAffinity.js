"use strict";
// synced from lib/reports/buildMonthlyTeamAffinity.ts — run npm run sync:monthly-report-builders
// 月次レポート「チーム相性」— ピックアップ・推した側・獲得 pt 上下位。
// docs/pro-subscription-plan.md §5
// functions/src/reports/buildMonthlyTeamAffinity.ts と同期すること。
Object.defineProperty(exports, "__esModule", { value: true });
exports.MONTHLY_TEAM_AFFINITY_LIMIT = exports.MONTHLY_TEAM_AFFINITY_MIN_GAMES = void 0;
exports.buildMonthlyTeamAffinity = buildMonthlyTeamAffinity;
exports.accumulateTeamAffinityPost = accumulateTeamAffinityPost;
exports.MONTHLY_TEAM_AFFINITY_MIN_GAMES = 2;
exports.MONTHLY_TEAM_AFFINITY_LIMIT = 3;
function toRow(a) {
    return {
        teamId: a.teamId,
        abbr: a.abbr || a.teamId,
        games: a.games,
        wins: a.wins,
        losses: Math.max(0, a.games - a.wins),
        points: a.points,
    };
}
/**
 * ピックアップ内・推した側チームの集計 → 得意 / 苦手。
 * 並びの正は獲得 pt。最低 games ≥ minGames。足りなければ出る分だけ。
 */
function buildMonthlyTeamAffinity(aggs, opts) {
    var _a, _b;
    const minGames = (_a = opts === null || opts === void 0 ? void 0 : opts.minGames) !== null && _a !== void 0 ? _a : exports.MONTHLY_TEAM_AFFINITY_MIN_GAMES;
    const limit = (_b = opts === null || opts === void 0 ? void 0 : opts.limit) !== null && _b !== void 0 ? _b : exports.MONTHLY_TEAM_AFFINITY_LIMIT;
    const eligible = aggs
        .filter((a) => a.teamId && a.games >= minGames)
        .slice()
        .sort((a, b) => {
        if (b.points !== a.points)
            return b.points - a.points;
        if (b.wins !== a.wins)
            return b.wins - a.wins;
        return b.games - a.games;
    });
    const strong = eligible.slice(0, limit).map(toRow);
    const strongIds = new Set(strong.map((t) => t.teamId));
    const weak = eligible
        .filter((a) => !strongIds.has(a.teamId))
        .slice(-limit)
        .reverse()
        .map(toRow);
    return { strong, weak };
}
/** posts 1件分を uid→team マップに加算するヘルパ */
function accumulateTeamAffinityPost(map, input) {
    var _a;
    const teamId = input.teamId;
    if (!teamId)
        return;
    const cur = (_a = map.get(teamId)) !== null && _a !== void 0 ? _a : {
        teamId,
        abbr: "",
        games: 0,
        wins: 0,
        points: 0,
    };
    cur.games += 1;
    if (input.isWin)
        cur.wins += 1;
    cur.points += Number(input.points) || 0;
    if (!cur.abbr && input.abbr)
        cur.abbr = String(input.abbr);
    map.set(teamId, cur);
}
//# sourceMappingURL=buildMonthlyTeamAffinity.js.map