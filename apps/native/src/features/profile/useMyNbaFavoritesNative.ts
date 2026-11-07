import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../lib/firebase";
import {
  nbaFavoriteMaxPlayers,
  parseNbaFavorites,
  type NbaFavorites,
} from "../../../../../lib/profile/nbaFavorites";
import { userDataIsPro } from "../../../../../lib/pro/userPlanActive";
import { subscribeUserDocLive } from "../../../../../lib/user/subscribeUserDocLive";
import { useMyNbaFavoritesWithOptimistic } from "../../../../../lib/profile/myNbaFavoritesOptimistic";

const EMPTY: NbaFavorites = {
  favoriteNbaTeamId: null,
  favoriteNbaTeamFanSinceSeason: null,
  favoriteNbaPlayers: [],
};

/** ログイン中ユーザー自身のお気に入り（ライブ購読）。選手の上限はプランで変わる */
export function useMyNbaFavoritesNative(): {
  favorites: NbaFavorites;
  ready: boolean;
  uid: string | null;
  isPro: boolean;
  maxPlayers: number;
} {
  const [uid, setUid] = useState<string | null>(
    () => auth.currentUser?.uid ?? null
  );
  const [authReady, setAuthReady] = useState(() => !!auth.currentUser);
  const [favorites, setFavorites] = useState<NbaFavorites>(EMPTY);
  const [isPro, setIsPro] = useState(false);
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
      setIsPro(false);
      setReady(true);
      return;
    }
    setReady(false);
    return subscribeUserDocLive(uid, (data) => {
      const doc = data ? (data as Record<string, unknown>) : null;
      setFavorites(parseNbaFavorites(doc));
      setIsPro(userDataIsPro(doc));
      setReady(true);
    });
  }, [uid, authReady]);

  const merged = useMyNbaFavoritesWithOptimistic(uid, favorites);
  return {
    favorites: merged,
    ready,
    uid,
    isPro,
    maxPlayers: nbaFavoriteMaxPlayers(isPro),
  };
}
