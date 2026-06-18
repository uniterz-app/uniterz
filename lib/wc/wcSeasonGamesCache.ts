import type { Firestore } from "firebase/firestore";
import type { WcStandingGame } from "@/lib/wc/computeGroupStandings";
import { fetchWcSeasonGames } from "@/lib/wc/fetchWcSeasonGames";

type CacheEntry = {
  games: WcStandingGame[] | null;
  loading: boolean;
  error: string | null;
  listeners: Set<() => void>;
};

const cache = new Map<string, CacheEntry>();

function getEntry(season: string): CacheEntry {
  let entry = cache.get(season);
  if (!entry) {
    entry = {
      games: null,
      loading: false,
      error: null,
      listeners: new Set(),
    };
    cache.set(season, entry);
  }
  return entry;
}

function notify(season: string) {
  getEntry(season).listeners.forEach((fn) => fn());
}

function ensureLoad(db: Firestore, season: string) {
  const entry = getEntry(season);
  if (entry.games != null || entry.loading) return;
  entry.loading = true;
  entry.error = null;
  notify(season);
  void fetchWcSeasonGames(db, season)
    .then((games) => {
      entry.games = games;
      entry.loading = false;
      notify(season);
    })
    .catch((e) => {
      entry.games = [];
      entry.loading = false;
      entry.error = e instanceof Error ? e.message : "failed to fetch wc games";
      notify(season);
    });
}

export function subscribeWcSeasonGames(
  db: Firestore,
  season: string | null | undefined,
  listener: () => void
): () => void {
  if (!season) return () => {};
  const entry = getEntry(season);
  entry.listeners.add(listener);
  ensureLoad(db, season);
  return () => {
    entry.listeners.delete(listener);
  };
}

export function readWcSeasonGamesCache(season: string | null | undefined): {
  games: WcStandingGame[] | null;
  loading: boolean;
  error: string | null;
} {
  if (!season) {
    return { games: null, loading: false, error: null };
  }
  const entry = getEntry(season);
  return {
    games: entry.games,
    loading: entry.loading,
    error: entry.error,
  };
}
