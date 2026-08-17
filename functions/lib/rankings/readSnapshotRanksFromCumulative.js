"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.readSnapshotRanksRoot = readSnapshotRanksRoot;
exports.coerceRankInt = coerceRankInt;
exports.readStoredRankFromUser = readStoredRankFromUser;
const nbaSeason_1 = require("./nbaSeason");
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
        seasons: pickBlock(nested === null || nested === void 0 ? void 0 : nested.seasons, data["snapshotRanks.seasons"]),
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
function readStoredRankFromUser(me, metric) {
    var _a, _b;
    const snapshotRanks = readSnapshotRanksRoot(me);
    const raw = (_b = (_a = snapshotRanks.seasons) === null || _a === void 0 ? void 0 : _a[nbaSeason_1.CURRENT_NBA_SEASON_KEY]) === null || _b === void 0 ? void 0 : _b[metric];
    return typeof raw === "number" && Number.isFinite(raw) && raw >= 1
        ? Math.floor(raw)
        : coerceRankInt(raw);
}
//# sourceMappingURL=readSnapshotRanksFromCumulative.js.map