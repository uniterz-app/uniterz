"use strict";
// functions/src/utils/settle.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.judgeLeg = judgeLeg;
exports.settleTicket = settleTicket;
function normalizeGameScore(game) {
    if (game.homeScore != null && game.awayScore != null)
        return game;
    const fs = game.finalScore;
    if (fs && typeof fs.home === "number" && typeof fs.away === "number") {
        return Object.assign(Object.assign({}, game), { homeScore: fs.home, awayScore: fs.away });
    }
    return game;
}
/* ----------------------------- B.LEAGUE（点差レンジ） ----------------------------- */
const BJ_DIFF_RANGES = [
    [1, 3], // idx 0: 1–3
    [4, 6], // idx 1: 4–6
    [7, 9], // idx 2: 7–9
    [10, 14], // idx 3: 10–14
    [15, 19], // idx 4: 15–19
    [20, 24], // idx 5: 20–24
    [25, 29], // idx 6: 25–29
    [30, null], // idx 7: 30+
];
/* ----------------------------- J1（18択 HOME→AWAY→DRAW） ----------------------------- */
const J18 = [
    // HOME 0–6
    { side: "home", home: 1, away: 0 }, // 0
    { side: "home", home: 2, away: 0 }, // 1
    { side: "home", home: 2, away: 1 }, // 2
    { side: "home", home: 3, away: 0 }, // 3
    { side: "home", home: 3, away: 1 }, // 4
    { side: "home", home: 3, away: 2 }, // 5
    { side: "home", home: "4plus", away: "4plus" }, // 6: HOME 4点以上
    // AWAY 7–13
    { side: "away", home: 0, away: 1 }, // 7
    { side: "away", home: 0, away: 2 }, // 8
    { side: "away", home: 1, away: 2 }, // 9
    { side: "away", home: 0, away: 3 }, // 10
    { side: "away", home: 1, away: 3 }, // 11
    { side: "away", home: 2, away: 3 }, // 12
    { side: "away", home: "4plus", away: "4plus" }, // 13: AWAY 4点以上
    // DRAW 14–17
    { side: "draw", home: 0, away: 0 }, // 14
    { side: "draw", home: 1, away: 1 }, // 15
    { side: "draw", home: 2, away: 2 }, // 16
    { side: "draw", home: "3plus", away: "3plus" }, // 17: DRAW 3点以上
];
/* ----------------------------- optionId で厳密採点 ----------------------------- */
function judgeByOptionId(game, optionId) {
    const hs = game.homeScore, as = game.awayScore;
    if (hs == null || as == null)
        return "void";
    const m = /^([a-z]+):(home|away|draw):(\d+)$/i.exec(optionId);
    if (!m)
        return "void";
    const leagueKey = m[1].toLowerCase(); // "bj" | "j" など
    const side = m[2].toLowerCase();
    const idx = Number(m[3]);
    /* ---------------- B1（既存） ---------------- */
    if (leagueKey === "bj") {
        const diff = Math.abs(hs - as);
        const homeWin = hs > as;
        const awayWin = as > hs;
        if (side === "home" && !homeWin)
            return "miss";
        if (side === "away" && !awayWin)
            return "miss";
        const range = BJ_DIFF_RANGES[idx];
        if (!range)
            return "void";
        const [min, max] = range;
        const inRange = max == null ? diff >= min : diff >= min && diff <= max;
        return inRange ? "hit" : "miss";
    }
    /* ---------------- J1（18択に完全対応） ---------------- */
    if (leagueKey === "j") {
        const item = J18[idx];
        if (!item)
            return "void";
        const hs = game.homeScore;
        const as = game.awayScore;
        // --- 勝敗の基本判定 ---
        if (item.side === "home" && !(hs > as))
            return "miss";
        if (item.side === "away" && !(as > hs))
            return "miss";
        if (item.side === "draw" && !(hs === as))
            return "miss";
        // --- スコア一致判定 ---
        const matchScore = (exp, real) => {
            if (exp === "4plus")
                return real >= 4;
            if (exp === "3plus")
                return real >= 3;
            return real === exp;
        };
        const okHome = matchScore(item.home, hs);
        const okAway = matchScore(item.away, as);
        return okHome && okAway ? "hit" : "miss";
    }
    return "void";
}
/* ----------------------------- ラベルでフォールバック採点（既存） ----------------------------- */
function norm(s) {
    return String(s !== null && s !== void 0 ? s : "")
        .normalize("NFKC")
        .toLowerCase()
        .replace(/\s+/g, "")
        .replace(/[‐-‒–—―\-ー~〜]/g, "ー")
        .replace(/[^\p{L}\p{N}ー]/gu, "");
}
function inferSideByLabel(labelN, homeN, awayN) {
    if (/(引分|引き分け|ﾄﾞﾛｰ|ﾄﾞﾛ|draw)/.test(labelN))
        return "draw";
    const isHome = labelN.includes(homeN);
    const isAway = labelN.includes(awayN);
    if (isHome && !isAway)
        return "home";
    if (isAway && !isHome)
        return "away";
    return "unknown";
}
function parseB1MarginFromLabel(labelN) {
    if (/(30|３0|三十)点差?以上/.test(labelN) || (/30点差/.test(labelN) && /以上/.test(labelN))) {
        return { min: 30 };
    }
    const m = labelN.match(/(\d{1,2})ー(\d{1,2})点差/);
    if (!m)
        return null;
    const a = Number(m[1]), b = Number(m[2]);
    if (!Number.isFinite(a) || !Number.isFinite(b) || a > b)
        return null;
    return { min: a, max: b };
}
function bucketForB1(diff) {
    if (diff >= 30)
        return { min: 30 };
    if (diff >= 25)
        return { min: 25, max: 29 };
    if (diff >= 20)
        return { min: 20, max: 24 };
    if (diff >= 15)
        return { min: 15, max: 19 };
    if (diff >= 10)
        return { min: 10, max: 14 };
    if (diff >= 7)
        return { min: 7, max: 9 };
    if (diff >= 4)
        return { min: 4, max: 6 };
    if (diff >= 1)
        return { min: 1, max: 3 };
    return { min: 0, max: 0 };
}
function judgeByLabel(game, leg) {
    var _a, _b, _c;
    const { homeScore, awayScore } = game;
    if (homeScore == null || awayScore == null)
        return "void";
    const homeWin = homeScore > awayScore;
    const awayWin = awayScore > homeScore;
    const draw = homeScore === awayScore;
    const L = norm(leg.label);
    const H = norm(game.home);
    const A = norm(game.away);
    const side = inferSideByLabel(L, H, A);
    if (/点差/.test(L) || ((_a = game.league) !== null && _a !== void 0 ? _a : "").toLowerCase() === "bj") {
        const spec = parseB1MarginFromLabel(L);
        if (!spec)
            return "void";
        const diff = Math.abs(homeScore - awayScore);
        const actual = bucketForB1(diff);
        const sameRange = spec.min === actual.min && ((_b = spec.max) !== null && _b !== void 0 ? _b : Infinity) === ((_c = actual.max) !== null && _c !== void 0 ? _c : Infinity);
        if (side === "home")
            return homeWin && sameRange ? "hit" : "miss";
        if (side === "away")
            return awayWin && sameRange ? "hit" : "miss";
        if (side === "draw")
            return draw ? "hit" : "miss";
        return "void";
    }
    if (side === "draw")
        return draw ? "hit" : "miss";
    if (side === "home")
        return homeWin ? "hit" : "miss";
    if (side === "away")
        return awayWin ? "hit" : "miss";
    return "void";
}
/* ----------------------------- 公開API ----------------------------- */
function judgeLeg(game, leg) {
    game = normalizeGameScore(game);
    if (leg.optionId)
        return judgeByOptionId(game, leg.optionId);
    return judgeByLabel(game, leg);
}
/** 投稿全体の settlement と resultUnits を計算（既存） */
function settleTicket(game, legs) {
    let sumHit = 0;
    let sumVoid = 0;
    let anyHit = false;
    let allVoid = true;
    for (const leg of legs) {
        const s = judgeLeg(game, leg);
        if (s === "hit") {
            anyHit = true;
            allVoid = false;
            sumHit += leg.pct * leg.odds;
        }
        else if (s === "miss") {
            allVoid = false;
        }
        else if (s === "void") {
            sumVoid += leg.pct;
        }
    }
    const resultUnits = sumHit - (1 - sumVoid);
    const settlement = allVoid ? "void" : anyHit ? "hit" : "miss";
    return { settlement, resultUnits };
}
//# sourceMappingURL=settle.js.map