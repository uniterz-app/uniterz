"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.backfillStreakApplyMarkersHttp = void 0;
// functions/src/backfillStreakApplyMarkers.ts
/**
 * Pre-marker-era finalized games: create games/{gameId}/streak_apply_v2/{uid} only.
 * Does not change streak counters (prevents double increment on re-finalize).
 */
const https_1 = require("firebase-functions/v2/https");
const firestore_1 = require("firebase-admin/firestore");
const BATCH_MAX = 500;
function parseGameIds(req) {
    const single = req.query.gameId;
    const multi = req.query.gameIds;
    const out = [];
    if (typeof single === "string" && single.trim()) {
        out.push(single.trim());
    }
    if (typeof multi === "string") {
        out.push(...multi
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean));
    }
    return [...new Set(out)];
}
exports.backfillStreakApplyMarkersHttp = (0, https_1.onRequest)(async (req, res) => {
    if (req.method !== "GET" && req.method !== "POST") {
        res.status(405).json({ ok: false, error: "method not allowed" });
        return;
    }
    const gameIds = parseGameIds(req);
    if (gameIds.length === 0) {
        res
            .status(400)
            .json({ ok: false, error: "gameId or gameIds (comma-separated) required" });
        return;
    }
    const db = (0, firestore_1.getFirestore)();
    const dryRun = req.query.dryRun === "1" || req.query.dryRun === "true";
    const results = [];
    for (const gameId of gameIds) {
        try {
            const gameSnap = await db.doc(`games/${gameId}`).get();
            const g = gameSnap.data();
            if (!(g === null || g === void 0 ? void 0 : g.final)) {
                results.push({
                    gameId,
                    ok: false,
                    skipped: "game not final — streak was never applied by onGameFinalV2",
                });
                continue;
            }
            const postsSnap = await db
                .collection("posts")
                .where("gameId", "==", gameId)
                .where("schemaVersion", "==", 2)
                .get();
            const uids = new Set();
            for (const d of postsSnap.docs) {
                const uid = d.data().authorUid;
                if (uid)
                    uids.add(uid);
            }
            if (dryRun) {
                results.push({
                    gameId,
                    ok: true,
                    authorCount: uids.size,
                    skipped: "dryRun",
                });
                continue;
            }
            const uidList = [...uids];
            let batch = db.batch();
            let ops = 0;
            let batches = 0;
            for (const uid of uidList) {
                const ref = db.doc(`games/${gameId}/streak_apply_v2/${uid}`);
                batch.set(ref, {
                    appliedAt: firestore_1.FieldValue.serverTimestamp(),
                    source: "backfill_pre_marker_era",
                }, { merge: true });
                ops += 1;
                if (ops >= BATCH_MAX) {
                    await batch.commit();
                    batches += 1;
                    batch = db.batch();
                    ops = 0;
                }
            }
            if (ops > 0) {
                await batch.commit();
                batches += 1;
            }
            results.push({
                gameId,
                ok: true,
                authorCount: uidList.length,
                batches,
            });
        }
        catch (e) {
            results.push({
                gameId,
                ok: false,
                error: e instanceof Error ? e.message : String(e),
            });
        }
    }
    res.status(200).json({ ok: true, dryRun, results });
});
//# sourceMappingURL=backfillStreakApplyMarkers.js.map