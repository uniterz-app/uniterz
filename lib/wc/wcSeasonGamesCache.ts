import {
  collection,
  onSnapshot,
  query,
  where,
  type Firestore,
  type QuerySnapshot,
} from "firebase/firestore";
import type { WcStandingGame } from "@/lib/wc/computeGroupStandings";
import { aggregateWcTournamentGoalCounts } from "@/lib/wc/aggregateTournamentGoalCounts";

type CacheEntry = {
  games: WcStandingGame[] | null;
  goalCounts: ReadonlyMap<string, number> | null;
  loading: boolean;
  error: string | null;
  listeners: Set<() => void>;
  /** Firestore リアルタイム購読の解除関数 */
  firestoreUnsub: (() => void) | null;
};

const cache = new Map<string, CacheEntry>();

const EMPTY_WC_CACHE_READ = {
  games: null,
  goalCounts: null,
  loading: false,
  error: null,
} as const;

function getEntry(season: string): CacheEntry {
  let entry = cache.get(season);
  if (!entry) {
    entry = {
      games: null,
      goalCounts: null,
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

function parseWcStandingGames(snap: QuerySnapshot): {
  games: WcStandingGame[];
  goalCounts: ReadonlyMap<string, number>;
} {
  const list: WcStandingGame[] = [];
  const rawDocs: Record<string, unknown>[] = [];
  snap.forEach((d) => {
    const data = d.data() as Record<string, unknown>;
    rawDocs.push(data);
    const home = (data?.home ?? {}) as { teamId?: unknown };
    const away = (data?.away ?? {}) as { teamId?: unknown };
    const homeTeamId = typeof home.teamId === "string" ? home.teamId : "";
    const awayTeamId = typeof away.teamId === "string" ? away.teamId : "";
    if (!homeTeamId || !awayTeamId) return;
    const homeScore =
      typeof data.homeScore === "number" ? data.homeScore : null;
    const awayScore =
      typeof data.awayScore === "number" ? data.awayScore : null;
    const status =
      typeof data.status === "string" ? data.status : "scheduled";
    list.push({ homeTeamId, awayTeamId, homeScore, awayScore, status });
  });
  return {
    games: list,
    goalCounts: aggregateWcTournamentGoalCounts(rawDocs),
  };
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
      const parsed = parseWcStandingGames(snap);
      entry.games = parsed.games;
      entry.goalCounts = parsed.goalCounts;
      entry.loading = false;
      entry.error = null;
      notify(season);
    },
    (e) => {
      entry.games = [];
      entry.goalCounts = new Map();
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
  games: WcStandingGame[] | null;
  loading: boolean;
  error: string | null;
} {
  if (!season) {
    return EMPTY_WC_CACHE_READ;
  }
  const entry = getEntry(season);
  return {
    games: entry.games,
    loading: entry.loading,
    error: entry.error,
  };
}

/** 得点者ピッカー用 — 大会累計ゴール数（games.goalScorers から集計） */
export function readWcTournamentGoalCountsCache(
  season: string | null | undefined
): {
  goalCounts: ReadonlyMap<string, number> | null;
  loading: boolean;
  error: string | null;
} {
  if (!season) {
    return {
      goalCounts: null,
      loading: false,
      error: null,
    };
  }
  const entry = getEntry(season);
  return {
    goalCounts: entry.goalCounts,
    loading: entry.loading,
    error: entry.error,
  };
}
