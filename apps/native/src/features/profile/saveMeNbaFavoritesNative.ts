/**
 * Native 向け NBA お気に入りトグル。Web `/api/me/nba-favorites` と同じ。
 */
import { auth } from "../../lib/firebase";
import type { NbaFavorites } from "../../../../../lib/profile/nbaFavorites";
import { getUniterzApiBaseUrl } from "../games/submitPredictionApi";
import { invalidateProfileUserDocNative } from "./profileUserDocCacheNative";

export type SaveMeNbaFavoritesNativePayload =
  | {
      action: "toggleTeam";
      teamId: string;
      fanSinceSeason?: string | null;
    }
  | {
      action: "togglePlayer";
      playerId: string;
      displayName?: string;
      teamId?: string;
    }
  | {
      action: "replacePlayer";
      removePlayerId: string;
      playerId: string;
      displayName?: string;
      teamId?: string;
    };

export class NbaFavoritesMaxPlayersError extends Error {
  constructor() {
    super("max_players");
    this.name = "NbaFavoritesMaxPlayersError";
  }
}

export async function saveMeNbaFavoritesNative(
  payload: SaveMeNbaFavoritesNativePayload
): Promise<{ favorites: NbaFavorites }> {
  const user = auth.currentUser;
  if (!user) throw new Error("not authenticated");

  const base = getUniterzApiBaseUrl()?.replace(/\/$/, "") ?? "";
  if (!base) {
    throw new Error("API_BASE_URL_missing");
  }

  const token = await user.getIdToken();
  const res = await fetch(`${base}/api/me/nba-favorites`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  const data = (await res.json().catch(() => ({}))) as {
    error?: string;
    favorites?: NbaFavorites;
  };
  if (!res.ok) {
    if (data?.error === "max_players") {
      throw new NbaFavoritesMaxPlayersError();
    }
    throw new Error(data?.error ?? res.statusText);
  }
  if (!data.favorites) {
    throw new Error("missing favorites");
  }
  invalidateProfileUserDocNative(user.uid);
  return { favorites: data.favorites };
}
