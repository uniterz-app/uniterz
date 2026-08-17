/**
 * チュートリアル「ピックアップ」案内の対象試合。
 * 先頭カードではなく、実際の PICK UP 試合を使う。
 */

import { nbaOpeningNightKnicksSixers } from "@/lib/games/nbaOpeningNightPreviewGames";
import { isNbaPickupGame } from "@/lib/nba/isPickupGame";

/** Opening Night の Knicks vs 76ers（このスレートの案内対象） */
export const TUTORIAL_PREFERRED_PICKUP_GAME_ID = String(
  nbaOpeningNightKnicksSixers.id ?? ""
);

type PickupCandidate = {
  id?: unknown;
  isPickup?: unknown;
  pickupWeekKey?: unknown;
};

export function resolveTutorialPickupGameId(
  games: ReadonlyArray<PickupCandidate>
): string | null {
  const preferred = games.find(
    (g) => String(g.id ?? "") === TUTORIAL_PREFERRED_PICKUP_GAME_ID
  );
  if (preferred && isNbaPickupGame(preferred)) {
    return TUTORIAL_PREFERRED_PICKUP_GAME_ID;
  }
  const first = games.find((g) => isNbaPickupGame(g));
  const id = first ? String(first.id ?? "") : "";
  return id || null;
}
