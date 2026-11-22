/**
 * 公開 `/api/games/doc` / `/api/games/docs`。Firestore クライアントの games 全項目 get を使わない。
 */
import { reviveGameDoc, reviveGameDocs } from "@/lib/games/gameDocJson";

export type PublicGameDocView = "slim" | "full";

type DocCacheEntry = {
  at: number;
  view: PublicGameDocView;
  exists: boolean;
  game: Record<string, unknown> | null;
  peers: Record<string, unknown>[];
};

const DOC_TTL_MS = 3 * 60 * 1000;
const docCache = new Map<string, DocCacheEntry>();
const docInflight = new Map<string, Promise<DocCacheEntry>>();

function apiRoot(apiBaseUrl?: string | null): string {
  const explicit = (apiBaseUrl ?? "").replace(/\/$/, "");
  if (explicit) return explicit;
  const env = String(
    process.env.EXPO_PUBLIC_UNITERZ_API_BASE_URL ?? ""
  ).replace(/\/$/, "");
  return env;
}

function cacheKey(
  gameId: string,
  view: PublicGameDocView,
  includePeers: boolean,
  apiBaseUrl?: string | null
): string {
  return `${apiRoot(apiBaseUrl)}|${gameId}|${view}|${includePeers ? "p" : "n"}`;
}

function asEntry(hit: DocCacheEntry, wantFull: boolean): DocCacheEntry | null {
  if (Date.now() - hit.at >= DOC_TTL_MS) return null;
  if (wantFull && hit.view !== "full") return null;
  return hit;
}

export function primePublicGameDocCache(
  gameId: string,
  data: Record<string, unknown> | null,
  exists: boolean = data != null
): void {
  const id = gameId.trim();
  if (!id) return;
  docCache.set(cacheKey(id, "slim", false), {
    at: Date.now(),
    view: "slim",
    exists,
    game: data,
    peers: [],
  });
}

export async function fetchPublicGameDoc(opts: {
  gameId: string;
  view?: PublicGameDocView;
  includePeers?: boolean;
  apiBaseUrl?: string | null;
}): Promise<{
  exists: boolean;
  game: Record<string, unknown> | null;
  peers: Record<string, unknown>[];
}> {
  const gameId = opts.gameId.trim();
  if (!gameId) return { exists: false, game: null, peers: [] };
  const view = opts.view ?? "slim";
  const includePeers = opts.includePeers ?? true;
  const key = cacheKey(gameId, view, includePeers, opts.apiBaseUrl);
  const hit = docCache.get(key);
  if (hit) {
    const fresh = asEntry(hit, view === "full");
    if (fresh) {
      return { exists: fresh.exists, game: fresh.game, peers: fresh.peers };
    }
  }
  const pending = docInflight.get(key);
  if (pending) {
    const next = await pending;
    return { exists: next.exists, game: next.game, peers: next.peers };
  }

  const promise = (async (): Promise<DocCacheEntry> => {
    const qs = new URLSearchParams({ id: gameId, view });
    if (!includePeers) qs.set("peers", "0");
    const url = `${apiRoot(opts.apiBaseUrl)}/api/games/doc?${qs.toString()}`;
    const res = await fetch(url, { method: "GET" });
    if (res.status === 404) {
      return {
        at: Date.now(),
        view,
        exists: false,
        game: null,
        peers: [],
      };
    }
    const json = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      found?: boolean;
      game?: Record<string, unknown> | null;
      peers?: Record<string, unknown>[];
    };
    if (!res.ok || json.ok === false || json.found === false || !json.game) {
      return {
        at: Date.now(),
        view,
        exists: false,
        game: null,
        peers: [],
      };
    }
    const game = reviveGameDoc(json.game);
    const peers = reviveGameDocs(json.peers ?? []);
    return {
      at: Date.now(),
      view,
      exists: true,
      game,
      peers,
    };
  })().finally(() => {
    docInflight.delete(key);
  });

  docInflight.set(key, promise);
  const entry = await promise;
  docCache.set(key, entry);
  return { exists: entry.exists, game: entry.game, peers: entry.peers };
}

export async function fetchPublicGameDocs(opts: {
  gameIds: readonly string[];
  apiBaseUrl?: string | null;
}): Promise<Record<string, Record<string, unknown>>> {
  const ids = [...new Set(opts.gameIds.map((id) => id.trim()).filter(Boolean))];
  if (ids.length === 0) return {};
  const out: Record<string, Record<string, unknown>> = {};
  const need: string[] = [];
  for (const id of ids) {
    const hit = docCache.get(cacheKey(id, "slim", false, opts.apiBaseUrl));
    const fresh = hit ? asEntry(hit, false) : null;
    if (fresh?.exists && fresh.game) {
      out[id] = fresh.game;
      continue;
    }
    if (fresh && !fresh.exists) continue;
    need.push(id);
  }
  const CHUNK = 30;
  for (let i = 0; i < need.length; i += CHUNK) {
    const chunk = need.slice(i, i + CHUNK);
    const qs = new URLSearchParams({ ids: chunk.join(",") });
    const url = `${apiRoot(opts.apiBaseUrl)}/api/games/docs?${qs.toString()}`;
    try {
      const res = await fetch(url, { method: "GET" });
      const json = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        games?: Record<string, Record<string, unknown>>;
      };
      const games = res.ok && json.ok ? json.games ?? {} : {};
      const found = new Set<string>();
      for (const [id, row] of Object.entries(games)) {
        const revived = reviveGameDoc(row);
        found.add(id);
        out[id] = revived;
        primePublicGameDocCache(id, revived, true);
      }
      for (const id of chunk) {
        if (!found.has(id)) primePublicGameDocCache(id, null, false);
      }
    } catch {
      /* 呼び出し側が空扱いにする */
    }
  }
  return out;
}
