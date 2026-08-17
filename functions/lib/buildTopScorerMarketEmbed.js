"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TOP_SCORER_MARKET_NO_PICK_ID = void 0;
exports.buildTopScorerMarketEmbedFromPostsSnap = buildTopScorerMarketEmbedFromPostsSnap;
/**
 * NBA TOP SCORER 分布 — functions settle 用（lib と同ロジック）。
 */
const nbaTopScorerBonus_1 = require("./nbaTopScorerBonus");
exports.TOP_SCORER_MARKET_NO_PICK_ID = "__none__";
function normalizePick(raw) {
    var _a, _b;
    if (!raw || typeof raw !== "object")
        return null;
    const playerId = String((_a = raw.playerId) !== null && _a !== void 0 ? _a : "").trim();
    const teamId = String((_b = raw.teamId) !== null && _b !== void 0 ? _b : "").trim();
    if (!playerId || !teamId)
        return null;
    const nameRaw = raw.name;
    const name = nameRaw == null || String(nameRaw).trim() === ""
        ? null
        : String(nameRaw).trim();
    return name ? { playerId, teamId, name } : { playerId, teamId };
}
function normalizeLeadingScorers(raw) {
    if (!Array.isArray(raw))
        return [];
    const parsed = [];
    for (const row of raw) {
        if (!row || typeof row !== "object")
            continue;
        const pick = normalizePick(row);
        if (!pick)
            continue;
        const points = Number(row.points);
        if (!Number.isFinite(points) || points < 0)
            continue;
        parsed.push(Object.assign(Object.assign({}, pick), { points }));
    }
    if (parsed.length === 0)
        return [];
    const maxPts = Math.max(...parsed.map((p) => p.points));
    return parsed.filter((p) => p.points === maxPts);
}
function normalizeCandidates(raw) {
    var _a;
    if (!Array.isArray(raw))
        return [];
    const out = [];
    for (const row of raw) {
        if (!row || typeof row !== "object")
            continue;
        const pick = normalizePick(row);
        if (!pick)
            continue;
        const name = String((_a = row.name) !== null && _a !== void 0 ? _a : "").trim();
        if (!name)
            continue;
        out.push(Object.assign(Object.assign({}, pick), { name }));
    }
    return out;
}
function pickKey(playerId, teamId) {
    return `${playerId}|${teamId}`;
}
function resolveName(playerId, teamId, nameHint, candidates, leaders) {
    if (nameHint === null || nameHint === void 0 ? void 0 : nameHint.trim())
        return nameHint.trim();
    const c = candidates.find((x) => x.playerId === playerId && x.teamId === teamId);
    if (c === null || c === void 0 ? void 0 : c.name)
        return c.name;
    const l = leaders.find((x) => x.playerId === playerId && x.teamId === teamId);
    if (l === null || l === void 0 ? void 0 : l.name)
        return l.name;
    return playerId;
}
function buildTopScorerMarketEmbedFromPostsSnap({ league, postsSnap, leadingScorers, topScorerCandidates, maxPlayerSlices = 4, }) {
    var _a;
    if (String(league !== null && league !== void 0 ? league : "").toLowerCase() !== "nba")
        return null;
    const totalN = postsSnap.size;
    if (totalN <= 0)
        return null;
    const leaders = normalizeLeadingScorers(leadingScorers);
    const candidates = normalizeCandidates(topScorerCandidates);
    const leaderKeys = new Set(leaders.map((l) => pickKey(l.playerId, l.teamId)));
    const buckets = new Map();
    let noPickCount = 0;
    let pickCount = 0;
    let hitCount = 0;
    for (const doc of postsSnap.docs) {
        const p = doc.data();
        const pick = normalizePick(p.prediction != null && typeof p.prediction === "object"
            ? p.prediction.goalScorer
            : null);
        if (!pick) {
            noPickCount += 1;
            continue;
        }
        pickCount += 1;
        if ((0, nbaTopScorerBonus_1.calcNbaTopScorerBonus)(league, p.prediction, leadingScorers) > 0) {
            hitCount += 1;
        }
        const key = pickKey(pick.playerId, pick.teamId);
        const prev = buckets.get(key);
        if (prev) {
            prev.count += 1;
            if (!prev.nameHint && pick.name)
                prev.nameHint = pick.name;
        }
        else {
            buckets.set(key, {
                playerId: pick.playerId,
                teamId: pick.teamId,
                nameHint: (_a = pick.name) !== null && _a !== void 0 ? _a : null,
                count: 1,
            });
        }
    }
    if (buckets.size === 0 && noPickCount === 0)
        return null;
    const playerSlices = [...buckets.values()]
        .sort((a, b) => b.count - a.count || a.playerId.localeCompare(b.playerId))
        .slice(0, maxPlayerSlices)
        .map((b) => {
        var _a;
        const leader = leaders.find((l) => l.playerId === b.playerId && l.teamId === b.teamId);
        const isActual = leaderKeys.has(pickKey(b.playerId, b.teamId));
        return {
            playerId: b.playerId,
            teamId: b.teamId,
            name: resolveName(b.playerId, b.teamId, b.nameHint, candidates, leaders),
            pct: (b.count / totalN) * 100,
            count: b.count,
            isActual,
            points: (_a = leader === null || leader === void 0 ? void 0 : leader.points) !== null && _a !== void 0 ? _a : null,
        };
    });
    const slices = [...playerSlices];
    if (noPickCount > 0) {
        slices.push({
            playerId: exports.TOP_SCORER_MARKET_NO_PICK_ID,
            teamId: "—",
            name: "NO PICK",
            pct: (noPickCount / totalN) * 100,
            count: noPickCount,
            isActual: false,
            points: null,
        });
    }
    if (slices.length === 0)
        return null;
    return {
        v: 1,
        n: totalN,
        hitRatePct: pickCount > 0 ? Math.round((hitCount / pickCount) * 1000) / 10 : null,
        slices,
    };
}
//# sourceMappingURL=buildTopScorerMarketEmbed.js.map