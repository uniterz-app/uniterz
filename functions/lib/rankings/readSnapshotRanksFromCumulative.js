"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.readSnapshotRanksRoot = readSnapshotRanksRoot;
exports.coerceRankInt = coerceRankInt;
exports.readStoredRankFromUser = readStoredRankFromUser;
function isNonEmptyObject(v) {
    return !!v && typeof v === "object" && Object.keys(v).length > 0;
}
function pickBlock(nested, dot) {
    if (isNonEmptyObject(dot))
        return dot;
    if (isNonEmptyObject(nested))
        return nested;
    return undefined;
}
function readSnapshotRanksRoot(data) {
    if (!data)
        return {};
    const nested = data.snapshotRanks;
    return {
        play_in: pickBlock(nested === null || nested === void 0 ? void 0 : nested.play_in, data["snapshotRanks.play_in"]),
        playoffs: pickBlock(nested === null || nested === void 0 ? void 0 : nested.playoffs, data["snapshotRanks.playoffs"]),
        playoffRounds: pickBlock(nested === null || nested === void 0 ? void 0 : nested.playoffRounds, data["snapshotRanks.playoffRounds"]),
        wc: pickBlock(nested === null || nested === void 0 ? void 0 : nested.wc, data["snapshotRanks.wc"]),
    };
}
function coerceRankInt(v) {
    var _a;
    if (v == null)
        return null;
    if (typeof v === "number" && Number.isFinite(v)) {
        const r = Math.floor(v);
        return r >= 1 ? r : null;
    }
    if (typeof v === "object" && v !== null) {
        const o = v;
        if (typeof o.toNumber === "function") {
            const n = o.toNumber();
            if (Number.isFinite(n)) {
                const r = Math.floor(n);
                return r >= 1 ? r : null;
            }
        }
        const iv = (_a = o.integerValue) !== null && _a !== void 0 ? _a : o._integerValue;
        if (typeof iv === "string" && /^\d+$/.test(iv.trim())) {
            const r = parseInt(iv.trim(), 10);
            return r >= 1 ? r : null;
        }
    }
    return null;
}
function readStoredRankFromUser(me, metric, phase, round, wcStage) {
    var _a, _b, _c, _d, _e, _f, _g;
    const snapshotRanks = readSnapshotRanksRoot(me);
    let raw;
    if (wcStage) {
        raw = (_b = (_a = snapshotRanks.wc) === null || _a === void 0 ? void 0 : _a[wcStage]) === null || _b === void 0 ? void 0 : _b[metric];
        if (metric === "totalExactHits" && raw == null) {
            raw = (_d = (_c = snapshotRanks.wc) === null || _c === void 0 ? void 0 : _c[wcStage]) === null || _d === void 0 ? void 0 : _d.totalPrecision;
        }
    }
    else if (phase === "playoffs" && round !== "overall") {
        raw = (_f = (_e = snapshotRanks.playoffRounds) === null || _e === void 0 ? void 0 : _e[round]) === null || _f === void 0 ? void 0 : _f[metric];
    }
    else {
        raw = (_g = snapshotRanks[phase]) === null || _g === void 0 ? void 0 : _g[metric];
    }
    return typeof raw === "number" && Number.isFinite(raw) && raw >= 1
        ? Math.floor(raw)
        : coerceRankInt(raw);
}
//# sourceMappingURL=readSnapshotRanksFromCumulative.js.map