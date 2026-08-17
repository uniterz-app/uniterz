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
exports.isNbaPeriodFinalForProSkinGrants = isNbaPeriodFinalForProSkinGrants;
exports.grantProSkinRankUnlocksForPeriod = grantProSkinRankUnlocksForPeriod;
exports.grantProSkinRankUnlocksAfterPeriodSnapshots = grantProSkinRankUnlocksAfterPeriodSnapshots;
/**
 * 週/月 period_ranking_snapshots が確定したあとに順位マイルストーンを記録・解放。
 *
 * - 対象順位: **standard（通常ランキング）**
 * - Free/Pro とも `users.proSkinRankEarnedIds` に薄い権利だけ残す（1回達成系）
 * - 回数系は `users.proSkinProgress.periodWins` を加算（Free も積む）
 * - Pro のときだけ unlocked + notice
 * - Free→Pro 遡及は ensurePersisted（notice なし）
 * - 冪等: meta/proSkinPeriodGrants/locks/{period}_{label} — status=done のみスキップ。running 停滞はリトライ可
 */
const firestore_1 = require("firebase-admin/firestore");
const nbaPeriod_1 = require("../rankings/nbaPeriod");
const nbaSeason_1 = require("../rankings/nbaSeason");
const countMilestoneUnlockedProSkins_1 = require("./countMilestoneUnlockedProSkins");
const proSkinMilestoneCatalog_1 = require("./proSkinMilestoneCatalog");
const OWNER_COUNTS_DOC = "meta/proSkinOwnerCounts";
/** running のままこの時間を超えたらリトライ許可 */
const GRANT_RUNNING_STALE_MS = 15 * 60 * 1000;
function periodStandardSnapshotDocId(period, label, metric) {
    return `nba_${period}_${label}_${metric}`;
}
function addGrace(periodStartKey) {
    return (0, nbaPeriod_1.addDaysToDateKey)(periodStartKey, nbaPeriod_1.PERIOD_FINALIZE_GRACE_DAYS);
}
function parseDateKeyToUtcNoon(dateKey) {
    const [y, m, d] = dateKey.split("-").map(Number);
    return new Date(Date.UTC(y, m - 1, d, 3, 0, 0));
}
function timestampToMs(v) {
    if (v &&
        typeof v === "object" &&
        typeof v.toMillis === "function") {
        return v.toMillis();
    }
    return 0;
}
/** 猶予終了後の過去期間のみ true */
function isNbaPeriodFinalForProSkinGrants(period, labelKey, now = new Date()) {
    const todayKey = (0, nbaPeriod_1.dateKeyJST)(now);
    if (period === "weekly") {
        const current = (0, nbaPeriod_1.weekStartDateKeyJST)(now);
        if (labelKey >= current)
            return false;
        if (todayKey <= addGrace(current) &&
            labelKey === (0, nbaPeriod_1.previousLabel)("weekly", current)) {
            return false;
        }
        return true;
    }
    const current = (0, nbaPeriod_1.monthLabelJST)(now);
    if (labelKey >= current)
        return false;
    if (todayKey <= addGrace(`${current}-01`) &&
        labelKey === (0, nbaPeriod_1.previousLabel)("monthly", current)) {
        return false;
    }
    return true;
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
async function incrementHolderCounts(newlyBySkin) {
    if (newlyBySkin.size === 0)
        return;
    const db = (0, firestore_1.getFirestore)();
    const updates = {
        updatedAt: firestore_1.FieldValue.serverTimestamp(),
    };
    for (const [id, n] of newlyBySkin) {
        if (n > 0)
            updates[`counts.${id}`] = firestore_1.FieldValue.increment(n);
    }
    await db.doc(OWNER_COUNTS_DOC).set(updates, { merge: true });
}
/**
 * grant ロック取得。done → スキップ。fresh running → スキップ。それ以外は claim。
 */
async function claimPeriodGrant(opts) {
    const db = (0, firestore_1.getFirestore)();
    const grantRef = db.doc((0, proSkinMilestoneCatalog_1.proSkinPeriodGrantLockDocPath)(opts.period, opts.labelKey));
    return db.runTransaction(async (tx) => {
        var _a;
        const snap = await tx.get(grantRef);
        if (snap.exists) {
            const data = ((_a = snap.data()) !== null && _a !== void 0 ? _a : {});
            if (data.status === "done")
                return false;
            if (data.status === "running") {
                const startedMs = timestampToMs(data.startedAt);
                if (startedMs > 0 &&
                    Date.now() - startedMs < GRANT_RUNNING_STALE_MS) {
                    return false;
                }
            }
        }
        tx.set(grantRef, {
            period: opts.period,
            labelKey: opts.labelKey,
            startKey: opts.startKey,
            seasonKey: opts.seasonKey,
            status: "running",
            startedAt: firestore_1.FieldValue.serverTimestamp(),
            attempt: firestore_1.FieldValue.increment(1),
        }, { merge: true });
        return true;
    });
}
async function grantProSkinRankUnlocksForPeriod(opts) {
    var _a, _b, _c, _d, _e;
    const now = (_a = opts.now) !== null && _a !== void 0 ? _a : new Date();
    if (!isNbaPeriodFinalForProSkinGrants(opts.period, opts.labelKey, now)) {
        return { granted: false, unlockedUsers: 0 };
    }
    const seasonKey = (0, nbaSeason_1.nbaSeasonKeyFromDateJST)(parseDateKeyToUtcNoon(opts.startKey));
    if (!seasonKey || seasonKey < proSkinMilestoneCatalog_1.PRO_SKIN_UNLOCK_FROM_SEASON_KEY) {
        return { granted: false, unlockedUsers: 0 };
    }
    const claimed = await claimPeriodGrant({
        period: opts.period,
        labelKey: opts.labelKey,
        startKey: opts.startKey,
        seasonKey,
    });
    if (!claimed)
        return { granted: false, unlockedUsers: 0 };
    const db = (0, firestore_1.getFirestore)();
    const grantRef = db.doc((0, proSkinMilestoneCatalog_1.proSkinPeriodGrantLockDocPath)(opts.period, opts.labelKey));
    const rules = proSkinMilestoneCatalog_1.PRO_SKIN_RANK_MILESTONES.filter((r) => r.period === opts.period);
    const periodWinRules = proSkinMilestoneCatalog_1.PRO_SKIN_PERIOD_WIN_MILESTONES.filter((r) => r.period === opts.period);
    if (rules.length === 0 && periodWinRules.length === 0) {
        await grantRef.set({
            status: "done",
            unlockedUsers: 0,
            grantedAt: firestore_1.FieldValue.serverTimestamp(),
        }, { merge: true });
        return { granted: true, unlockedUsers: 0 };
    }
    const grantsByUid = new Map();
    const periodWinIncrementsByUid = new Map();
    async function loadRankCandidates(metric, maxRank) {
        var _a;
        const snap = await db
            .collection("period_ranking_snapshots")
            .doc(periodStandardSnapshotDocId(opts.period, opts.labelKey, metric))
            .get();
        if (!snap.exists)
            return new Set();
        const data = snap.data();
        const ranks = (_a = data.ranks) !== null && _a !== void 0 ? _a : {};
        const candidates = new Set();
        for (const [uid, rank] of Object.entries(ranks)) {
            if (typeof rank === "number" && rank > 0 && rank <= maxRank) {
                candidates.add(uid);
            }
        }
        if (candidates.size === 0 && Array.isArray(data.rows)) {
            for (const row of data.rows) {
                const uid = typeof row.uid === "string" ? row.uid : "";
                const rank = typeof row.rank === "number" ? row.rank : 0;
                if (uid && rank > 0 && rank <= maxRank)
                    candidates.add(uid);
            }
        }
        return candidates;
    }
    for (const rule of rules) {
        const candidates = await loadRankCandidates(rule.metric, rule.maxRank);
        for (const uid of candidates) {
            const list = (_b = grantsByUid.get(uid)) !== null && _b !== void 0 ? _b : [];
            if (!list.includes(rule.id))
                list.push(rule.id);
            grantsByUid.set(uid, list);
        }
    }
    const seenWinKeys = new Set();
    for (const rule of periodWinRules) {
        const key = (0, proSkinMilestoneCatalog_1.proSkinPeriodWinCounterKey)({
            period: rule.period,
            metric: rule.metric,
            maxRank: rule.maxRank,
        });
        if (seenWinKeys.has(key))
            continue;
        seenWinKeys.add(key);
        const candidates = await loadRankCandidates(rule.metric, rule.maxRank);
        for (const uid of candidates) {
            const set = (_c = periodWinIncrementsByUid.get(uid)) !== null && _c !== void 0 ? _c : new Set();
            set.add(key);
            periodWinIncrementsByUid.set(uid, set);
        }
    }
    const allUids = new Set([
        ...grantsByUid.keys(),
        ...periodWinIncrementsByUid.keys(),
    ]);
    const holderIncrements = new Map();
    let unlockedUsers = 0;
    let earnedUsers = 0;
    for (const uid of allUids) {
        const skinIds = (_d = grantsByUid.get(uid)) !== null && _d !== void 0 ? _d : [];
        const winKeys = periodWinIncrementsByUid.get(uid);
        const userRef = db.doc(`users/${uid}`);
        let newlyUnlocked = [];
        let wroteEarn = false;
        let careerCount = 0;
        await db.runTransaction(async (tx) => {
            var _a, _b;
            newlyUnlocked = [];
            wroteEarn = false;
            careerCount = 0;
            const userSnap = await tx.get(userRef);
            const user = (userSnap.exists ? userSnap.data() : {});
            const patch = {
                proSkinUnlockSeason: proSkinMilestoneCatalog_1.PRO_SKIN_UNLOCK_FROM_SEASON_KEY,
                updatedAt: firestore_1.FieldValue.serverTimestamp(),
            };
            if (skinIds.length > 0) {
                patch.proSkinRankEarnedIds = firestore_1.FieldValue.arrayUnion(...skinIds);
                wroteEarn = true;
            }
            const progressRaw = user.proSkinProgress && typeof user.proSkinProgress === "object"
                ? Object.assign({}, user.proSkinProgress)
                : {
                    seasonKey: proSkinMilestoneCatalog_1.PRO_SKIN_UNLOCK_FROM_SEASON_KEY,
                    posts: 0,
                    exactHits: 0,
                    maxWinStreak: 0,
                };
            const periodWinsRaw = progressRaw.periodWins && typeof progressRaw.periodWins === "object"
                ? Object.assign({}, progressRaw.periodWins)
                : {};
            const unlocked = new Set(Array.isArray(user.proSkinUnlockedIds)
                ? user.proSkinUnlockedIds.filter((x) => typeof x === "string")
                : []);
            const origUnlockedSize = unlocked.size;
            const prevHeld = new Set([
                ...unlocked,
                ...(Array.isArray(user.proSkinHeldIds)
                    ? user.proSkinHeldIds.filter((x) => typeof x === "string")
                    : []),
            ]);
            if (winKeys && winKeys.size > 0) {
                for (const key of winKeys) {
                    const prev = Number((_a = periodWinsRaw[key]) !== null && _a !== void 0 ? _a : 0);
                    const next = (Number.isFinite(prev) ? Math.max(0, Math.floor(prev)) : 0) + 1;
                    periodWinsRaw[key] = next;
                }
                progressRaw.periodWins = periodWinsRaw;
                progressRaw.seasonKey =
                    typeof progressRaw.seasonKey === "string" &&
                        progressRaw.seasonKey.length > 0
                        ? progressRaw.seasonKey
                        : proSkinMilestoneCatalog_1.PRO_SKIN_UNLOCK_FROM_SEASON_KEY;
                progressRaw.updatedAtMs = Date.now();
                patch.proSkinProgress = progressRaw;
                wroteEarn = true;
                if (isProUser(user)) {
                    for (const rule of periodWinRules) {
                        const key = (0, proSkinMilestoneCatalog_1.proSkinPeriodWinCounterKey)({
                            period: rule.period,
                            metric: rule.metric,
                            maxRank: rule.maxRank,
                        });
                        if (!winKeys.has(key))
                            continue;
                        const wins = Number((_b = periodWinsRaw[key]) !== null && _b !== void 0 ? _b : 0);
                        if (wins >= rule.wins && !unlocked.has(rule.id)) {
                            unlocked.add(rule.id);
                            if (!prevHeld.has(rule.id))
                                newlyUnlocked.push(rule.id);
                        }
                    }
                }
            }
            if (isProUser(user) && skinIds.length > 0) {
                for (const id of skinIds) {
                    if (!unlocked.has(id)) {
                        unlocked.add(id);
                        if (!prevHeld.has(id))
                            newlyUnlocked.push(id);
                    }
                }
            }
            if (newlyUnlocked.length > 0 ||
                unlocked.size !== origUnlockedSize ||
                (isProUser(user) && skinIds.length > 0)) {
                patch.proSkinUnlockedIds = [...unlocked];
                patch.proSkinHeldIds = [...new Set([...prevHeld, ...unlocked])];
            }
            if (newlyUnlocked.length > 0) {
                patch.proSkinUnlockNoticeIds = firestore_1.FieldValue.arrayUnion(...newlyUnlocked);
            }
            tx.set(userRef, patch, { merge: true });
            careerCount = (0, countMilestoneUnlockedProSkins_1.countMilestoneUnlockedProSkins)([...unlocked]);
        });
        if (wroteEarn)
            earnedUsers += 1;
        if (newlyUnlocked.length === 0)
            continue;
        unlockedUsers += 1;
        for (const id of newlyUnlocked) {
            holderIncrements.set(id, ((_e = holderIncrements.get(id)) !== null && _e !== void 0 ? _e : 0) + 1);
        }
        if (careerCount > 0) {
            try {
                const { syncUserCareerUnlockedSkinCount } = await Promise.resolve().then(() => __importStar(require("./syncUserCareer")));
                await syncUserCareerUnlockedSkinCount(uid, careerCount);
            }
            catch (err) {
                console.warn("[grantProSkinRankUnlocks] career skin sync failed", err);
            }
        }
    }
    await incrementHolderCounts(holderIncrements);
    await grantRef.set({
        status: "done",
        period: opts.period,
        labelKey: opts.labelKey,
        startKey: opts.startKey,
        seasonKey,
        division: "standard",
        unlockedUsers,
        earnedUsers,
        skinIds: [
            ...new Set([
                ...[...grantsByUid.values()].flat(),
                ...periodWinRules.map((r) => r.id),
            ]),
        ],
        grantedAt: firestore_1.FieldValue.serverTimestamp(),
    }, { merge: true });
    console.log(`[grantProSkinRankUnlocks] ${opts.period} ${opts.labelKey} earned=${earnedUsers} unlocked=${unlockedUsers} candidates=${allUids.size}`);
    return { granted: true, unlockedUsers };
}
async function grantProSkinRankUnlocksAfterPeriodSnapshots(now = new Date()) {
    const weekCurrent = (0, nbaPeriod_1.weekStartDateKeyJST)(now);
    const weekPrev = (0, nbaPeriod_1.previousLabel)("weekly", weekCurrent);
    const monthCurrent = (0, nbaPeriod_1.monthLabelJST)(now);
    const monthPrev = (0, nbaPeriod_1.previousLabel)("monthly", monthCurrent);
    await grantProSkinRankUnlocksForPeriod({
        period: "weekly",
        labelKey: weekPrev,
        startKey: weekPrev,
        now,
    });
    await grantProSkinRankUnlocksForPeriod({
        period: "monthly",
        labelKey: monthPrev,
        startKey: `${monthPrev}-01`,
        now,
    });
}
//# sourceMappingURL=grantProSkinRankUnlocksOnPeriodFinal.js.map