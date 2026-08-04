"use strict";
/**
 * NBA ピックアップ試合判定（集計・レポート共通）
 * games.pickupWeekKey または isPickup を正とする。
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.isNbaPickupGame = isNbaPickupGame;
function isNbaPickupGame(game) {
    if (!game || typeof game !== "object")
        return false;
    if (game.isPickup === true)
        return true;
    const key = game.pickupWeekKey;
    return typeof key === "string" && key.trim().length > 0;
}
//# sourceMappingURL=isPickupGame.js.map