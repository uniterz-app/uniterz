"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.maybeCreateChildKnockoutGames = maybeCreateChildKnockoutGames;
const firestore_1 = require("firebase-admin/firestore");
const wcKnockoutBracketStructure_1 = require("./wcKnockoutBracketStructure");
const wcKnockoutSchedule2026_1 = require("./wcKnockoutSchedule2026");
const resolveKnockoutLoser_1 = require("./resolveKnockoutLoser");
const WC_KNOCKOUT_TOURNAMENT_YEAR = 2026;
async function loadTeamRef(db, teamId, cache) {
    var _a, _b, _c, _d;
    const id = teamId.trim();
    if (!id)
        return null;
    const cached = cache.get(id);
    if (cached)
        return cached;
    const snap = await db.collection("teams").doc(id).get();
    const data = snap.data();
    const ref = {
        teamId: id,
        name: String((_b = (_a = data === null || data === void 0 ? void 0 : data.name) !== null && _a !== void 0 ? _a : data === null || data === void 0 ? void 0 : data.nameEn) !== null && _b !== void 0 ? _b : id.replace(/^wc-/, "").toUpperCase()),
        nameJa: String((_d = (_c = data === null || data === void 0 ? void 0 : data.nameJa) !== null && _c !== void 0 ? _c : data === null || data === void 0 ? void 0 : data.name) !== null && _d !== void 0 ? _d : id),
    };
    cache.set(id, ref);
    return ref;
}
async function resolveFeederTeamId(db, feederMatchId, winners, useRunnerUp, cache) {
    var _a, _b, _c, _d, _e, _f;
    if (!useRunnerUp) {
        return ((_a = winners[feederMatchId]) === null || _a === void 0 ? void 0 : _a.trim()) || null;
    }
    const gameId = (0, wcKnockoutBracketStructure_1.wcKnockoutGameId)(feederMatchId, WC_KNOCKOUT_TOURNAMENT_YEAR);
    const snap = await db.collection("games").doc(gameId).get();
    const data = snap.data();
    if (!snap.exists || (data === null || data === void 0 ? void 0 : data.final) !== true)
        return null;
    const loser = (0, resolveKnockoutLoser_1.resolveKnockoutLoserTeamId)({
        homeTeamId: typeof data.homeTeamId === "string"
            ? data.homeTeamId
            : (_b = data.home) === null || _b === void 0 ? void 0 : _b.teamId,
        awayTeamId: typeof data.awayTeamId === "string"
            ? data.awayTeamId
            : (_c = data.away) === null || _c === void 0 ? void 0 : _c.teamId,
        homeScore: (_d = data.homeScore) !== null && _d !== void 0 ? _d : null,
        awayScore: (_e = data.awayScore) !== null && _e !== void 0 ? _e : null,
        advancingTeamId: (_f = data.advancingTeamId) !== null && _f !== void 0 ? _f : null,
        knockout: data.knockout === true,
        final: data.final === true,
    });
    if (loser)
        return loser;
    return null;
}
async function maybeCreateOneChildGame(db, season, childMatchId, winners, teamCache) {
    var _a, _b, _c, _d, _e, _f, _g;
    const def = (0, wcKnockoutBracketStructure_1.getWcKnockoutChildMatchDef)(childMatchId);
    if (!def)
        return null;
    const useRunnerUp = def.useRunnerUpFeeders === true;
    const [feederA, feederB] = def.feedsFrom;
    const homeTeamId = await resolveFeederTeamId(db, feederA, winners, useRunnerUp, teamCache);
    const awayTeamId = await resolveFeederTeamId(db, feederB, winners, useRunnerUp, teamCache);
    if (!homeTeamId || !awayTeamId)
        return null;
    const gameId = (0, wcKnockoutBracketStructure_1.wcKnockoutGameId)(childMatchId, WC_KNOCKOUT_TOURNAMENT_YEAR);
    const existing = await db.collection("games").doc(gameId).get();
    const existingData = existing.data();
    if (existing.exists && (existingData === null || existingData === void 0 ? void 0 : existingData.final) === true) {
        return null;
    }
    const existingHome = String((_c = (_a = existingData === null || existingData === void 0 ? void 0 : existingData.homeTeamId) !== null && _a !== void 0 ? _a : (_b = existingData === null || existingData === void 0 ? void 0 : existingData.home) === null || _b === void 0 ? void 0 : _b.teamId) !== null && _c !== void 0 ? _c : "").trim();
    const existingAway = String((_f = (_d = existingData === null || existingData === void 0 ? void 0 : existingData.awayTeamId) !== null && _d !== void 0 ? _d : (_e = existingData === null || existingData === void 0 ? void 0 : existingData.away) === null || _e === void 0 ? void 0 : _e.teamId) !== null && _f !== void 0 ? _f : "").trim();
    if (existing.exists &&
        existingHome === homeTeamId &&
        existingAway === awayTeamId) {
        return null;
    }
    const home = await loadTeamRef(db, homeTeamId, teamCache);
    const away = await loadTeamRef(db, awayTeamId, teamCache);
    if (!home || !away) {
        console.warn(`[wc-bracket] skip child ${childMatchId}: missing team doc for ${homeTeamId} or ${awayTeamId}`);
        return null;
    }
    const schedule = wcKnockoutSchedule2026_1.WC_KNOCKOUT_SCHEDULE_2026[childMatchId];
    const startAt = (schedule === null || schedule === void 0 ? void 0 : schedule.startAtIso)
        ? firestore_1.Timestamp.fromDate(new Date(schedule.startAtIso))
        : null;
    const payload = {
        id: gameId,
        league: "wc",
        season,
        status: "scheduled",
        venue: (_g = schedule === null || schedule === void 0 ? void 0 : schedule.venue) !== null && _g !== void 0 ? _g : null,
        roundLabel: (0, wcKnockoutBracketStructure_1.wcKnockoutRoundLabel)(def.round),
        wcStage: "main",
        knockout: true,
        wcKnockoutMatchId: childMatchId,
        home,
        away,
        homeTeamId: home.teamId,
        awayTeamId: away.teamId,
        final: false,
        homeScore: null,
        awayScore: null,
        regulationEtScore: null,
        advancingTeamId: null,
        resultComputedAt: null,
        score: null,
        liveMeta: null,
        finalMeta: null,
        goalScorers: [],
        autoCreatedFrom: "wc-knockout-parent-final",
        autoCreatedAt: firestore_1.Timestamp.now(),
    };
    if (startAt) {
        payload.startAt = startAt;
        payload.startAtJst = startAt;
    }
    await db.collection("games").doc(gameId).set(payload, { merge: true });
    console.log(`[wc-bracket] created child game ${gameId} (${childMatchId}): ${home.name} vs ${away.name}`);
    return gameId;
}
/**
 * 親試合 final 後 — 両親の勝者（または M103 の敗者）が揃った子試合を games に生成。
 */
async function maybeCreateChildKnockoutGames(db, params) {
    const { season, finishedMatchId, winners } = params;
    const childIds = (0, wcKnockoutBracketStructure_1.getWcKnockoutChildMatches)(finishedMatchId);
    if (childIds.length === 0)
        return [];
    const teamCache = new Map();
    const created = [];
    for (const childId of childIds) {
        try {
            const gameId = await maybeCreateOneChildGame(db, season, childId, winners, teamCache);
            if (gameId)
                created.push(gameId);
        }
        catch (err) {
            console.error(`[wc-bracket] failed to create child ${childId} after ${finishedMatchId}`, err);
        }
    }
    return created;
}
//# sourceMappingURL=createChildKnockoutGames.js.map