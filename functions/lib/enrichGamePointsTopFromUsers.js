"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.enrichGamePointsTopFromUsers = enrichGamePointsTopFromUsers;
function pickNonEmpty(v) {
    if (typeof v !== "string")
        return null;
    const s = v.trim();
    return s ? s : null;
}
async function enrichGamePointsTopFromUsers(db, top) {
    var _a, _b, _c, _d, _e;
    const uids = [
        ...new Set(top
            .map((r) => (typeof r.uid === "string" ? r.uid.trim() : ""))
            .filter(Boolean)),
    ];
    if (uids.length === 0)
        return top;
    const refs = uids.map((uid) => db.collection("users").doc(uid));
    const snaps = await db.getAll(...refs);
    const byUid = new Map();
    for (const snap of snaps) {
        if (!snap.exists)
            continue;
        const d = (_a = snap.data()) !== null && _a !== void 0 ? _a : {};
        const handle = pickNonEmpty(d.handle);
        const displayName = (_c = (_b = pickNonEmpty(d.displayName)) !== null && _b !== void 0 ? _b : pickNonEmpty(d.name)) !== null && _c !== void 0 ? _c : handle;
        const photoURL = (_e = (_d = pickNonEmpty(d.photoURL)) !== null && _d !== void 0 ? _d : pickNonEmpty(d.avatarUrl)) !== null && _e !== void 0 ? _e : pickNonEmpty(d.profileImageUrl);
        byUid.set(snap.id, {
            handle,
            displayName,
            photoURL,
            isPro: d.isPro === true || d.plan === "pro",
        });
    }
    return top.map((row) => {
        var _a, _b, _c, _d, _e;
        const uid = typeof row.uid === "string" ? row.uid.trim() : "";
        if (!uid)
            return row;
        const p = byUid.get(uid);
        if (!p)
            return row;
        const handle = (_a = p.handle) !== null && _a !== void 0 ? _a : row.handle;
        const displayName = (_c = (_b = p.displayName) !== null && _b !== void 0 ? _b : handle) !== null && _c !== void 0 ? _c : row.displayName;
        return Object.assign(Object.assign({}, row), { handle,
            displayName, photoURL: (_e = (_d = p.photoURL) !== null && _d !== void 0 ? _d : row.photoURL) !== null && _e !== void 0 ? _e : null, isPro: p.isPro || row.isPro });
    });
}
//# sourceMappingURL=enrichGamePointsTopFromUsers.js.map