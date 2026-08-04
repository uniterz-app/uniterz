/**
 * 共通試合窓 API クライアント（Web / Native 共用）。
 * 予想・Pro は別。ここはカード共通データのみ。
 */

import type { League } from "@/lib/leagues";
import { reviveGameDocs } from "@/lib/games/gameDocJson";
import { GAMES_WINDOW_PLUS_MINUS_DEFAULT } from "@/lib/games/gamesWindowConstants";

export type FetchGamesWindowResult = {
  rows: Record<string, unknown>[];
  peerRows: Record<string, unknown>[];
  hasLive: boolean;
  anchorDateKey: string;
};

export type FetchGamesWindowParams = {
  league: League;
  anchorDateKey: string;
  timeZone: string;
  plusMinus?: number;
  /** Native: API origin。Web は省略で相対パス */
  apiBaseUrl?: string | null;
  signal?: AbortSignal;
};

export async function fetchGamesWindowShared(
  params: FetchGamesWindowParams
): Promise<FetchGamesWindowResult> {
  const plusMinus = params.plusMinus ?? GAMES_WINDOW_PLUS_MINUS_DEFAULT;
  const q = new URLSearchParams({
    league: params.league,
    anchor: params.anchorDateKey,
    tz: params.timeZone,
    pm: String(plusMinus),
  });
  const base = (params.apiBaseUrl ?? "").replace(/\/$/, "");
  const url = `${base}/api/games/window?${q.toString()}`;

  const res = await fetch(url, {
    method: "GET",
    // CDN / browser HTTP キャッシュを活かす
    cache: "default",
    signal: params.signal,
  });
  const json = (await res.json().catch(() => null)) as {
    ok?: boolean;
    rows?: Record<string, unknown>[];
    peerRows?: Record<string, unknown>[];
    hasLive?: boolean;
    anchorDateKey?: string;
    error?: string;
  } | null;

  if (!res.ok || !json?.ok) {
    throw new Error(json?.error ?? `games_window_http_${res.status}`);
  }

  const rows = reviveGameDocs(json.rows ?? []);
  const peerRows = reviveGameDocs(json.peerRows ?? rows);

  return {
    rows,
    peerRows,
    hasLive: !!json.hasLive,
    anchorDateKey: json.anchorDateKey ?? params.anchorDateKey,
  };
}
