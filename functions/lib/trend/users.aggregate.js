"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aggregateUsersTrend = aggregateUsersTrend;
// functions/src/trend/users.aggregate.ts
const firestore_1 = require("firebase-admin/firestore");
const app_1 = require("firebase-admin/app");
/** Admin が未初期化なら初期化してから Firestore を返す */
function getDb() {
    if (!(0, app_1.getApps)().length)
        (0, app_1.initializeApp)();
    return (0, firestore_1.getFirestore)();
}
const NOW = () => firestore_1.Timestamp.now();
const WINDOW_HOURS_DEFAULT = 72;
function windowRange(hours) {
    const end = NOW();
    const start = firestore_1.Timestamp.fromMillis(end.toMillis() - hours * 60 * 60 * 1000);
    return { start, end };
}
async function getUserProfile(uid) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    const db = getDb();
    const snap = await db.doc(`users/${uid}`).get();
    if (!snap.exists)
        return null;
    const d = snap.data() || {};
    return {
        uid,
        displayName: String((_b = (_a = d.displayName) !== null && _a !== void 0 ? _a : d.username) !== null && _b !== void 0 ? _b : "No Name"),
        handle: String((_d = (_c = d.handle) !== null && _c !== void 0 ? _c : d.username) !== null && _d !== void 0 ? _d : ""),
        photoURL: String((_f = (_e = d.photoURL) !== null && _e !== void 0 ? _e : d.avatarURL) !== null && _f !== void 0 ? _f : ""),
        followers: Number((_h = (_g = d.counts) === null || _g === void 0 ? void 0 : _g.followers) !== null && _h !== void 0 ? _h : 0),
    };
}
/** プロフィール閲覧カウント */
async function countProfileViews(start, end) {
    const db = getDb();
    const map = new Map();
    const q1 = db
        .collection("events_profile")
        .where("createdAt", ">=", start)
        .where("createdAt", "<=", end);
    const s1 = await q1.get().catch(() => null);
    s1 === null || s1 === void 0 ? void 0 : s1.forEach((doc) => {
        var _a, _b, _c, _d;
        const d = doc.data();
        if (d.type && d.type !== "view")
            return;
        const uid = String((_c = (_b = (_a = d.targetUid) !== null && _a !== void 0 ? _a : d.uid) !== null && _b !== void 0 ? _b : d.visitedUid) !== null && _c !== void 0 ? _c : "");
        if (!uid)
            return;
        map.set(uid, ((_d = map.get(uid)) !== null && _d !== void 0 ? _d : 0) + 1);
    });
    const q2 = db
        .collection("events_profile")
        .where("at", ">=", start)
        .where("at", "<=", end);
    const s2 = await q2.get().catch(() => null);
    s2 === null || s2 === void 0 ? void 0 : s2.forEach((doc) => {
        var _a, _b, _c, _d;
        const d = doc.data();
        const uid = String((_c = (_b = (_a = d.targetUid) !== null && _a !== void 0 ? _a : d.uid) !== null && _b !== void 0 ? _b : d.visitedUid) !== null && _c !== void 0 ? _c : "");
        if (!uid)
            return;
        map.set(uid, ((_d = map.get(uid)) !== null && _d !== void 0 ? _d : 0) + 1);
    });
    return map;
}
/** フォロー獲得 */
async function countFollowGains(start, end) {
    const db = getDb();
    const map = new Map();
    const q = db
        .collection("events_follow")
        .where("createdAt", ">=", start)
        .where("createdAt", "<=", end)
        .where("op", "==", "follow");
    const snap = await q.get().catch(() => null);
    snap === null || snap === void 0 ? void 0 : snap.forEach((doc) => {
        var _a, _b, _c;
        const t = String((_b = (_a = doc.data()) === null || _a === void 0 ? void 0 : _a.targetUid) !== null && _b !== void 0 ? _b : "");
        if (!t)
            return;
        map.set(t, ((_c = map.get(t)) !== null && _c !== void 0 ? _c : 0) + 1);
    });
    return map;
}
/** いいね獲得 */
async function countLikes(start, end) {
    const db = getDb();
    const map = new Map();
    const q = db
        .collection("events_like")
        .where("createdAt", ">=", start)
        .where("createdAt", "<=", end);
    const snap = await q.get().catch(() => null);
    snap === null || snap === void 0 ? void 0 : snap.forEach((doc) => {
        var _a, _b, _c;
        const d = doc.data();
        const uid = String((_b = (_a = d.targetUid) !== null && _a !== void 0 ? _a : d.authorUid) !== null && _b !== void 0 ? _b : "");
        if (!uid)
            return;
        map.set(uid, ((_c = map.get(uid)) !== null && _c !== void 0 ? _c : 0) + 1);
    });
    return map;
}
/** 主戦リーグ判定 */
async function decidePrimaryLeague(start, end) {
    const db = getDb();
    const perUser = new Map();
    const bump = (uid, league) => {
        var _a;
        if (league !== "B1" && league !== "J1")
            return;
        const key = league;
        const cur = (_a = perUser.get(uid)) !== null && _a !== void 0 ? _a : { B1: 0, J1: 0 };
        cur[key] += 1;
        perUser.set(uid, cur);
    };
    const posts = await db
        .collection("posts")
        .where("createdAt", ">=", start)
        .where("createdAt", "<=", end)
        .get()
        .catch(() => null);
    posts === null || posts === void 0 ? void 0 : posts.forEach((doc) => {
        var _a, _b;
        const d = doc.data();
        bump(String((_b = (_a = d.authorUid) !== null && _a !== void 0 ? _a : d.uid) !== null && _b !== void 0 ? _b : ""), d.league);
    });
    const preds = await db
        .collection("predictions")
        .where("createdAt", ">=", start)
        .where("createdAt", "<=", end)
        .get()
        .catch(() => null);
    preds === null || preds === void 0 ? void 0 : preds.forEach((doc) => {
        var _a, _b;
        const d = doc.data();
        bump(String((_b = (_a = d.authorUid) !== null && _a !== void 0 ? _a : d.uid) !== null && _b !== void 0 ? _b : ""), d.league);
    });
    const result = new Map();
    perUser.forEach((cts, uid) => {
        if (cts.B1 === 0 && cts.J1 === 0) {
            result.set(uid, null);
            return;
        }
        if (cts.B1 > cts.J1)
            result.set(uid, "B1");
        else if (cts.J1 > cts.B1)
            result.set(uid, "J1");
        else
            result.set(uid, "B1/J1");
    });
    return result;
}
/** メイン集計（HTTP/Cron から呼ばれる） */
async function aggregateUsersTrend(windowHours = WINDOW_HOURS_DEFAULT) {
    var _a, _b, _c, _d;
    const { start, end } = windowRange(windowHours);
    const [viewMap, followMap, likeMap, leagueMap] = await Promise.all([
        countProfileViews(start, end),
        countFollowGains(start, end),
        countLikes(start, end),
        decidePrimaryLeague(start, end),
    ]);
    const uids = new Set([
        ...viewMap.keys(),
        ...followMap.keys(),
        ...likeMap.keys(),
        ...leagueMap.keys(),
    ]);
    const rows = [];
    for (const uid of uids) {
        const views = (_a = viewMap.get(uid)) !== null && _a !== void 0 ? _a : 0;
        const follows = (_b = followMap.get(uid)) !== null && _b !== void 0 ? _b : 0;
        const likes = (_c = likeMap.get(uid)) !== null && _c !== void 0 ? _c : 0;
        const score = views * 1 + follows * 3 + likes * 2;
        const prof = await getUserProfile(uid);
        if (!prof)
            continue;
        rows.push({
            uid,
            displayName: prof.displayName,
            handle: prof.handle,
            photoURL: prof.photoURL,
            score,
            counts: { followers: prof.followers },
            primaryLeague: (_d = leagueMap.get(uid)) !== null && _d !== void 0 ? _d : null,
        });
    }
    rows.sort((a, b) => {
        var _a, _b, _c, _d;
        return b.score - a.score ||
            ((_b = (_a = b.counts) === null || _a === void 0 ? void 0 : _a.followers) !== null && _b !== void 0 ? _b : 0) - ((_d = (_c = a.counts) === null || _c === void 0 ? void 0 : _c.followers) !== null && _d !== void 0 ? _d : 0);
    });
    const TOP_N = 10;
    const top = rows.slice(0, TOP_N);
    const db = getDb();
    const payload = {
        updatedAt: NOW(),
        windowHours,
        users: top,
    };
    await db.doc("trend_cache/users").set(payload);
    return { ok: true, counts: { users: top.length } };
}
//# sourceMappingURL=users.aggregate.js.map