import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../lib/firebase";
import {
  parseNbaFavorites,
  type NbaFavorites,
} from "../../../../../lib/profile/nbaFavorites";
import { subscribeUserDocLive } from "../../../../../lib/user/subscribeUserDocLive";

const EMPTY: NbaFavorites = {
  favoriteNbaTeamId: null,
  favoriteNbaTeamFanSinceSeason: null,
  favoriteNbaPlayers: [],
};

/** ログイン中ユーザー自身のお気に入り（ライブ購読） */
export function useMyNbaFavoritesNative(): {
  favorites: NbaFavorites;
  ready: boolean;
  uid: string | null;
} {
  const [uid, setUid] = useState<string | null>(
    () => auth.currentUser?.uid ?? null
  );
  const [authReady, setAuthReady] = useState(() => !!auth.currentUser);
  const [favorites, setFavorites] = useState<NbaFavorites>(EMPTY);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    return onAuthStateChanged(auth, (user) => {
      setUid(user?.uid ?? null);
      setAuthReady(true);
    });
  }, []);

  useEffect(() => {
    if (!authReady) return;
    if (!uid) {
      setFavorites(EMPTY);
      setReady(true);
      return;
    }
    setReady(false);
    return subscribeUserDocLive(uid, (data) => {
      setFavorites(
        parseNbaFavorites(data ? (data as Record<string, unknown>) : null)
      );
      setReady(true);
    });
  }, [uid, authReady]);

  return { favorites, ready, uid };
}
