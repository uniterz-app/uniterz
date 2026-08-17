/**
 * 共通 teams 一覧 API クライアント（Web / Native）。
 */

import type { League } from "@/lib/leagues";
import { reviveGameDocs } from "@/lib/games/gameDocJson";

export type FetchTeamsByLeagueParams = {
  league: League;
  apiBaseUrl?: string | null;
  signal?: AbortSignal;
};

export async function fetchTeamsByLeagueShared(
  params: FetchTeamsByLeagueParams
): Promise<Record<string, unknown>[]> {
  const q = new URLSearchParams({ league: params.league });
  const base = (params.apiBaseUrl ?? "").replace(/\/$/, "");
  const url = `${base}/api/teams?${q.toString()}`;
  const res = await fetch(url, { method: "GET", cache: "default", signal: params.signal });
  const json = (await res.json().catch(() => null)) as {
    ok?: boolean;
    teams?: Record<string, unknown>[];
    error?: string;
  } | null;
  if (!res.ok || !json?.ok) {
    throw new Error(json?.error ?? `teams_http_${res.status}`);
  }
  return reviveGameDocs(json.teams ?? []);
}
