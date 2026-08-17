/**
 * 共通試合窓 API クライアント（Web / Native 共用）。
 * 予想・Pro は別。ここはカード共通データのみ。
 * TTL + inflight で同一窓の二重 fetch を抑える。
 */

import type { League } from "@/lib/leagues";
import { reviveGameDocs } from "@/lib/games/gameDocJson";
import { GAMES_WINDOW_PLUS_MINUS_DEFAULT } from "@/lib/games/gamesWindowConstants";

export type FetchGamesWindowResult = {
  rows: Record<string, unknown>[];
  peerRows: Record<string, unknown>[];
  hasLive: boolean;
  anchorDateKey: string | null;
  range: { startKey: string; endKey: string };
};

export type FetchGamesWindowParams = {
  league: League;
  timeZone: string;
  /** 初期窓: anchor ± pm */
  anchorDateKey?: string;
  plusMinus?: number;
  /** 端延長: 半開 [from, to) */
  fromDateKey?: string;
  toDateKey?: string;
  /** Native: API origin。Web は省略で相対パス */
  apiBaseUrl?: string | null;
  signal?: AbortSignal;
  /** サーバ側 games 取得上限 */
  limit?: number;
  /** false でシリーズ peer を省略（存在チェック用） */
  includePeers?: boolean;
  /** true でメモリキャッシュを使わない */
  force?: boolean;
};

const GAMES_WINDOW_FETCH_TTL_MS = 5 * 60 * 1000;

type CacheEntry = {
  at: number;
  value: FetchGamesWindowResult;
};

const resultCache = new Map<string, CacheEntry>();
const resultInflight = new Map<string, Promise<FetchGamesWindowResult>>();

function abortError(): Error {
  const err = new Error("Aborted");
  err.name = "AbortError";
  return err;
}

function buildGamesWindowCacheKey(params: FetchGamesWindowParams): string {
  const base = (params.apiBaseUrl ?? "").replace(/\/$/, "");
  const parts = [
    base,
    params.league,
    params.timeZone,
    params.fromDateKey && params.toDateKey
      ? `from:${params.fromDateKey}:to:${params.toDateKey}`
      : `anchor:${params.anchorDateKey ?? ""}:pm:${params.plusMinus ?? GAMES_WINDOW_PLUS_MINUS_DEFAULT}`,
    typeof params.limit === "number" ? `limit:${params.limit}` : "",
    params.includePeers === false ? "peers:0" : "peers:1",
  ];
  return parts.join("|");
}

async function fetchGamesWindowNetwork(
  params: FetchGamesWindowParams
): Promise<FetchGamesWindowResult> {
  const q = new URLSearchParams({
    league: params.league,
    tz: params.timeZone,
  });
  if (params.fromDateKey && params.toDateKey) {
    q.set("from", params.fromDateKey);
    q.set("to", params.toDateKey);
  } else {
    const anchor = params.anchorDateKey ?? "";
    const plusMinus = params.plusMinus ?? GAMES_WINDOW_PLUS_MINUS_DEFAULT;
    q.set("anchor", anchor);
    q.set("pm", String(plusMinus));
  }
  if (typeof params.limit === "number" && params.limit > 0) {
    q.set("limit", String(params.limit));
  }
  if (params.includePeers === false) q.set("peers", "0");

  const base = (params.apiBaseUrl ?? "").replace(/\/$/, "");
  const url = `${base}/api/games/window?${q.toString()}`;

  const controller = new AbortController();
  const timeoutMs = 8_000;
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  // 共有 inflight 中に片方が abort しても他方を殺さない（timeout のみ）
  const callerSignal = params.signal;

  let res: Response;
  try {
    if (callerSignal?.aborted) {
      throw abortError();
    }
    res = await fetch(url, {
      method: "GET",
      cache: "default",
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }

  if (callerSignal?.aborted) {
    throw abortError();
  }

  const text = await res.text().catch(() => "");
  type GamesWindowJson = {
    ok?: boolean;
    rows?: Record<string, unknown>[];
    peerRows?: Record<string, unknown>[];
    hasLive?: boolean;
    anchorDateKey?: string | null;
    range?: { startKey?: string; endKey?: string };
    error?: string;
  };

  let json: GamesWindowJson | null = null;
  try {
    json = text ? (JSON.parse(text) as GamesWindowJson) : null;
  } catch {
    throw new Error(
      res.ok
        ? "games_window_invalid_json"
        : `games_window_http_${res.status}`
    );
  }

  if (!res.ok || !json?.ok) {
    throw new Error(json?.error ?? `games_window_http_${res.status}`);
  }

  const rows = reviveGameDocs(json.rows ?? []);
  const peerRows = reviveGameDocs(json.peerRows ?? rows);
  const startKey = String(json.range?.startKey ?? params.fromDateKey ?? "");
  const endKey = String(json.range?.endKey ?? params.toDateKey ?? "");

  return {
    rows,
    peerRows,
    hasLive: !!json.hasLive,
    anchorDateKey: json.anchorDateKey ?? params.anchorDateKey ?? null,
    range: { startKey, endKey },
  };
}

export async function fetchGamesWindowShared(
  params: FetchGamesWindowParams
): Promise<FetchGamesWindowResult> {
  const key = buildGamesWindowCacheKey(params);
  const force = params.force === true;

  if (!force) {
    const hit = resultCache.get(key);
    if (hit && Date.now() - hit.at < GAMES_WINDOW_FETCH_TTL_MS) {
      if (params.signal?.aborted) {
        throw abortError();
      }
      return hit.value;
    }
    const pending = resultInflight.get(key);
    if (pending) {
      if (params.signal?.aborted) {
        throw abortError();
      }
      return pending;
    }
  }

  const promise = fetchGamesWindowNetwork(params)
    .then((value) => {
      resultCache.set(key, { at: Date.now(), value });
      return value;
    })
    .finally(() => {
      resultInflight.delete(key);
    });

  resultInflight.set(key, promise);
  return promise;
}
