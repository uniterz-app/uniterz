"use client";

import { useEffect, useState } from "react";
import { useFirebaseUser } from "@/lib/useFirebaseUser";
import {
  parseNbaFavorites,
  type NbaFavorites,
} from "@/lib/profile/nbaFavorites";
import { subscribeUserDocLive } from "@/lib/user/subscribeUserDocLive";
import { useMyNbaFavoritesWithOptimistic } from "@/lib/profile/myNbaFavoritesOptimistic";

const EMPTY: NbaFavorites = {
  favoriteNbaTeamId: null,
  favoriteNbaTeamFanSinceSeason: null,
  favoriteNbaPlayers: [],
};

/** ログイン中ユーザー自身のお気に入り（ライブ購読） */
export function useMyNbaFavorites(): {
  favorites: NbaFavorites;
  ready: boolean;
  uid: string | null;
} {
  const { fUser, status } = useFirebaseUser();
  const uid = fUser?.uid ?? null;
  const [favorites, setFavorites] = useState<NbaFavorites>(EMPTY);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
    if (!uid) {
      setFavorites(EMPTY);
      setReady(true);
      return;
    }
    setReady(false);
    return subscribeUserDocLive(uid, (data) => {
      setFavorites(
        parseNbaFavorites(
          data ? (data as Record<string, unknown>) : null
        )
      );
      setReady(true);
    });
  }, [uid, status]);

  const merged = useMyNbaFavoritesWithOptimistic(uid, favorites);
  return { favorites: merged, ready, uid };
}
