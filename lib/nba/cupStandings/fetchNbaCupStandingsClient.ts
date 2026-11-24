import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";
import type { NbaCupStandingsApiPayload } from "./nbaCupStandingsTypes";

export type FetchNbaCupStandingsOptions = {
  apiBaseUrl?: string | null;
  season?: string;
  signal?: AbortSignal;
};

function buildUrl(base: string, season: string): string {
  const root = base.replace(/\/$/, "");
  const qs = new URLSearchParams({ season });
  return `${root}/api/nba/cup-standings?${qs.toString()}`;
}

/** Firestore スナップショット読み取り。プロバイダ API ではない */
export async function fetchNbaCupStandings(
  options: FetchNbaCupStandingsOptions = {}
): Promise<NbaCupStandingsApiPayload> {
  const season = (options.season ?? CURRENT_NBA_SEASON_KEY).trim();
  const base = (options.apiBaseUrl ?? "").trim();
  const path = `/api/nba/cup-standings?${new URLSearchParams({ season })}`;

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
    NbaCupStandingsApiPayload & { error?: string }
  >;

  if (!res.ok || !data.ok || !data.board) {
    throw new Error(
      data.error || res.statusText || `nba cup standings (${res.status})`
    );
  }

  return data as NbaCupStandingsApiPayload;
}
