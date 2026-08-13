"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncProfileHeroSnapshotOnNbaSettle = syncProfileHeroSnapshotOnNbaSettle;
exports.refreshProfileHeroSnapshotFromCumulative = refreshProfileHeroSnapshotFromCumulative;
/**
 * NBA settle 後に users.profileHeroSnapshot を増分更新（cumulative_stats 非読）。
 */
const firestore_1 = require("firebase-admin/firestore");
const nbaSeason_1 = require("../rankings/nbaSeason");
const profileHeroSnapshot_1 = require("./profileHeroSnapshot");
async function syncProfileHeroSnapshotOnNbaSettle(opts) {
    var _a, _b;
    const leagueKey = String((_a = opts.league) !== null && _a !== void 0 ? _a : "")
        .trim()
        .toLowerCase();
    if (!opts.countsForRanking || leagueKey !== "nba")
        return;
    const startDate = opts.startAt &&
        typeof opts.startAt.toDate === "function"
        ? opts.startAt.toDate()
        : opts.startAt instanceof Date
            ? opts.startAt
            : new Date();
    const phase = (0, nbaSeason_1.normalizeNbaSeasonPhase)(opts.seasonPhase);
    const { nbaSeasonKey, nbaPlayoffsSeasonKey } = (0, nbaSeason_1.resolveNbaRankingBucketKeys)("nba", true, startDate, phase);
    const incSeason = opts.isPickup && Boolean(nbaSeasonKey);
    const incPlayoffs = Boolean(nbaPlayoffsSeasonKey);
    if (!incSeason && !incPlayoffs)
        return;
    const seasonKey = (_b = nbaSeasonKey !== null && nbaSeasonKey !== void 0 ? nbaSeasonKey : nbaPlayoffsSeasonKey) !== null && _b !== void 0 ? _b : profileHeroSnapshot_1.CURRENT_NBA_SEASON_KEY;
    const inc = {
        isWin: opts.isWin,
        points: opts.points,
        upsetPoints: opts.upsetPoints,
        upsetBonus: opts.upsetBonus,
        streakBonus: opts.streakBonus,
        goalScorerHit: opts.goalScorerHit,
        hadUpsetGame: opts.hadUpsetGame,
        upsetHit: opts.upsetHit,
    };
    const db = (0, firestore_1.getFirestore)();
    const userRef = db.doc(`users/${opts.uid}`);
    await db.runTransaction(async (tx) => {
        const snap = await tx.get(userRef);
        const user = (snap.exists ? snap.data() : {});
        let hero = (0, profileHeroSnapshot_1.parseStoredHeroSnapshot)(user);
        if (!hero || hero.seasonKey !== seasonKey) {
            hero = (0, profileHeroSnapshot_1.emptyHeroSnapshot)(seasonKey);
        }
        if (hero.lastPostId === opts.postId)
            return;
        if (incSeason) {
            hero.season = (0, profileHeroSnapshot_1.incrementHeroScope)(hero.season, inc);
        }
        if (incPlayoffs) {
            hero.playoffs = (0, profileHeroSnapshot_1.incrementHeroScope)(hero.playoffs, inc);
        }
        hero.activeWinStreak = Math.max(0, Math.floor(opts.activeWinStreak || 0));
        hero.updatedAtMs = Date.now();
        hero.lastPostId = opts.postId;
        tx.set(userRef, {
            profileHeroSnapshot: hero,
            updatedAt: firestore_1.FieldValue.serverTimestamp(),
        }, { merge: true });
    });
}
/**
 * 日次 rank snapshot 後 — cumulative から hero を再構築（順位 + ドリフト補正）。
 */
async function refreshProfileHeroSnapshotFromCumulative(uid, cumulative, seasonKey) {
    const { buildProfileHeroSnapshotFromCumulative } = await Promise.resolve().then(() => __importStar(require("./profileHeroSnapshot")));
    const hero = buildProfileHeroSnapshotFromCumulative(cumulative, seasonKey);
    await (0, firestore_1.getFirestore)()
        .doc(`users/${uid}`)
        .set({
        profileHeroSnapshot: hero,
        updatedAt: firestore_1.FieldValue.serverTimestamp(),
    }, { merge: true });
}
//# sourceMappingURL=syncProfileHeroSnapshotOnNbaSettle.js.map