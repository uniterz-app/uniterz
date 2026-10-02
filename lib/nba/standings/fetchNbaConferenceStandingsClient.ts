import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";
import type { NbaConferenceStandingsApiPayload } from "./nbaConferenceStandingsTypes";

export type FetchNbaConferenceStandingsOptions = {
  apiBaseUrl?: string | null;
  season?: string;
  signal?: AbortSignal;
};

function buildUrl(base: string, season: string): string {
  const root = base.replace(/\/$/, "");
  const qs = new URLSearchParams({ season });
  return `${root}/api/nba/standings?${qs.toString()}`;
}

/** Uniterz の Firestore スナップショット読み取り。プロバイダ API ではない */
export async function fetchNbaConferenceStandings(
  options: FetchNbaConferenceStandingsOptions = {}
): Promise<NbaConferenceStandingsApiPayload> {
  const season = (options.season ?? CURRENT_NBA_SEASON_KEY).trim();
  const base = (options.apiBaseUrl ?? "").trim();
  const path = `/api/nba/standings?${new URLSearchParams({ season })}`;

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
    NbaConferenceStandingsApiPayload & { error?: string }
  >;

  if (!res.ok || !data.ok || !data.board) {
    throw new Error(
      data.error || res.statusText || `nba standings (${res.status})`
    );
  }

  return data as NbaConferenceStandingsApiPayload;
}
