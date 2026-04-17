"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onPlayoffResultsWrite = void 0;
const firestore_1 = require("firebase-functions/v2/firestore");
const firebase_1 = require("../firebase");
const playoffBracketRescoreChunked_1 = require("./playoffBracketRescoreChunked");
exports.onPlayoffResultsWrite = (0, firestore_1.onDocumentWritten)({
    document: "playoffResults/{season}",
    region: "asia-northeast1",
}, async (event) => {
    var _a, _b;
    const season = String((_a = event.params.season) !== null && _a !== void 0 ? _a : "").trim();
    if (!season)
        return;
    const after = (_b = event.data) === null || _b === void 0 ? void 0 : _b.after;
    if (!(after === null || after === void 0 ? void 0 : after.exists))
        return;
    await (0, playoffBracketRescoreChunked_1.enqueuePlayoffBracketRescoreChain)(firebase_1.db, season);
});
//# sourceMappingURL=onPlayoffResultsWrite.js.map