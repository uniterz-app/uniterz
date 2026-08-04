"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PRO_SKIN_PERIOD_WIN_MILESTONES = exports.PRO_SKIN_REFERRAL_MILESTONES = exports.PRO_SKIN_RANK_MILESTONES = exports.PRO_SKIN_THRESHOLD_MILESTONES = exports.PRO_SKIN_UNLOCK_FROM_SEASON_KEY = void 0;
exports.proSkinPeriodWinCounterKey = proSkinPeriodWinCounterKey;
// synced from lib/profile/proSkinMilestoneCatalog.ts — run npm run sync:pro-skin-milestone-catalog
/**
 * Pro Skin マイルストーン定義の単一ソース。
 * Functions へは `npm run sync:pro-skin-milestone-catalog` で同期する。
 *
 * 構成: 即解放 12 / マイルストーン 20
 *
 * - 閾値系 → NBA settle
 * - 順位1回系 → period snapshot 確定後 grant（earnedIds）
 * - 順位回数系 → 同 grant で wins 加算 → 閾値到達で解放
 * - 招待系 → referral settle で completedCount 到達時に解放
 */
exports.PRO_SKIN_UNLOCK_FROM_SEASON_KEY = "2026-27";
/**
 * 努力・精度（連勝 / Perfect / 予想）
 * Crimson Shard / Signal Mosaic はマイルストーン（スクショ指定）
 */
exports.PRO_SKIN_THRESHOLD_MILESTONES = [
    { id: "wave-crimson-shard", kind: "streak", threshold: 5 },
    { id: "beast-viper", kind: "streak", threshold: 7 },
    { id: "scale-king", kind: "streak", threshold: 10 },
    { id: "scale-dragon", kind: "streak", threshold: 15 },
    { id: "wave-signal-mosaic", kind: "exactHits", threshold: 5 },
    { id: "beast-shard", kind: "exactHits", threshold: 10 },
    { id: "beast-circuitlace", kind: "posts", threshold: 100 },
    { id: "beast-eclipse", kind: "posts", threshold: 150 },
];
/** 週/月順位 1回達成（standard ボード） */
exports.PRO_SKIN_RANK_MILESTONES = [
    {
        id: "wave-chem-ink",
        period: "monthly",
        metric: "totalPoints",
        maxRank: 10,
    },
    {
        id: "form-isocubes",
        period: "weekly",
        metric: "totalPoints",
        maxRank: 1,
    },
    {
        id: "beast-facet",
        period: "monthly",
        metric: "totalGoalScorerHits",
        maxRank: 1,
    },
    {
        id: "beast-thunder",
        period: "monthly",
        metric: "totalUpset",
        maxRank: 1,
    },
    {
        id: "beast-starborne",
        period: "monthly",
        metric: "winRate",
        maxRank: 1,
    },
    {
        id: "beast-regalia",
        period: "monthly",
        metric: "totalPoints",
        maxRank: 1,
    },
];
/** Wave — 招待完了人数 */
exports.PRO_SKIN_REFERRAL_MILESTONES = [
    { id: "wave-cyan-grid", completedCount: 5 },
    { id: "wave-gold-monogram", completedCount: 10 },
];
/**
 * Wave / Beast — 週/月条件の累計回数
 */
exports.PRO_SKIN_PERIOD_WIN_MILESTONES = [
    {
        id: "wave-neon-ridge",
        period: "monthly",
        metric: "totalPoints",
        maxRank: 10,
        wins: 3,
    },
    {
        id: "beast-jagarmor",
        period: "monthly",
        metric: "totalPoints",
        maxRank: 10,
        wins: 5,
    },
    {
        id: "wave-ember-hex",
        period: "weekly",
        metric: "totalPoints",
        maxRank: 1,
        wins: 3,
    },
    {
        id: "wave-obsidian-warp",
        period: "weekly",
        metric: "totalPoints",
        maxRank: 1,
        wins: 5,
    },
];
/** periodWins カウンタのキー（users.proSkinProgress.periodWins） */
function proSkinPeriodWinCounterKey(opts) {
    return `${opts.period}_${opts.metric}_${opts.maxRank}`;
}
//# sourceMappingURL=proSkinMilestoneCatalog.js.map