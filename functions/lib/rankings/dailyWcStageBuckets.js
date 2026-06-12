"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WC_RANKING_STAGES = void 0;
exports.readDailyWcStageBuckets = readDailyWcStageBuckets;
exports.WC_RANKING_STAGES = ["overall", "qualifying", "main"];
/** daily の WC ステージ別バケット（nested map と legacy dot-path 両対応） */
function readDailyWcStageBuckets(data) {
    var _a, _b, _c, _d;
    const nested = ((_a = data.rankingByWcStage) !== null && _a !== void 0 ? _a : {});
    const out = {
        overall: Object.assign({}, ((_b = nested.overall) !== null && _b !== void 0 ? _b : {})),
        qualifying: Object.assign({}, ((_c = nested.qualifying) !== null && _c !== void 0 ? _c : {})),
        main: Object.assign({}, ((_d = nested.main) !== null && _d !== void 0 ? _d : {})),
    };
    for (const stage of exports.WC_RANKING_STAGES) {
        const prefix = `rankingByWcStage.${stage}.`;
        for (const [key, val] of Object.entries(data)) {
            if (!key.startsWith(prefix))
                continue;
            out[stage][key.slice(prefix.length)] = val;
        }
    }
    return out;
}
//# sourceMappingURL=dailyWcStageBuckets.js.map