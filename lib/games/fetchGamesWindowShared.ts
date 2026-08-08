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
};

export async function fetchGamesWindowShared(
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
  if (params.signal) {
    if (params.signal.aborted) controller.abort();
    else {
      params.signal.addEventListener("abort", () => controller.abort(), {
        once: true,
      });
    }
  }

  let res: Response;
  try {
    res = await fetch(url, {
      method: "GET",
      cache: "default",
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
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
