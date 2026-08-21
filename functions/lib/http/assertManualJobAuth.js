"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertManualJobAuth = assertManualJobAuth;
exports.rankingComputeAllowed = rankingComputeAllowed;
/**
 * 手動 HTTP ジョブの認証（共有シークレット）
 * ヘッダ: x-internal-job-secret または x-group-battle-admin-secret
 * env: INTERNAL_JOB_SECRET（推奨）または GROUP_BATTLE_ADMIN_SECRET
 */
const crypto_1 = require("crypto");
function timingSafeEqualString(provided, expected) {
    if (typeof provided !== "string" || typeof expected !== "string") {
        return false;
    }
    const a = Buffer.from(provided, "utf8");
    const b = Buffer.from(expected, "utf8");
    if (a.length !== b.length) {
        const len = Math.max(a.length, b.length, 1);
        const padA = Buffer.alloc(len);
        const padB = Buffer.alloc(len);
        a.copy(padA);
        b.copy(padB);
        (0, crypto_1.timingSafeEqual)(padA, padB);
        return false;
    }
    return (0, crypto_1.timingSafeEqual)(a, b);
}
function expectedSecrets() {
    var _a;
    const out = [];
    for (const key of ["INTERNAL_JOB_SECRET", "GROUP_BATTLE_ADMIN_SECRET"]) {
        const v = (_a = process.env[key]) === null || _a === void 0 ? void 0 : _a.trim();
        if (v)
            out.push(v);
    }
    return out;
}
function providedSecret(req) {
    var _a, _b, _c;
    const h1 = String((_a = req.get("x-internal-job-secret")) !== null && _a !== void 0 ? _a : "").trim();
    if (h1)
        return h1;
    const h2 = String((_b = req.get("x-group-battle-admin-secret")) !== null && _b !== void 0 ? _b : "").trim();
    if (h2)
        return h2;
    const authz = String((_c = req.get("authorization")) !== null && _c !== void 0 ? _c : "").trim();
    if (authz.toLowerCase().startsWith("bearer ")) {
        const t = authz.slice(7).trim();
        if (t)
            return t;
    }
    return null;
}
function assertManualJobAuth(req) {
    const expected = expectedSecrets();
    if (expected.length === 0) {
        const err = new Error("job_secret_not_configured");
        err.status = 503;
        throw err;
    }
    const provided = providedSecret(req);
    if (!provided || !expected.some((s) => timingSafeEqualString(provided, s))) {
        const err = new Error("forbidden");
        err.status = 403;
        throw err;
    }
}
/**
 * 累積ランキング計算口。シークレットが Functions に載っているときは必須。
 * 未設定の間は既存の公開 GET を維持（Next 側は URL を NEXT_PUBLIC にしない）。
 */
function rankingComputeAllowed(req) {
    var _a;
    const extra = (_a = process.env.CUMULATIVE_RANKING_INTERNAL_SECRET) === null || _a === void 0 ? void 0 : _a.trim();
    const expected = expectedSecrets();
    if (extra)
        expected.push(extra);
    if (expected.length === 0)
        return true;
    const provided = providedSecret(req);
    if (!provided)
        return false;
    return expected.some((s) => timingSafeEqualString(provided, s));
}
//# sourceMappingURL=assertManualJobAuth.js.map