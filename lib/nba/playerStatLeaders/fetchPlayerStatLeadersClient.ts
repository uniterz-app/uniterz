import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";
import type { NbaPlayerStatLeadersApiPayload } from "./playerStatLeadersTypes";

export type FetchPlayerStatLeadersOptions = {
  /** Native: `getUniterzApiBaseUrl()`。Web クライアントは省略で同一オリジン */
  apiBaseUrl?: string | null;
  season?: string;
  signal?: AbortSignal;
};

function buildUrl(base: string, season: string): string {
  const root = base.replace(/\/$/, "");
  const qs = new URLSearchParams({ season });
  return `${root}/api/nba/league-player-stats?${qs.toString()}`;
}

/** 認証不要・共有スナップショット */
export async function fetchPlayerStatLeaders(
  options: FetchPlayerStatLeadersOptions = {}
): Promise<NbaPlayerStatLeadersApiPayload> {
  const season = (options.season ?? CURRENT_NBA_SEASON_KEY).trim();
  const base = (options.apiBaseUrl ?? "").trim();
  const path = `/api/nba/league-player-stats?${new URLSearchParams({ season })}`;

  let res: Response;
  try {
    res = await fetch(base ? buildUrl(base, season) : path, {
      method: "GET",
      signal: options.signal,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "fetch failed";
    throw new Error(msg);
  }

  const data = (await res.json().catch(() => ({}))) as Partial<
    NbaPlayerStatLeadersApiPayload & { error?: string }
  >;

  if (!res.ok || !data.ok || !data.bundle) {
    throw new Error(
      data.error || res.statusText || `league player stats (${res.status})`
    );
  }

  return data as NbaPlayerStatLeadersApiPayload;
}
