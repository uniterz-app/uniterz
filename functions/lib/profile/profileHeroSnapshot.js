"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CURRENT_NBA_SEASON_KEY = exports.nbaSeasonKeyFromDateJST = exports.PROFILE_HERO_SNAPSHOT_VERSION = void 0;
exports.buildProfileHeroSnapshotFromCumulative = buildProfileHeroSnapshotFromCumulative;
exports.parseStoredHeroSnapshot = parseStoredHeroSnapshot;
exports.incrementHeroScope = incrementHeroScope;
exports.emptyHeroSnapshot = emptyHeroSnapshot;
/**
 * users.profileHeroSnapshot — Functions 側ビルド / 更新ヘルパ。
 */
const nbaSeason_1 = require("../rankings/nbaSeason");
Object.defineProperty(exports, "CURRENT_NBA_SEASON_KEY", { enumerable: true, get: function () { return nbaSeason_1.CURRENT_NBA_SEASON_KEY; } });
Object.defineProperty(exports, "nbaSeasonKeyFromDateJST", { enumerable: true, get: function () { return nbaSeason_1.nbaSeasonKeyFromDateJST; } });
exports.PROFILE_HERO_SNAPSHOT_VERSION = 1;
function safeInt(v) {
    const n = typeof v === "number" ? v : Number(v);
    return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
}
function safeNum(v) {
    const n = typeof v === "number" ? v : Number(v);
    return Number.isFinite(n) ? n : 0;
}
function asBucket(v) {
    if (!v || typeof v !== "object")
        return {};
    return v;
}
function pickSeasonBucket(cumulative, seasonKey) {
    var _a;
    if (!cumulative)
        return {};
    const bySeason = ((_a = cumulative.rankingBySeason) !== null && _a !== void 0 ? _a : {});
    return asBucket(bySeason[seasonKey]);
}
function pickPlayoffsBucket(cumulative, seasonKey) {
    var _a;
    if (!cumulative)
        return {};
    const byPlayoffs = ((_a = cumulative.rankingByNbaPlayoffs) !== null && _a !== void 0 ? _a : {});
    return asBucket(byPlayoffs[seasonKey]);
}
function scopeFromBucket(bucket) {
    var _a;
    const posts = safeInt(bucket.totalPosts);
    const wins = safeInt(bucket.totalWins);
    const pointsSumV3 = safeNum(bucket.totalPoints);
    const upsetBonusSum = safeNum(bucket.upsetBonusSum);
    const streakBonusSum = safeNum(bucket.streakBonusSum);
    return {
        posts,
        wins,
        winRate: posts > 0 ? wins / posts : 0,
        goalScorerHitCount: safeInt((_a = bucket.totalGoalScorerHits) !== null && _a !== void 0 ? _a : bucket.goalScorerHitCount),
        pointsSumV3,
        upsetPointsSum: safeNum(bucket.totalUpset),
        upsetBonusSum,
        streakBonusSum,
        basePointsSum: Math.max(0, pointsSumV3 - upsetBonusSum - streakBonusSum),
        upsetChanceCount: safeInt(bucket.upsetOpportunityCount),
        upsetHitCount: safeInt(bucket.upsetHitCount),
    };
}
function emptyScope() {
    return {
        posts: 0,
        wins: 0,
        winRate: 0,
        goalScorerHitCount: 0,
        pointsSumV3: 0,
        upsetPointsSum: 0,
        upsetBonusSum: 0,
        streakBonusSum: 0,
        basePointsSum: 0,
        upsetChanceCount: 0,
        upsetHitCount: 0,
    };
}
function readRank(cumulative, metric) {
    var _a, _b;
    if (!cumulative)
        return null;
    const nested = cumulative.snapshotRanks;
    const seasons = ((_a = nested === null || nested === void 0 ? void 0 : nested.seasons) !== null && _a !== void 0 ? _a : cumulative["snapshotRanks.seasons"]);
    const raw = (_b = seasons === null || seasons === void 0 ? void 0 : seasons[nbaSeason_1.CURRENT_NBA_SEASON_KEY]) === null || _b === void 0 ? void 0 : _b[metric];
    const n = typeof raw === "number" ? raw : Number(raw);
    if (!Number.isFinite(n))
        return null;
    const i = Math.floor(n);
    return i > 0 ? i : null;
}
function ranksFromCumulative(cumulative) {
    return {
        totalPoints: readRank(cumulative, "totalPoints"),
        totalPrecision: readRank(cumulative, "totalPrecision"),
        totalUpset: readRank(cumulative, "totalUpset"),
        totalPointsDenominator: null,
        rankDeltaPlaces: null,
    };
}
function activeStreakFromCumulative(cumulative) {
    var _a, _b, _c, _d, _e;
    if (!cumulative)
        return 0;
    const signed = (_e = (_d = (_c = (_a = cumulative.activeWinStreakBasketball) !== null && _a !== void 0 ? _a : (_b = cumulative.streakBySport) === null || _b === void 0 ? void 0 : _b.basketball) !== null && _c !== void 0 ? _c : cumulative.currentStreak) !== null && _d !== void 0 ? _d : cumulative.activeWinStreak) !== null && _e !== void 0 ? _e : 0;
    return typeof signed === "number" && signed > 0 ? Math.floor(signed) : 0;
}
function buildProfileHeroSnapshotFromCumulative(cumulative, seasonKey = nbaSeason_1.CURRENT_NBA_SEASON_KEY) {
    /** rankingBySeason / rankingByNbaPlayoffs の現行キーのみ。ルート flat・WC 合算は使わない */
    const season = scopeFromBucket(pickSeasonBucket(cumulative, seasonKey));
    const playoffs = scopeFromBucket(pickPlayoffsBucket(cumulative, seasonKey));
    return {
        v: exports.PROFILE_HERO_SNAPSHOT_VERSION,
        seasonKey,
        updatedAtMs: Date.now(),
        activeWinStreak: activeStreakFromCumulative(cumulative),
        ranks: ranksFromCumulative(cumulative),
        season,
        playoffs,
    };
}
function parseStoredHeroSnapshot(user) {
    const raw = user.profileHeroSnapshot;
    if (!raw || typeof raw !== "object")
        return null;
    const o = raw;
    if (o.v !== exports.PROFILE_HERO_SNAPSHOT_VERSION)
        return null;
    const seasonKey = typeof o.seasonKey === "string" ? o.seasonKey.trim() : "";
    if (!seasonKey)
        return null;
    const parseScope = (s) => {
        if (!s || typeof s !== "object")
            return null;
        const x = s;
        const posts = safeInt(x.posts);
        const wins = safeInt(x.wins);
        return {
            posts,
            wins,
            winRate: safeNum(x.winRate),
            goalScorerHitCount: safeInt(x.goalScorerHitCount),
            pointsSumV3: safeNum(x.pointsSumV3),
            upsetPointsSum: safeNum(x.upsetPointsSum),
            upsetBonusSum: safeNum(x.upsetBonusSum),
            streakBonusSum: safeNum(x.streakBonusSum),
            basePointsSum: safeNum(x.basePointsSum),
            upsetChanceCount: safeInt(x.upsetChanceCount),
            upsetHitCount: safeInt(x.upsetHitCount),
        };
    };
    const season = parseScope(o.season);
    const playoffs = parseScope(o.playoffs);
    if (!season || !playoffs)
        return null;
    const ranksRaw = o.ranks;
    const ranks = {
        totalPoints: null,
        totalPrecision: null,
        totalUpset: null,
        totalPointsDenominator: null,
        rankDeltaPlaces: null,
    };
    if (ranksRaw && typeof ranksRaw === "object") {
        const r = ranksRaw;
        for (const key of [
            "totalPoints",
            "totalPrecision",
            "totalUpset",
        ]) {
            const n = typeof r[key] === "number" ? r[key] : Number(r[key]);
            ranks[key] = Number.isFinite(n) && n > 0 ? Math.floor(n) : null;
        }
    }
    return {
        v: exports.PROFILE_HERO_SNAPSHOT_VERSION,
        seasonKey,
        updatedAtMs: safeInt(o.updatedAtMs),
        lastPostId: typeof o.lastPostId === "string" ? o.lastPostId : undefined,
        activeWinStreak: safeInt(o.activeWinStreak),
        ranks,
        season,
        playoffs,
    };
}
function incrementHeroScope(scope, inc) {
    const posts = scope.posts + 1;
    const wins = scope.wins + (inc.isWin ? 1 : 0);
    const pointsSumV3 = scope.pointsSumV3 + inc.points;
    const upsetBonusSum = scope.upsetBonusSum + inc.upsetBonus;
    const streakBonusSum = scope.streakBonusSum + inc.streakBonus;
    return {
        posts,
        wins,
        winRate: posts > 0 ? wins / posts : 0,
        goalScorerHitCount: scope.goalScorerHitCount + (inc.goalScorerHit ? 1 : 0),
        pointsSumV3,
        upsetPointsSum: scope.upsetPointsSum + inc.upsetPoints,
        upsetBonusSum,
        streakBonusSum,
        basePointsSum: Math.max(0, pointsSumV3 - upsetBonusSum - streakBonusSum),
        upsetChanceCount: scope.upsetChanceCount + (inc.hadUpsetGame ? 1 : 0),
        upsetHitCount: scope.upsetHitCount + (inc.upsetHit ? 1 : 0),
    };
}
function emptyHeroSnapshot(seasonKey) {
    return {
        v: exports.PROFILE_HERO_SNAPSHOT_VERSION,
        seasonKey,
        updatedAtMs: Date.now(),
        activeWinStreak: 0,
        ranks: {
            totalPoints: null,
            totalPrecision: null,
            totalUpset: null,
            totalPointsDenominator: null,
            rankDeltaPlaces: null,
        },
        season: emptyScope(),
        playoffs: emptyScope(),
    };
}
//# sourceMappingURL=profileHeroSnapshot.js.map