"use strict";
/** Keep in sync with lib/wc/resolveWcStage.ts */
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveWcStageFromGame = resolveWcStageFromGame;
function resolveWcStageFromGame(game) {
    var _a;
    if (!game)
        return null;
    if (game.knockout === true)
        return "main";
    const label = String((_a = game.roundLabel) !== null && _a !== void 0 ? _a : "").trim();
    if (/^group\s/i.test(label))
        return "qualifying";
    if (game.wcStage === "qualifying" || game.wcStage === "main") {
        return game.wcStage;
    }
    return null;
}
//# sourceMappingURL=resolveWcStage.js.map