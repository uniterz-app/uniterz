import {
  collection,
  onSnapshot,
  query,
  where,
  type Firestore,
  type QuerySnapshot,
} from "firebase/firestore";
import {
  getResolvedGameScore,
  normalizeStartAtJst,
  toStatusFromGameDoc,
} from "@/lib/games/transform";
import type { WcSeasonGameRecord } from "@/lib/wc/wcSeasonGameRecord";

type CacheEntry = {
  games: WcSeasonGameRecord[] | null;
  loading: boolean;
  error: string | null;
  listeners: Set<() => void>;
  /** Firestore リアルタイム購読の解除関数 */
  firestoreUnsub: (() => void) | null;
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
      firestoreUnsub: null,
    };
    cache.set(season, entry);
  }
  return entry;
}

function notify(season: string) {
  getEntry(season).listeners.forEach((fn) => fn());
}

function parseWcStandingGames(snap: QuerySnapshot): WcSeasonGameRecord[] {
  const list: WcSeasonGameRecord[] = [];
  snap.forEach((d) => {
    const data = d.data() as Record<string, unknown>;
    const home = (data?.home ?? {}) as { teamId?: unknown };
    const away = (data?.away ?? {}) as { teamId?: unknown };
    const homeTeamId = typeof home.teamId === "string" ? home.teamId : "";
    const awayTeamId = typeof away.teamId === "string" ? away.teamId : "";
    if (!homeTeamId || !awayTeamId) return;
    const score = getResolvedGameScore(data);
    const status = toStatusFromGameDoc(data);
    const startAt = normalizeStartAtJst(data);
    const roundLabel =
      typeof data.roundLabel === "string" ? data.roundLabel.trim() : "";
    list.push({
      id: d.id,
      homeTeamId,
      awayTeamId,
      homeScore: score?.home ?? null,
      awayScore: score?.away ?? null,
      status,
      startAtMs: startAt?.getTime() ?? null,
      roundLabel: roundLabel || null,
    });
  });
  return list;
}

function stopFirestoreListener(season: string) {
  const entry = getEntry(season);
  if (entry.firestoreUnsub) {
    entry.firestoreUnsub();
    entry.firestoreUnsub = null;
  }
}

/** 試合確定後に順位が古いまま残る場合の手動リフレッシュ用 */
export function invalidateWcSeasonGamesCache(season?: string | null) {
  if (season) {
    stopFirestoreListener(season);
    cache.delete(season);
    return;
  }
  for (const key of cache.keys()) {
    stopFirestoreListener(key);
  }
  cache.clear();
}

function ensureLoad(db: Firestore, season: string) {
  const entry = getEntry(season);
  if (entry.firestoreUnsub) return;

  entry.loading = true;
  entry.error = null;
  notify(season);

  const q = query(
    collection(db, "games"),
    where("league", "==", "wc"),
    where("season", "==", season)
  );

  entry.firestoreUnsub = onSnapshot(
    q,
    (snap) => {
      entry.games = parseWcStandingGames(snap);
      entry.loading = false;
      entry.error = null;
      notify(season);
    },
    (e) => {
      entry.games = [];
      entry.loading = false;
      entry.error =
        e instanceof Error ? e.message : "failed to fetch wc games";
      notify(season);
    }
  );
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
    if (entry.listeners.size === 0) {
      stopFirestoreListener(season);
      cache.delete(season);
    }
  };
}

export function readWcSeasonGamesCache(season: string | null | undefined): {
  games: WcSeasonGameRecord[] | null;
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
