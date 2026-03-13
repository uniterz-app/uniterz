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
const SCALE_15_TO_10 = 10 / 15;
const round1 = (v) => Math.round(v * 10) / 10;
exports.scorePrecisionRules = {
    /* =========================
     * Basketball（10点満点）
     * 点差 4.7 + HOME 2.7 + AWAY 2.7 = 10.1 にならないよう合計は10に丸め
     * → 15点設計(7/4/4)を 10/15 スケールして返す
     * ========================= */
    basketball: {
        // 点差（最大 7 → 4.7）
        pointByDiff(diff) {
            const r = curvedScore(diff, 6, 16, 1.6);
            return round1(r * 7 * SCALE_15_TO_10);
        },
        // HOME（最大 4 → 2.7）
        pointByHome(diff) {
            const r = curvedScore(diff, 6, 16, 1.6);
            return round1(r * 4 * SCALE_15_TO_10);
        },
        // AWAY（最大 4 → 2.7）
        pointByAway(diff) {
            const r = curvedScore(diff, 6, 16, 1.6);
            return round1(r * 4 * SCALE_15_TO_10);
        },
    },
    /* =========================
     * Football（サッカー）
     * 15点設計を 10/15 にスケールして 0–10 にする
     * ========================= */
    football: {
        calc(predH, predA, actH, actA) {
            let total15 = 0;
            /* ---- ① 結果一致（6） ---- */
            const result = (h, a) => h === a ? "draw" : h > a ? "home" : "away";
            if (result(predH, predA) === result(actH, actA)) {
                total15 += 6;
            }
            /* ---- ② 試合テンポ一致（6） ---- */
            const tempo = (sum) => (sum <= 2 ? "low" : sum === 3 ? "mid" : "high");
            if (tempo(predH + predA) === tempo(actH + actA)) {
                total15 += 6;
            }
            /* ---- ③ スコア誤差（3） ---- */
            const err = Math.abs(predH - actH) + Math.abs(predA - actA);
            if (err === 0)
                total15 += 3;
            else if (err === 1)
                total15 += 2;
            else if (err === 2)
                total15 += 1;
            return {
                totalPt: round1(total15 * SCALE_15_TO_10), // 0–10
            };
        },
    },
};
//# sourceMappingURL=scorePrecisionRules.js.map