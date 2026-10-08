/**
 * 自分の NBA お気に入りの保存直後の状態（`/api/me/nba-favorites` の返り値）を即時共有する。
 * users ドキュメントの onSnapshot が届くまで星・行が古い状態のままになり連打で再トグルされるのを防ぐ。
 */
import { useEffect, useState } from "react";
import {
  nbaFavoritesEqual,
  type NbaFavorites,
} from "@/lib/profile/nbaFavorites";

/** スナップショットが追いつかないときに楽観値を捨てるまで */
const OPTIMISTIC_TTL_MS = 15_000;

type Entry = { favorites: NbaFavorites; at: number };

const entries = new Map<string, Entry>();
const listeners = new Set<() => void>();

export function publishMyNbaFavoritesSaved(
  uid: string,
  favorites: NbaFavorites
): void {
  entries.set(uid, { favorites, at: Date.now() });
  for (const l of listeners) l();
}

/**
 * スナップショット値に保存直後の楽観値を重ねる。
 * スナップショットが楽観値に一致したら（または TTL 経過で）スナップショットに戻す。
 */
export function useMyNbaFavoritesWithOptimistic(
  uid: string | null,
  snapshot: NbaFavorites
): NbaFavorites {
  const [, bump] = useState(0);

  useEffect(() => {
    const l = () => bump((n) => n + 1);
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, []);

  const entry = uid ? entries.get(uid) : undefined;

  useEffect(() => {
    if (!uid || !entry) return;
    if (nbaFavoritesEqual(entry.favorites, snapshot)) {
      entries.delete(uid);
      return;
    }
    const left = OPTIMISTIC_TTL_MS - (Date.now() - entry.at);
    const t = setTimeout(() => {
      if (entries.get(uid) === entry) {
        entries.delete(uid);
        for (const l of listeners) l();
      }
    }, Math.max(0, left));
    return () => clearTimeout(t);
  }, [uid, entry, snapshot]);

  if (!entry) return snapshot;
  if (Date.now() - entry.at > OPTIMISTIC_TTL_MS) return snapshot;
  return entry.favorites;
}
