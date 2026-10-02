import {
  appTeamIdFromBdlAbbreviation,
  appTeamIdFromBdlTeamId,
  rememberBdlTeamId,
} from "@/lib/nba/bdl/bdlNbaTeamIdMap";
import type { BdlStandingsRow } from "@/lib/nba/bdl/fetchBdlStandings";
import { NBA_TEAM_NAME_BY_ID } from "@/lib/nba-team-names";
import type { NbaConferenceId } from "@/lib/nba/nbaConferenceTeams";
import {
  EMPTY_NBA_CONFERENCE_STANDINGS,
  standingsEnrichmentFromTeamDoc,
  type NbaConferenceStandingsBoard,
  type NbaConferenceStandingsRow,
  type NbaStandingsWl,
} from "@/lib/nba/nbaConferenceStandings";

function parseWlRecord(raw: string | null | undefined): NbaStandingsWl {
  const m = String(raw ?? "")
    .trim()
    .match(/^(\d+)\s*-\s*(\d+)$/);
  if (!m) return { wins: 0, losses: 0 };
  return { wins: Number(m[1]), losses: Number(m[2]) };
}

function conferenceFromBdl(raw: string | null | undefined): NbaConferenceId | null {
  const c = String(raw ?? "").trim().toLowerCase();
  if (c === "east") return "east";
  if (c === "west") return "west";
  return null;
}

function appTeamIdFromBdlStandingsRow(row: BdlStandingsRow): string | null {
  const team = row.team;
  if (!team?.id) return null;
  if (team.abbreviation) {
    return (
      rememberBdlTeamId(team.id, team.abbreviation) ??
      appTeamIdFromBdlAbbreviation(team.abbreviation)
    );
  }
  return appTeamIdFromBdlTeamId(team.id);
}

function mapBdlStandingsRow(row: BdlStandingsRow): NbaConferenceStandingsRow | null {
  const teamId = appTeamIdFromBdlStandingsRow(row);
  if (!teamId) return null;
  const conf = conferenceFromBdl(row.team?.conference);
  if (!conf) return null;

  const wins = Math.max(0, Math.trunc(Number(row.wins ?? 0)));
  const losses = Math.max(0, Math.trunc(Number(row.losses ?? 0)));
  const gp = wins + losses;
  const rank = Math.max(1, Math.trunc(Number(row.conference_rank ?? 99)));

  return {
    teamId,
    teamName:
      NBA_TEAM_NAME_BY_ID[teamId] ||
      String(row.team?.full_name ?? row.team?.name ?? teamId).trim(),
    conference: conf,
    rank,
    wins,
    losses,
    winPct: gp > 0 ? wins / gp : 0,
    streak: { kind: "W", count: 0 },
    last10: { wins: 0, losses: 0 },
    home: parseWlRecord(row.home_record),
    away: parseWlRecord(row.road_record),
  };
}

/** BDL が conference_rank を返さない季の公式最終シード（BDL season year → 1 位から） */
const NBA_CURATED_FINAL_CONFERENCE_ORDER: Readonly<
  Record<number, Readonly<Record<NbaConferenceId, readonly string[]>>>
> = {
  2020: {
    east: [
      "nba-76ers",
      "nba-nets",
      "nba-bucks",
      "nba-knicks",
      "nba-hawks",
      "nba-heat",
      "nba-celtics",
      "nba-wizards",
      "nba-pacers",
      "nba-hornets",
      "nba-bulls",
      "nba-raptors",
      "nba-cavaliers",
      "nba-magic",
      "nba-pistons",
    ],
    west: [
      "nba-jazz",
      "nba-suns",
      "nba-nuggets",
      "nba-clippers",
      "nba-mavericks",
      "nba-blazers",
      "nba-lakers",
      "nba-warriors",
      "nba-grizzlies",
      "nba-spurs",
      "nba-pelicans",
      "nba-kings",
      "nba-timberwolves",
      "nba-thunder",
      "nba-rockets",
    ],
  },
};

export function buildConferenceStandingsBoardFromBdl(
  rows: BdlStandingsRow[]
): NbaConferenceStandingsBoard {
  const east: NbaConferenceStandingsRow[] = [];
  const west: NbaConferenceStandingsRow[] = [];
  const confPctByTeam = new Map<string, number>();

  for (const row of rows) {
    const mapped = mapBdlStandingsRow(row);
    if (!mapped) continue;
    const conf = parseWlRecord(row.conference_record);
    const confGp = conf.wins + conf.losses;
    confPctByTeam.set(mapped.teamId, confGp > 0 ? conf.wins / confGp : 0);
    if (mapped.conference === "east") east.push(mapped);
    else west.push(mapped);
  }

  const seasonYear = Number(rows[0]?.season);
  const curatedOrder = Number.isFinite(seasonYear)
    ? NBA_CURATED_FINAL_CONFERENCE_ORDER[seasonYear]
    : undefined;

  // BDL は季によって conference_rank が全件 0（例: 2020-21）。重複・欠番なら curated 公式順位 → 勝率→カンファ勝率で振り直す
  const sortSide = (
    side: NbaConferenceStandingsRow[],
    conference: NbaConferenceId
  ) => {
    const ranksValid =
      new Set(side.map((r) => r.rank)).size === side.length &&
      side.every((r) => r.rank >= 1 && r.rank <= side.length);
    if (ranksValid) {
      return [...side].sort(
        (a, b) => a.rank - b.rank || a.teamId.localeCompare(b.teamId)
      );
    }
    const order = curatedOrder?.[conference];
    if (order && side.every((r) => order.includes(r.teamId))) {
      return [...side]
        .sort((a, b) => order.indexOf(a.teamId) - order.indexOf(b.teamId))
        .map((r, i) => ({ ...r, rank: i + 1 }));
    }
    return [...side]
      .sort(
        (a, b) =>
          b.winPct - a.winPct ||
          (confPctByTeam.get(b.teamId) ?? 0) -
            (confPctByTeam.get(a.teamId) ?? 0) ||
          a.teamId.localeCompare(b.teamId)
      )
      .map((r, i) => ({ ...r, rank: i + 1 }));
  };

  const board = {
    east: sortSide(east, "east"),
    west: sortSide(west, "west"),
  };

  if (board.east.length === 0 && board.west.length === 0) {
    return EMPTY_NBA_CONFERENCE_STANDINGS;
  }
  return board;
}

/** BDL 本体は W–L / HOME / AWAY。L10・連勝は ingest 時に game logs で補完（旧: teams） */
export function enrichConferenceStandingsFromTeamDocs(
  board: NbaConferenceStandingsBoard,
  teamDocs: readonly Record<string, unknown>[]
): NbaConferenceStandingsBoard {
  const byId = new Map(
    teamDocs
      .map((doc) => {
        const id = typeof doc.id === "string" ? doc.id.trim() : "";
        return id ? ([id, doc] as const) : null;
      })
      .filter((x): x is readonly [string, Record<string, unknown>] => x != null)
  );

  const enrichSide = (rows: NbaConferenceStandingsRow[]) =>
    rows.map((row) => {
      const team = byId.get(row.teamId);
      if (!team) return row;
      const extra = standingsEnrichmentFromTeamDoc(team);
      return {
        ...row,
        last10: extra.last10,
        streak: extra.streak,
      };
    });

  return {
    east: enrichSide(board.east),
    west: enrichSide(board.west),
  };
}
