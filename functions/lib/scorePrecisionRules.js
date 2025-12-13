"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scorePrecisionRules = void 0;
function curvedScore(diff, full, zeroAt, gamma) {
    if (diff <= full)
        return 1;
    if (diff >= zeroAt)
        return 0;
    const r = 1 - (diff - full) / (zeroAt - full);
    return Math.pow(r, gamma);
}
exports.scorePrecisionRules = {
    /* =========================
     * Basketball（現行・変更なし）
     * ========================= */
    basketball: {
        // 点差（最大7点）
        pointByDiff(diff) {
            const r = curvedScore(diff, 6, 16, 1.6);
            return Math.round(r * 7 * 10) / 10;
        },
        // HOME（最大4点）
        pointByHome(diff) {
            const r = curvedScore(diff, 6, 16, 1.6);
            return Math.round(r * 4 * 10) / 10;
        },
        // AWAY（最大4点）
        pointByAway(diff) {
            const r = curvedScore(diff, 6, 16, 1.6);
            return Math.round(r * 4 * 10) / 10;
        },
    },
    /* =========================
     * Football（サッカー）
     * 結果6 + テンポ6 + 誤差3 = 15
     * ========================= */
    football: {
        calc(predH, predA, actH, actA) {
            let total = 0;
            /* ---- ① 結果一致（6） ---- */
            const result = (h, a) => h === a ? "draw" : h > a ? "home" : "away";
            if (result(predH, predA) === result(actH, actA)) {
                total += 6;
            }
            /* ---- ② 試合テンポ一致（6） ---- */
            const tempo = (sum) => sum <= 2 ? "low" : sum === 3 ? "mid" : "high";
            if (tempo(predH + predA) ===
                tempo(actH + actA)) {
                total += 6;
            }
            /* ---- ③ スコア誤差（3） ---- */
            const err = Math.abs(predH - actH) +
                Math.abs(predA - actA);
            if (err === 0)
                total += 3;
            else if (err === 1)
                total += 2;
            else if (err === 2)
                total += 1;
            return {
                totalPt: total, // 0–15
            };
        },
    },
};
//# sourceMappingURL=scorePrecisionRules.js.map