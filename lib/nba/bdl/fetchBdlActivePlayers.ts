/**
 * BDL active players → チーム別ロスター行。
 * スタッツは持たない（開幕前は 0。後で averages を載せる）。
 */

import { bdlNbaGetAllPages } from "@/lib/nba/bdl/bdlNbaFetch";
import {
  appTeamIdFromBdlAbbreviation,
  rememberBdlTeamId,
} from "@/lib/nba/bdl/bdlNbaTeamIdMap";
import { NBA_TEAM_NAME_BY_ID } from "@/lib/nba-team-names";
import type { NbaRosterPlayer } from "@/lib/predict/nbaRoster";
import { playerCardName } from "@/lib/predict/nbaRoster";

export type BdlActivePlayer = {
  id: number;
  first_name?: string;
  last_name?: string;
  position?: string | null;
  jersey_number?: string | null;
  team?: {
    id?: number;
    abbreviation?: string;
    conference?: string;
    full_name?: string;
  };
};

export type BdlPlayerTeamRef = {
  playerId: string;
  playerName: string;
  teamId: string;
  bdlTeamId: number | null;
};

export type NbaTeamRosterSnapshot = {
  teamId: string;
  teamName: string;
  players: NbaRosterPlayer[];
};

const POSITION_RANK: Record<string, number> = {
  G: 0,
  "G-F": 1,
  "F-G": 1,
  F: 2,
  "F-C": 3,
  "C-F": 3,
  C: 4,
};

function positionRank(pos: string): number {
  const key = pos.trim().toUpperCase();
  return POSITION_RANK[key] ?? 5;
}

function zeroedRosterPlayer(p: BdlActivePlayer): NbaRosterPlayer {
  const first = (p.first_name ?? "").trim();
  const last = (p.last_name ?? "").trim();
  const position = (p.position ?? "").trim() || "—";
  return {
    id: p.id,
    firstName: first || "Player",
    lastName: last || String(p.id),
    position,
    jerseyNumber: p.jersey_number?.trim() || null,
    starter: false,
    gp: 0,
    mpg: 0,
    ppg: 0,
    rpg: 0,
    apg: 0,
    fgPct: 0,
    fg3Pct: 0,
    ftPct: 0,
    fgm: 0,
    fga: 0,
    fg3m: 0,
    fg3a: 0,
    ftm: 0,
    fta: 0,
    spg: 0,
    bpg: 0,
    tpg: 0,
  };
}

function sortActiveRosterPlayers(
  players: NbaRosterPlayer[]
): NbaRosterPlayer[] {
  return [...players].sort((a, b) => {
    const byPos = positionRank(a.position) - positionRank(b.position);
    if (byPos !== 0) return byPos;
    return playerCardName(a).localeCompare(playerCardName(b));
  });
}

/** 現役ロスター全件 */
export async function fetchBdlActivePlayers(): Promise<BdlActivePlayer[]> {
  return bdlNbaGetAllPages<BdlActivePlayer>(`/nba/v1/players/active`, {});
}

/** 現役ロスター → playerId → アプリ teamId（リーダー表 ingest 用） */
export async function fetchBdlActivePlayerTeamMap(): Promise<
  Map<string, BdlPlayerTeamRef>
> {
  const rows = await fetchBdlActivePlayers();
  const out = new Map<string, BdlPlayerTeamRef>();
  for (const p of rows) {
    if (p?.id == null) continue;
    const abbr = p.team?.abbreviation;
    const teamId =
      (p.team?.id != null
        ? rememberBdlTeamId(p.team.id, abbr)
        : null) ?? appTeamIdFromBdlAbbreviation(abbr);
    if (!teamId) continue;
    const first = p.first_name?.trim() ?? "";
    const last = p.last_name?.trim() ?? "";
    const playerName = `${first} ${last}`.trim() || `Player ${p.id}`;
    out.set(String(p.id), {
      playerId: String(p.id),
      playerName,
      teamId,
      bdlTeamId: typeof p.team?.id === "number" ? p.team.id : null,
    });
  }
  return out;
}

/** チーム別アクティブロスター（スタッツはすべて 0） */
export async function fetchBdlActivePlayersByTeam(): Promise<
  Map<string, NbaTeamRosterSnapshot>
> {
  const rows = await fetchBdlActivePlayers();
  const byTeam = new Map<string, NbaRosterPlayer[]>();
  const teamNameById = new Map<string, string>();

  for (const p of rows) {
    if (p?.id == null) continue;
    const abbr = p.team?.abbreviation;
    const teamId =
      (p.team?.id != null
        ? rememberBdlTeamId(p.team.id, abbr)
        : null) ?? appTeamIdFromBdlAbbreviation(abbr);
    if (!teamId) continue;

    if (!teamNameById.has(teamId)) {
      teamNameById.set(
        teamId,
        NBA_TEAM_NAME_BY_ID[teamId] ??
          p.team?.full_name?.trim() ??
          teamId
      );
    }
    const list = byTeam.get(teamId) ?? [];
    list.push(zeroedRosterPlayer(p));
    byTeam.set(teamId, list);
  }

  const out = new Map<string, NbaTeamRosterSnapshot>();
  for (const [teamId, players] of byTeam) {
    out.set(teamId, {
      teamId,
      teamName: teamNameById.get(teamId) ?? teamId,
      players: sortActiveRosterPlayers(players),
    });
  }
  return out;
}
