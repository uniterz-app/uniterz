import type {
  LeagueHubLineup,
  LeagueHubLineupBoard,
  LeagueHubPlayerMatchup,
  NbaLeagueHubDoc,
} from "@/lib/nba/leagueHub/leagueHubTypes";

export type LeagueHubMatchupsDetail = {
  seasonKey: string;
  players: Record<string, { matchups?: LeagueHubPlayerMatchup[]; guardedBy?: LeagueHubPlayerMatchup[] }>;
};

export type LeagueHubLineupsDetail = {
  seasonKey: string;
  teams: Record<string, { lineups?: LeagueHubLineup[]; lineupBoards?: LeagueHubLineupBoard[] }>;
};

export function leagueHubDetailDocIds(seasonKey: string) {
  return { matchups: `${seasonKey}_matchups`, lineups: `${seasonKey}_lineups` };
}

/** 本体から選手のマッチアップとチームのラインナップを抜く */
export function splitLeagueHubDetail(hub: NbaLeagueHubDoc): {
  main: NbaLeagueHubDoc;
  matchups: LeagueHubMatchupsDetail;
  lineups: LeagueHubLineupsDetail;
} {
  const matchups: LeagueHubMatchupsDetail = { seasonKey: hub.seasonKey, players: {} };
  const lineups: LeagueHubLineupsDetail = { seasonKey: hub.seasonKey, teams: {} };
  const players = hub.players.map(({ matchups: m, guardedBy: g, ...rest }) => {
    if (m || g) {
      matchups.players[rest.playerId] = { ...(m ? { matchups: m } : {}), ...(g ? { guardedBy: g } : {}) };
    }
    return rest;
  });
  const teams = hub.teams.map(({ lineups: l, lineupBoards: b, ...rest }) => {
    if (l || b) {
      lineups.teams[rest.teamId] = { ...(l ? { lineups: l } : {}), ...(b ? { lineupBoards: b } : {}) };
    }
    return rest;
  });
  return { main: { ...hub, players, teams }, matchups, lineups };
}

/** 別 doc の中身を本体に戻す（本体に既にある値は上書きしない＝分割前の古い doc もそのまま読める） */
export function mergeLeagueHubDetail(
  hub: NbaLeagueHubDoc,
  matchups: LeagueHubMatchupsDetail | null,
  lineups: LeagueHubLineupsDetail | null
): NbaLeagueHubDoc {
  if (!matchups && !lineups) return hub;
  return {
    ...hub,
    players: hub.players.map((p) => {
      const d = matchups?.players?.[p.playerId];
      return d ? { ...d, ...p } : p;
    }),
    teams: hub.teams.map((t) => {
      const d = lineups?.teams?.[t.teamId];
      return d ? { ...d, ...t } : t;
    }),
  };
}
