import type { NbaLeagueHubApiPayload } from "@/lib/nba/leagueHub/leagueHubTypes";

/** 認証不要・共有スナップショット（常に今季） */
export async function fetchNbaLeagueHub(options: {
  apiBaseUrl?: string | null;
  signal?: AbortSignal;
}): Promise<NbaLeagueHubApiPayload> {
  const base = (options.apiBaseUrl ?? "").trim().replace(/\/$/, "");
  const res = await fetch(`${base}/api/nba/league-hub`, {
    method: "GET",
    signal: options.signal,
  });
  const data = (await res.json().catch(() => ({}))) as Partial<
    NbaLeagueHubApiPayload & { error?: string }
  >;
  if (!res.ok || !data.ok) {
    throw new Error(data.error || res.statusText || `league hub (${res.status})`);
  }
  return data as NbaLeagueHubApiPayload;
}
