/**
 * チュートリアル「ピックアップ」案内の対象試合。
 * 専用試合は無い。開始日に一番近いスレート上の、実際の PICK UP を使う。
 */

import { isNbaPickupGame } from "@/lib/nba/isPickupGame";

type PickupCandidate = {
  id?: unknown;
  isPickup?: unknown;
  pickupWeekKey?: unknown;
};

export function resolveTutorialPickupGameId(
  games: ReadonlyArray<PickupCandidate>
): string | null {
  const first = games.find((g) => isNbaPickupGame(g));
  const id = first ? String(first.id ?? "") : "";
  return id || null;
}
