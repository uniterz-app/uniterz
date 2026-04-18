"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.backfillCumulativeStatsFromDailyHttp = void 0;
const https_1 = require("firebase-functions/v2/https");
const firestore_1 = require("firebase-admin/firestore");
function safeNum(v) {
    const n = typeof v === "number" ? v : Number(v);
    return Number.isFinite(n) ? n : 0;
}
function mergeAll(base, all) {
    return {
        posts: base.posts + safeNum(all === null || all === void 0 ? void 0 : all.posts),
        wins: base.wins + safeNum(all === null || all === void 0 ? void 0 : all.wins),
        points: base.points + safeNum(all === null || all === void 0 ? void 0 : all.pointsSumV3),
        upset: base.upset + safeNum(all === null || all === void 0 ? void 0 : all.upsetPointsSum),
        precision: base.precision + safeNum(all === null || all === void 0 ? void 0 : all.scorePrecisionSum),
    };
}
async function recomputeTotalsFromDaily(uid) {
    const db = (0, firestore_1.getFirestore)();
    const snap = await db
        .collection("user_stats_v2_daily")
        .where(firestore_1.FieldPath.documentId(), ">=", `${uid}_`)
        .where(firestore_1.FieldPath.documentId(), "<", `${uid}_\uf8ff`)
        .get();
    let totals = {
        posts: 0,
        wins: 0,
        points: 0,
        upset: 0,
        precision: 0,
    };
    snap.docs.forEach((d) => {
        var _a;
        totals = mergeAll(totals, (_a = d.data()) === null || _a === void 0 ? void 0 : _a.all);
    });
    return totals;
}
exports.backfillCumulativeStatsFromDailyHttp = (0, https_1.onRequest)(async (req, res) => {
    var _a;
    try {
        const db = (0, firestore_1.getFirestore)();
        const uid = typeof req.query.uid === "string" ? req.query.uid.trim() : "";
        const cursor = typeof req.query.cursor === "string" ? req.query.cursor.trim() : "";
        const dryRun = !(req.query.apply === "1" || req.query.apply === "true");
        const limitRaw = typeof req.query.limit === "string" ? Number(req.query.limit) : 0;
        const limit = Number.isFinite(limitRaw) && limitRaw > 0
            ? Math.min(Math.floor(limitRaw), 2000)
            : 500;
        const targets = [];
        if (uid) {
            targets.push(uid);
        }
        else {
            let q = db
                .collection("user_stats_v2")
                .select()
                .orderBy(firestore_1.FieldPath.documentId())
                .limit(limit);
            if (cursor) {
                q = q.startAfter(cursor);
            }
            const userSnap = await q.get();
            userSnap.docs.forEach((d) => targets.push(d.id));
        }
        const results = [];
        for (const targetUid of targets) {
            const totals = await recomputeTotalsFromDaily(targetUid);
            const winRate = totals.posts > 0 ? totals.wins / totals.posts : 0;
            if (!dryRun) {
                await db.doc(`cumulative_stats/${targetUid}`).set({
                    uid: targetUid,
                    totalPosts: totals.posts,
                    totalWins: totals.wins,
                    totalPoints: totals.points,
                    totalUpset: totals.upset,
                    totalPrecision: totals.precision,
                    winRate,
                    updatedAt: firestore_1.FieldValue.serverTimestamp(),
                    backfilledFromDailyAt: firestore_1.FieldValue.serverTimestamp(),
                }, { merge: true });
            }
            results.push(Object.assign(Object.assign({}, totals), { uid: targetUid, wrote: !dryRun }));
        }
        const nextCursor = !uid && targets.length === limit ? targets[targets.length - 1] : null;
        res.status(200).json({
            ok: true,
            dryRun,
            count: results.length,
            limit,
            cursor: cursor || null,
            nextCursor,
            allUsersDone: !uid && nextCursor == null,
            results,
            usage: {
                allUsersPreview: `${req.path}?limit=500`,
                allUsersPreviewNextPage: `${req.path}?limit=500&cursor=<NEXT_CURSOR_FROM_RESPONSE>`,
                applySingleUid: `${req.path}?uid=<UID>&apply=1`,
                applyFirstNUsers: `${req.path}?limit=500&apply=1`,
                applyNextPage: `${req.path}?limit=500&cursor=<NEXT_CURSOR_FROM_RESPONSE>&apply=1`,
            },
        });
    }
    catch (e) {
        res.status(500).json({ ok: false, error: (_a = e === null || e === void 0 ? void 0 : e.message) !== null && _a !== void 0 ? _a : String(e) });
    }
});
//# sourceMappingURL=backfillCumulativeStatsFromDaily.js.map