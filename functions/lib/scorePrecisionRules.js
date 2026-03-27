"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scorePrecisionRules = void 0;
/** 誤差 0→1, 1〜11 で線形減衰, 12+ → 0 */
function gradientScore(diff, zeroAt) {
    if (diff <= 0)
        return 1;
    if (diff >= zeroAt)
        return 0;
    return 1 - diff / zeroAt;
}
const SCALE_15_TO_10 = 10 / 15;
const round1 = (v) => Math.round(v * 10) / 10;
exports.scorePrecisionRules = {
    /* =========================
     * Basketball（10点満点）
     * 点差4 + Home3 + Away3 = 10
     * 誤差 0〜11 でグラデーション、12以上で0点
     * ========================= */
    basketball: {
        // 点差（最大 4）
        pointByDiff(diff) {
            const r = gradientScore(diff, 12);
            return round1(r * 4);
        },
        // HOME（最大 3）
        pointByHome(diff) {
            const r = gradientScore(diff, 12);
            return round1(r * 3);
        },
        // AWAY（最大 3）
        pointByAway(diff) {
            const r = gradientScore(diff, 12);
            return round1(r * 3);
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