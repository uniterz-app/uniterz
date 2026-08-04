/**
 * NBA ピックアップ試合判定（Web / Native 共有）
 * games.pickupWeekKey または isPickup を正とする。
 */

export function isNbaPickupGame(game: {
  isPickup?: unknown;
  pickupWeekKey?: unknown;
} | null | undefined): boolean {
  if (!game || typeof game !== "object") return false;
  if (game.isPickup === true) return true;
  const key = game.pickupWeekKey;
  return typeof key === "string" && key.trim().length > 0;
}
