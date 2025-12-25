"use strict";
// functions/src/trend/games.aggregate.ts
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
exports.aggregateGamesTrend = aggregateGamesTrend;
const firestore_1 = require("firebase-admin/firestore");
// ❗ shared.ts の export が不完全でも動作するように * で吸収
const Shared = __importStar(require("./shared"));
const decayFactor = Shared.decayFactor;
const hoursSince = Shared.hoursSince;
const tsHoursAgo = Shared.tsHoursAgo;
const NORMALIZE_TYPE = (t) => {
    const s = (t || "").trim();
    if (s === "predict")
        return "create_prediction"; // 互換
    return s;
};
const BASE_WEIGHT = {
    click_card: 1,
    open_predictions: 1,
    create_prediction: 3,
};
/* -----------------------------------------------------
 * games/{id} の status をまとめて取得
 * ---------------------------------------------------*/
async function fetchGameStatusMap(gameIds) {
    var _a, _b, _c;
    const db = (0, firestore_1.getFirestore)();
    const uniqIds = Array.from(new Set(gameIds)).filter(Boolean);
    const statusMap = new Map();
    if (uniqIds.length === 0)
        return statusMap;
    const snaps = await Promise.all(uniqIds.map((id) => db.doc(`games/${id}`).get()));
    for (const snap of snaps) {
        if (!snap.exists)
            continue;
        const data = snap.data();
        const status = (_c = (_a = data.status) !== null && _a !== void 0 ? _a : (_b = data.game) === null || _b === void 0 ? void 0 : _b.status) !== null && _c !== void 0 ? _c : null;
        statusMap.set(snap.id, status);
    }
    return statusMap;
}
/* -----------------------------------------------------
 * main function
 * ---------------------------------------------------*/
async function aggregateGamesTrend() {
    var _a, _b;
    const db = (0, firestore_1.getFirestore)();
    const WINDOW_HOURS = 24;
    const sinceMs = Date.now() - WINDOW_HOURS * 60 * 60 * 1000;
    const sinceTimestamp = tsHoursAgo(WINDOW_HOURS);
    // ts (number) 版
    const qTs = db
        .collection("events_game")
        .where("ts", ">=", sinceMs)
        .orderBy("ts", "desc");
    // at (Timestamp) 版
    const qAt = db
        .collection("events_game")
        .where("at", ">=", sinceTimestamp)
        .orderBy("at", "desc");
    const [snapTs, snapAt] = await Promise.all([qTs.get(), qAt.get()]);
    // 重複排除
    const seen = new Set();
    const docs = [...snapTs.docs, ...snapAt.docs].filter((d) => {
        if (seen.has(d.id))
            return false;
        seen.add(d.id);
        return true;
    });
    const buckets = new Map();
    for (const doc of docs) {
        const e = doc.data();
        const typeNorm = NORMALIZE_TYPE(e.type);
        if (!(typeNorm in BASE_WEIGHT))
            continue;
        const gameId = String(e.gameId || "").trim();
        const league = (e.league || "").toUpperCase();
        if (!gameId || !league)
            continue;
        if (league !== "B1" &&
            league !== "J1" &&
            league !== "NBA" &&
            league !== "PL") {
            continue;
        }
        // イベント時刻
        let at;
        if (typeof e.ts === "number" && Number.isFinite(e.ts)) {
            at = firestore_1.Timestamp.fromMillis(e.ts);
        }
        else if (e.at instanceof firestore_1.Timestamp) {
            at = e.at;
        }
        else {
            at = doc.createTime;
        }
        const hrs = hoursSince(at);
        const weight = BASE_WEIGHT[typeNorm] * decayFactor(hrs);
        const key = `${league}:${gameId}`;
        const b = (_a = buckets.get(key)) !== null && _a !== void 0 ? _a : {
            league,
            gameId,
            raw: 0,
            score: 0,
            lastAt: at,
            clicks: 0,
            opens: 0,
            creates: 0,
        };
        b.raw += BASE_WEIGHT[typeNorm];
        b.score += weight;
        b.lastAt =
            !b.lastAt || at.toMillis() > b.lastAt.toMillis() ? at : b.lastAt;
        if (typeNorm === "click_card")
            b.clicks++;
        if (typeNorm === "open_predictions")
            b.opens++;
        if (typeNorm === "create_prediction")
            b.creates++;
        buckets.set(key, b);
    }
    /* -----------------------------------------------------
     * ★ status === "final" の試合は除外
     * ---------------------------------------------------*/
    const gameIds = Array.from(buckets.values()).map((b) => b.gameId);
    const statusMap = await fetchGameStatusMap(gameIds);
    const filtered = new Map();
    for (const [key, b] of buckets) {
        const st = statusMap.get(b.gameId);
        if (st && st.toLowerCase() === "final")
            continue; // 除外
        filtered.set(key, b);
    }
    /* -----------------------------------------------------
     * リーグ別にまとめる
     * ---------------------------------------------------*/
    const byLeague = new Map();
    for (const b of filtered.values()) {
        const arr = (_b = byLeague.get(b.league)) !== null && _b !== void 0 ? _b : [];
        arr.push(b);
        byLeague.set(b.league, arr);
    }
    /* -----------------------------------------------------
     * TOP 8 に絞る
     * ---------------------------------------------------*/
    const TOP_N = 8;
    const result = {};
    for (const [league, arr] of byLeague.entries()) {
        arr.sort((a, z) => z.score - a.score);
        result[league] = arr.slice(0, TOP_N).map((b) => ({
            gameId: b.gameId,
            league: b.league,
            score: Number(b.score.toFixed(4)),
            raw: b.raw,
            lastAt: b.lastAt,
            clicks: b.clicks,
            opens: b.opens,
            creates: b.creates,
        }));
    }
    /* -----------------------------------------------------
     * Firestore 保存
     * ---------------------------------------------------*/
    const payload = Object.assign({ updatedAt: firestore_1.FieldValue.serverTimestamp(), windowHours: WINDOW_HOURS }, result);
    await db.collection("trend_cache").doc("games").set(payload);
    return {
        ok: true,
        counts: Object.fromEntries([...byLeague.entries()].map(([k, v]) => [k, v.length])),
    };
}
//# sourceMappingURL=games.aggregate.js.map