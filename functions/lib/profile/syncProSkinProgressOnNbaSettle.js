"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncProSkinProgressOnNbaSettle = syncProSkinProgressOnNbaSettle;
/**
 * NBA settle 後に users.proSkinProgress を更新し、閾値マイルストーンを永続化。
 * cumulative_stats は読まない（薄いミラー集計）。
 *
 * Free 中も進捗は積む。解放は Pro のみ。
 * Pro 中に閾値を今回初めて跨いだ ID だけ proSkinUnlockNoticeIds へ（モーダル用）。
 * Free→Pro 遡及は ensurePersisted 側で unlocked のみ（notice なし）。
 */
const firestore_1 = require("firebase-admin/firestore");
const nbaSeason_1 = require("../rankings/nbaSeason");
const proSkinMilestoneCatalog_1 = require("./proSkinMilestoneCatalog");
const OWNER_COUNTS_DOC = "meta/proSkinOwnerCounts";
function safeInt(v) {
    const n = typeof v === "number" ? v : Number(v);
    return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
}
function isProUser(user) {
    if (user.plan !== "pro")
        return false;
    const until = user.proUntil;
    if (until == null || until === "")
        return true;
    let ms = 0;
    if (until instanceof Date)
        ms = until.getTime();
    else if (typeof until === "number")
        ms = until < 1e12 ? until * 1000 : until;
    else if (typeof until === "string") {
        const parsed = Date.parse(until);
        ms = Number.isFinite(parsed) ? parsed : 0;
    }
    else if (typeof until.toMillis === "function")
        ms = until.toMillis();
    else if (typeof until.seconds === "number")
        ms = until.seconds * 1000;
    else if (typeof until._seconds === "number")
        ms = until._seconds * 1000;
    if (!Number.isFinite(ms) || ms <= 0)
        return true;
    return ms > Date.now();
}
async function incrementHolderCounts(ids) {
    const unique = [...new Set(ids)].filter(Boolean);
    if (unique.length === 0)
        return;
    const updates = {
        updatedAt: firestore_1.FieldValue.serverTimestamp(),
    };
    for (const id of unique) {
        updates[`counts.${id}`] = firestore_1.FieldValue.increment(1);
    }
    await (0, firestore_1.getFirestore)().doc(OWNER_COUNTS_DOC).set(updates, { merge: true });
}
async function syncProSkinProgressOnNbaSettle(opts) {
    var _a;
    const leagueKey = String((_a = opts.league) !== null && _a !== void 0 ? _a : "")
        .trim()
        .toLowerCase();
    if (!opts.countsForRanking || leagueKey !== "nba")
        return;
    const startDate = opts.startAt && typeof opts.startAt.toDate ===
        "function"
        ? opts.startAt.toDate()
        : opts.startAt instanceof Date
            ? opts.startAt
            : new Date();
    const { nbaSeasonKey } = (0, nbaSeason_1.resolveNbaRankingBucketKeys)(leagueKey === "nba" ? "nba" : leagueKey, true, startDate, (0, nbaSeason_1.normalizeNbaSeasonPhase)(opts.seasonPhase));
    if (!nbaSeasonKey ||
        nbaSeasonKey < proSkinMilestoneCatalog_1.PRO_SKIN_UNLOCK_FROM_SEASON_KEY) {
        return;
    }
    const db = (0, firestore_1.getFirestore)();
    const userRef = db.doc(`users/${opts.uid}`);
    let newlyUnlockedIds = [];
    await db.runTransaction(async (tx) => {
        newlyUnlockedIds = [];
        const snap = await tx.get(userRef);
        const user = (snap.exists ? snap.data() : {});
        const prevRaw = user.proSkinProgress;
        const prevSeason = typeof (prevRaw === null || prevRaw === void 0 ? void 0 : prevRaw.seasonKey) === "string" ? prevRaw.seasonKey : "";
        const lastPostId = typeof (prevRaw === null || prevRaw === void 0 ? void 0 : prevRaw.lastPostId) === "string" ? prevRaw.lastPostId : "";
        if (lastPostId === opts.postId)
            return;
        const sameSeason = prevSeason === nbaSeasonKey;
        const prevPosts = sameSeason ? safeInt(prevRaw === null || prevRaw === void 0 ? void 0 : prevRaw.posts) : 0;
        const prevExactHits = sameSeason ? safeInt(prevRaw === null || prevRaw === void 0 ? void 0 : prevRaw.exactHits) : 0;
        const prevMaxWinStreak = sameSeason ? safeInt(prevRaw === null || prevRaw === void 0 ? void 0 : prevRaw.maxWinStreak) : 0;
        const posts = prevPosts + 1;
        const exactHits = prevExactHits + (opts.exactHit ? 1 : 0);
        let maxWinStreak = prevMaxWinStreak;
        const streak = Math.max(0, Math.floor(opts.activeWinStreak || 0));
        if (streak > maxWinStreak)
            maxWinStreak = streak;
        const isPro = isProUser(user);
        const unlocked = new Set(Array.isArray(user.proSkinUnlockedIds)
            ? user.proSkinUnlockedIds.filter((x) => typeof x === "string")
            : []);
        /** Pro 中に閾値を「今回初めて」跨いだ ID のみモーダル対象 */
        const liveNoticeIds = [];
        if (isPro) {
            for (const row of proSkinMilestoneCatalog_1.PRO_SKIN_THRESHOLD_MILESTONES) {
                const prevOk = row.kind === "streak"
                    ? prevMaxWinStreak >= row.threshold
                    : row.kind === "posts"
                        ? prevPosts >= row.threshold
                        : prevExactHits >= row.threshold;
                const nowOk = row.kind === "streak"
                    ? maxWinStreak >= row.threshold
                    : row.kind === "posts"
                        ? posts >= row.threshold
                        : exactHits >= row.threshold;
                if (nowOk) {
                    if (!unlocked.has(row.id))
                        newlyUnlockedIds.push(row.id);
                    unlocked.add(row.id);
                    if (!prevOk)
                        liveNoticeIds.push(row.id);
                }
            }
        }
        const patch = {
            proSkinProgress: {
                seasonKey: nbaSeasonKey,
                posts,
                exactHits,
                maxWinStreak,
                updatedAtMs: Date.now(),
                lastPostId: opts.postId,
            },
            proSkinUnlockedIds: [...unlocked],
            proSkinUnlockSeason: proSkinMilestoneCatalog_1.PRO_SKIN_UNLOCK_FROM_SEASON_KEY,
            updatedAt: firestore_1.FieldValue.serverTimestamp(),
        };
        if (liveNoticeIds.length > 0) {
            patch.proSkinUnlockNoticeIds = firestore_1.FieldValue.arrayUnion(...liveNoticeIds);
        }
        tx.set(userRef, patch, { merge: true });
    });
    if (newlyUnlockedIds.length > 0) {
        try {
            await incrementHolderCounts(newlyUnlockedIds);
        }
        catch (err) {
            console.warn("[syncProSkinProgressOnNbaSettle] holder count failed", err);
        }
    }
}
//# sourceMappingURL=syncProSkinProgressOnNbaSettle.js.map