"use strict";
// functions/src/onGameFinal.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.onGameFinal = void 0;
const firestore_1 = require("firebase-functions/v2/firestore");
const firestore_2 = require("firebase-admin/firestore");
const settle_1 = require("./utils/settle");
const updateUserStats_1 = require("./updateUserStats");
const db = () => (0, firestore_2.getFirestore)();
/** games/{gameId} 更新 → 紐づく posts を判定・反映 */
exports.onGameFinal = (0, firestore_1.onDocumentWritten)({
    document: "games/{gameId}",
    region: "asia-northeast1",
}, async (event) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    const before = (_b = (_a = event.data) === null || _a === void 0 ? void 0 : _a.before) === null || _b === void 0 ? void 0 : _b.data();
    const after = (_d = (_c = event.data) === null || _c === void 0 ? void 0 : _c.after) === null || _d === void 0 ? void 0 : _d.data();
    if (!after)
        return;
    const gameId = event.params.gameId;
    const becameFinal = !(before === null || before === void 0 ? void 0 : before.final) && !!after.final;
    const scoreChanged = (before === null || before === void 0 ? void 0 : before.homeScore) !== (after === null || after === void 0 ? void 0 : after.homeScore) ||
        (before === null || before === void 0 ? void 0 : before.awayScore) !== (after === null || after === void 0 ? void 0 : after.awayScore);
    if (!becameFinal && !scoreChanged)
        return;
    const toName = (v) => { var _a; return (typeof v === "string" ? v : ((_a = v === null || v === void 0 ? void 0 : v.name) !== null && _a !== void 0 ? _a : "")); };
    const game = {
        id: gameId,
        league: String((_e = after.league) !== null && _e !== void 0 ? _e : ""),
        home: toName(after.home),
        away: toName(after.away),
        final: !!after.final,
        homeScore: (_f = after.homeScore) !== null && _f !== void 0 ? _f : null,
        awayScore: (_g = after.awayScore) !== null && _g !== void 0 ? _g : null,
    };
    if (!game.final)
        return;
    const postsCol = db().collection("posts");
    const [snapNested, snapRoot] = await Promise.all([
        postsCol.where("game.gameId", "==", gameId).get(),
        postsCol.where("gameId", "==", gameId).get(),
    ]);
    const postDocs = new Map();
    for (const d of snapNested.docs)
        postDocs.set(d.id, d);
    for (const d of snapRoot.docs)
        postDocs.set(d.id, d);
    if (postDocs.size === 0) {
        await db().doc(`games/${gameId}`)
            .set({ resultComputedAt: firestore_2.FieldValue.serverTimestamp() }, { merge: true });
        return;
    }
    const now = firestore_2.Timestamp.now();
    const batch = db().batch();
    const tasks = [];
    for (const doc of postDocs.values()) {
        const p = doc.data();
        if (p.settledAt)
            continue;
        const legs = (p.legs || []).map((l) => {
            var _a, _b;
            return ({
                optionId: (_a = l.optionId) !== null && _a !== void 0 ? _a : undefined,
                kind: l.kind,
                label: String((_b = l.label) !== null && _b !== void 0 ? _b : ""),
                odds: Number(l.odds),
                pct: Number(l.pct),
            });
        });
        const pctSum = legs.reduce((a, b) => a + (isFinite(b.pct) ? b.pct : 0), 0);
        if (pctSum > 1.5) {
            for (const l of legs)
                l.pct = l.pct / pctSum;
        }
        const { settlement, resultUnits: ruRaw } = (0, settle_1.settleTicket)(game, legs);
        const outcomes = legs.map((leg) => (0, settle_1.judgeLeg)(game, leg));
        let usedOdds = 0;
        const hitLegs = legs
            .map((leg, idx) => ({ leg, outcome: outcomes[idx] }))
            .filter((x) => x.outcome === "hit");
        if (hitLegs.length === 1) {
            usedOdds = Number(hitLegs[0].leg.odds) || 0;
        }
        else if (hitLegs.length > 1) {
            let sumPct = 0;
            for (const h of hitLegs)
                if (isFinite(h.leg.pct))
                    sumPct += h.leg.pct;
            if (sumPct > 0) {
                usedOdds = hitLegs.reduce((acc, h) => acc +
                    ((isFinite(h.leg.pct) ? h.leg.pct : 0) / sumPct) *
                        h.leg.odds, 0);
            }
            else {
                usedOdds =
                    hitLegs.reduce((acc, h) => acc + h.leg.odds, 0) /
                        hitLegs.length;
            }
        }
        const legsWithOutcome = (p.legs || []).map((orig, i) => {
            var _a;
            const outcome = (_a = outcomes[i]) !== null && _a !== void 0 ? _a : "void";
            return Object.assign(Object.assign({}, orig), { outcome });
        });
        const finalScorePayload = {
            home: game.homeScore,
            away: game.awayScore,
        };
        const resultUnits = Math.round(ruRaw * 100) / 100;
        batch.update(doc.ref, {
            settlement,
            resultUnits,
            settledAt: now,
            legs: legsWithOutcome,
            "game.status": "final",
            "game.finalScore": finalScorePayload,
        });
        tasks.push((0, updateUserStats_1.applyPostToUserStats)({
            uid: p.authorUid,
            postId: doc.id,
            createdAt: p.createdAt,
            settlement: settlement,
            resultUnits,
            usedOdds: Number(usedOdds),
            league: game.league,
        }));
    }
    await batch.commit();
    await Promise.all(tasks);
    await db().doc(`games/${gameId}`).set({
        "game.status": "final",
        "game.finalScore": {
            home: game.homeScore,
            away: game.awayScore,
        },
        resultComputedAt: firestore_2.FieldValue.serverTimestamp(),
    }, { merge: true });
    try {
        const homeTeamId = (_h = after === null || after === void 0 ? void 0 : after.home) === null || _h === void 0 ? void 0 : _h.teamId;
        const awayTeamId = (_j = after === null || after === void 0 ? void 0 : after.away) === null || _j === void 0 ? void 0 : _j.teamId;
        if (homeTeamId && awayTeamId) {
            const homeScore = after.homeScore;
            const awayScore = after.awayScore;
            let homeResult = "d";
            let awayResult = "d";
            if (homeScore > awayScore) {
                homeResult = "w";
                awayResult = "l";
            }
            else if (homeScore < awayScore) {
                homeResult = "l";
                awayResult = "w";
            }
            const updateRecord = async (teamId, result) => {
                const teamRef = db().doc(`teams/${teamId}`);
                const snap = await teamRef.get();
                const data = snap.data() || {};
                const prev = data.record || { w: 0, d: 0, l: 0 };
                const next = Object.assign(Object.assign({}, prev), { [result]: (prev[result] || 0) + 1 });
                await teamRef.set({ record: next }, { merge: true });
            };
            await Promise.all([
                updateRecord(homeTeamId, homeResult),
                updateRecord(awayTeamId, awayResult),
            ]);
        }
    }
    catch (e) {
        console.error("team record update failed", e);
    }
});
//# sourceMappingURL=onGameFinal.js.map