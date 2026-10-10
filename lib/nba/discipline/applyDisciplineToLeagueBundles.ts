/**
 * `nbaDiscipline/{season}` をリーグ表の bundle に重ねる（公開 API の読み時）。
 * 規律系はシーズン累計なので PER GAME / TOTAL で同じ値（`leagueStatsTableTabs` でスケールしない）。
 */
import { nbaConferenceForTeam } from "@/lib/nba/nbaConferenceTeams";
import type {
  NbaDisciplineCounts,
  NbaDisciplineSnapshot,
} from "@/lib/nba/discipline/disciplineTypes";
import type {
  NbaLeagueTeamStatRow,
  NbaLeagueTeamStatsBundle,
} from "@/lib/predict/nbaLeagueTeamStatsMocks";
import type {
  NbaPlayerLeaderMetricId,
  NbaPlayerStatLeaderRow,
  NbaPlayerStatLeadersBundle,
} from "@/lib/predict/nbaPlayerStatLeadersMocks";

const PLAYER_BOARD_LIMIT = 30;

export const NBA_PLAYER_DISCIPLINE_METRICS = [
  ["technical_fouls", "tech"],
  ["flagrant_fouls", "flag"],
  ["ejections", "eject"],
  ["fines_usd", "fines"],
] as const satisfies ReadonlyArray<
  readonly [NbaPlayerLeaderMetricId, keyof NbaDisciplineCounts]
>;

export const NBA_TEAM_DISCIPLINE_METRICS = [
  ["techFouls", "tech"],
  ["flagrantFouls", "flag"],
  ["ejections", "eject"],
  ["finesUsd", "fines"],
] as const satisfies ReadonlyArray<
  readonly [keyof NbaLeagueTeamStatRow, keyof NbaDisciplineCounts]
>;

function applyTeamRows(
  rows: readonly NbaLeagueTeamStatRow[],
  snapshot: NbaDisciplineSnapshot,
  phase: "regular" | "playoffs"
): NbaLeagueTeamStatRow[] {
  return rows.map((row) => {
    const counts = snapshot.teams[row.teamId]?.[phase];
    const next = { ...row };
    for (const [field, key] of NBA_TEAM_DISCIPLINE_METRICS) {
      (next as Record<string, unknown>)[field] = counts?.[key] ?? 0;
    }
    return next;
  });
}

export function applyDisciplineToLeagueTeamBundle(
  bundle: NbaLeagueTeamStatsBundle,
  snapshot: NbaDisciplineSnapshot | null
): NbaLeagueTeamStatsBundle {
  if (!snapshot) return bundle;
  return {
    ...bundle,
    season: applyTeamRows(bundle.season, snapshot, "regular"),
    playoffs: applyTeamRows(bundle.playoffs ?? [], snapshot, "playoffs"),
  };
}

type Board = Record<NbaPlayerLeaderMetricId, NbaPlayerStatLeaderRow[]>;

/** 既存ボードから出場数を拾う（規律ボードの GP 列用） */
function gamesPlayedIndex(board: Board): Map<string, number> {
  const out = new Map<string, number>();
  for (const rows of Object.values(board)) {
    for (const row of rows ?? []) {
      const prev = out.get(row.playerId) ?? 0;
      if (row.gamesPlayed > prev) out.set(row.playerId, row.gamesPlayed);
    }
  }
  return out;
}

function disciplineBoards(
  board: Board,
  snapshot: NbaDisciplineSnapshot,
  phase: "regular" | "playoffs"
): Board {
  const gp = gamesPlayedIndex(board);
  const next = { ...board };
  for (const [metric, key] of NBA_PLAYER_DISCIPLINE_METRICS) {
    const rows: NbaPlayerStatLeaderRow[] = [];
    for (const [playerId, p] of Object.entries(snapshot.players)) {
      const value = p[phase][key];
      if (!(value > 0) || !p.teamId) continue;
      rows.push({
        playerId,
        playerName: p.name,
        teamId: p.teamId,
        conference: nbaConferenceForTeam(p.teamId) ?? "west",
        gamesPlayed:
          (phase === "regular" && p.gamesPlayed > 0 ? p.gamesPlayed : null) ??
          gp.get(playerId) ??
          0,
        value,
      });
    }
    next[metric] = rows
      .sort((a, b) => b.value - a.value || a.playerName.localeCompare(b.playerName))
      .slice(0, PLAYER_BOARD_LIMIT);
  }
  return next;
}

export function applyDisciplineToPlayerLeadersBundle(
  bundle: NbaPlayerStatLeadersBundle,
  snapshot: NbaDisciplineSnapshot | null
): NbaPlayerStatLeadersBundle {
  if (!snapshot) return bundle;
  return {
    ...bundle,
    season: disciplineBoards(bundle.season, snapshot, "regular"),
    playoffs: disciplineBoards(bundle.playoffs, snapshot, "playoffs"),
  };
}
