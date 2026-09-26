"use client";

import { auth } from "@/lib/firebase";
import type { NbaFavorites } from "@/lib/profile/nbaFavorites";
import { invalidateUserDocCache } from "@/lib/user/userDocCache";
import { invalidateAllProfileCache } from "@/app/component/profile/useProfile";

export type ToggleNbaFavoriteTeamPayload = {
  action: "toggleTeam";
  teamId: string;
  /** 追加時のみ。省略時はサーバーが今季を入れる */
  fanSinceSeason?: string | null;
};

export type ToggleNbaFavoritePlayerPayload = {
  action: "togglePlayer";
  playerId: string;
  displayName?: string;
  teamId?: string;
};

export type ReplaceNbaFavoritePlayerPayload = {
  action: "replacePlayer";
  removePlayerId: string;
  playerId: string;
  displayName?: string;
  teamId?: string;
};

export type SaveMeNbaFavoritesPayload =
  | ToggleNbaFavoriteTeamPayload
  | ToggleNbaFavoritePlayerPayload
  | ReplaceNbaFavoritePlayerPayload;

export type SaveMeNbaFavoritesResult = {
  favorites: NbaFavorites;
};

export class NbaFavoritesMaxPlayersError extends Error {
  constructor() {
    super("max_players");
    this.name = "NbaFavoritesMaxPlayersError";
  }
}

/** 本人の NBA お気に入りをトグル保存 */
export async function saveMeNbaFavorites(
  payload: SaveMeNbaFavoritesPayload
): Promise<SaveMeNbaFavoritesResult> {
  const user = auth.currentUser;
  if (!user) throw new Error("not authenticated");

  const token = await user.getIdToken();
  const res = await fetch("/api/me/nba-favorites", {
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
  invalidateUserDocCache(user.uid);
  invalidateAllProfileCache();
  return { favorites: data.favorites };
}
