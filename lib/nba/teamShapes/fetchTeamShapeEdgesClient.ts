/**
 * GET /api/nba/team-shape-records — チーム詳細 EDGE 用。
 * 今季に edges が無ければ前期シーズンを試す（開幕前・dev 確認用）。
 */
import {
  CURRENT_NBA_SEASON_KEY,
  previousNbaSeasonKey,
} from "@/lib/rankings/nbaSeason";
import type { NbaTeamShapeRecordsApiPayload } from "@/lib/nba/teamShapes/loadTeamShapeRecordsApi";
import type { TeamShapeId } from "@/lib/nba/teamShapes/shapeDefs";

export type NbaTeamDetailShapeEdge = {
  kind: "strength" | "weakness";
  shapeId: TeamShapeId;
  labelEn: string;
  labelJa: string;
  conditionEn: string;
  conditionJa: string;
  when: string;
  games: number;
  winPct: number;
  deltaWinPct: number;
};

export type NbaTeamDetailShapeEdges = {
  season: string;
  /** true = 今季が空で前期を表示中 */
  fromPriorSeason: boolean;
  edges: NbaTeamDetailShapeEdge[];
};

export type FetchTeamShapeEdgesOptions = {
  apiBaseUrl?: string | null;
  season?: string;
  teamId: string;
  signal?: AbortSignal;
  /** false なら前期フォールバックしない */
  allowPriorFallback?: boolean;
};

function root(base: string | null | undefined): string {
  return (base ?? "").replace(/\/$/, "");
}

async function fetchPayload(
  apiBaseUrl: string | null | undefined,
  season: string,
  teamId: string,
  signal?: AbortSignal
): Promise<NbaTeamShapeRecordsApiPayload | null> {
  const qs = new URLSearchParams({ season, team: teamId });
  const path = `/api/nba/team-shape-records?${qs.toString()}`;
  const url = root(apiBaseUrl) ? `${root(apiBaseUrl)}${path}` : path;
  const res = await fetch(url, { method: "GET", signal });
  const data = (await res.json().catch(() => ({}))) as Partial<
    NbaTeamShapeRecordsApiPayload & { ok?: boolean; error?: string }
  >;
  if (!res.ok || !data.ok) return null;
  return data as NbaTeamShapeRecordsApiPayload;
}

function edgesFromPayload(
  payload: NbaTeamShapeRecordsApiPayload | null,
  teamId: string
): NbaTeamDetailShapeEdge[] {
  if (!payload?.teams?.length) return [];
  const row = payload.teams.find((t) => t.teamId === teamId);
  if (!row?.edges?.length) return [];
  return row.edges.map((e) => ({
    kind: e.kind,
    shapeId: e.shapeId,
    labelEn: e.labelEn,
    labelJa: e.labelJa,
    conditionEn: e.conditionEn,
    conditionJa: e.conditionJa ?? e.conditionEn,
    when: e.when,
    games: e.games,
    winPct: e.winPct,
    deltaWinPct: e.deltaWinPct,
  }));
}

export async function fetchTeamShapeEdges(
  options: FetchTeamShapeEdgesOptions
): Promise<NbaTeamDetailShapeEdges> {
  const season = (options.season ?? CURRENT_NBA_SEASON_KEY).trim();
  const teamId = options.teamId.trim();
  const empty: NbaTeamDetailShapeEdges = {
    season,
    fromPriorSeason: false,
    edges: [],
  };
  if (!teamId) return empty;

  const current = await fetchPayload(
    options.apiBaseUrl,
    season,
    teamId,
    options.signal
  );
  const currentEdges = edgesFromPayload(current, teamId);
  if (currentEdges.length > 0) {
    return {
      season,
      fromPriorSeason: false,
      edges: currentEdges,
    };
  }

  if (options.allowPriorFallback === false) return empty;

  const prior = previousNbaSeasonKey(season);
  const priorPayload = await fetchPayload(
    options.apiBaseUrl,
    prior,
    teamId,
    options.signal
  );
  const priorEdges = edgesFromPayload(priorPayload, teamId);
  if (priorEdges.length === 0) return empty;
  return {
    season: prior,
    fromPriorSeason: true,
    edges: priorEdges,
  };
}
