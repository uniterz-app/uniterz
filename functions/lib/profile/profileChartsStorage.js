"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PROFILE_CHARTS_SUBCOL = void 0;
exports.profileChartsSubdocFields = profileChartsSubdocFields;
exports.profileChartsNestedPatch = profileChartsNestedPatch;
exports.writeProfileChartsDualInBatch = writeProfileChartsDualInBatch;
/**
 * profileCharts subcollection dual-write（Functions）。
 */
exports.PROFILE_CHARTS_SUBCOL = "profileCharts";
function profileChartsSubdocFields(charts, builtAtMs = Date.now()) {
    var _a, _b, _c;
    return {
        v: charts.v,
        seasonKey: charts.seasonKey,
        dailyTrend: (_a = charts.dailyTrend) !== null && _a !== void 0 ? _a : [],
        rankTrend: (_b = charts.rankTrend) !== null && _b !== void 0 ? _b : [],
        last20: (_c = charts.last20) !== null && _c !== void 0 ? _c : [],
        builtAtMs,
    };
}
function profileChartsNestedPatch(charts, builtAtMs = Date.now()) {
    const fields = profileChartsSubdocFields(charts, builtAtMs);
    return {
        "profileCharts.v": fields.v,
        "profileCharts.seasonKey": fields.seasonKey,
        "profileCharts.dailyTrend": fields.dailyTrend,
        "profileCharts.rankTrend": fields.rankTrend,
        "profileCharts.last20": fields.last20,
        "profileCharts.builtAtMs": fields.builtAtMs,
    };
}
function writeProfileChartsDualInBatch(batch, firestore, uid, charts, builtAtMs = Date.now()) {
    const fields = profileChartsSubdocFields(charts, builtAtMs);
    const cumRef = firestore.doc(`cumulative_stats/${uid}`);
    batch.set(cumRef, profileChartsNestedPatch(charts, builtAtMs), {
        merge: true,
    });
    batch.set(cumRef.collection(exports.PROFILE_CHARTS_SUBCOL).doc(charts.seasonKey), fields, { merge: true });
}
//# sourceMappingURL=profileChartsStorage.js.map