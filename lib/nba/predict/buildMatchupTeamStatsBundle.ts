/**
 * リーグチーム表 + 試合ログ → 予想 STATS タブ用 NbaTeamStatsBundle。
 * 当該 home/away の行だけ使う（他チームのモックは使わない）。
 *
 * Last 10 は box 由来（ratings + FG%/3P% など）。UI 表示はパネル側で絞る。
 */
import { getNbaTeamNicknameById } from "@/lib/nba-team-names";
import type { NbaLeagueTeamStatRow } from "@/lib/predict/nbaLeagueTeamStatsMocks";
import type { NbaTeamGameLogSlice } from "@/lib/nba/teamGameLog/teamGameLogTypes";
import type {
  NbaTeamFormGame,
  NbaTeamStatSide,
  NbaTeamStatsBundle,
} from "@/lib/predict/nbaTeamStatsPreviewMocks";
import { emptyTeamStatsBundle } from "@/lib/predict/nbaTeamStatsPreviewMocks";

type RankKey = keyof NonNullable<NbaTeamStatSide["ranks"]>;

const RANK_METRICS: RankKey[] = [
  "ppg",
  "papg",
  "diff",
  "ortg",
  "drtg",
  "netrtg",
  "pace",
  "fgPct",
  "fg3Pct",
  "efgPct",
  "ftPct",
  "tovPct",
];

function numField(
  row: NbaLeagueTeamStatRow | undefined,
  key: string
): number {
  if (!row) return 0;
  const v = (row as unknown as Record<string, unknown>)[key];
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}

function rankMap(
  rows: NbaLeagueTeamStatRow[],
  metric: RankKey,
  higherIsBetter: boolean
): Map<string, number> {
  const scored = rows
    .map((r) => ({
      teamId: r.teamId,
      value: numField(r, metric),
    }))
    .filter((r) => Number.isFinite(r.value) && (r.value !== 0 || metric === "diff" || metric === "netrtg"));
  scored.sort((a, b) =>
    higherIsBetter ? b.value - a.value : a.value - b.value
  );
  const out = new Map<string, number>();
  scored.forEach((row, i) => out.set(row.teamId, i + 1));
  return out;
}

function ranksForTeam(
  rows: NbaLeagueTeamStatRow[],
  teamId: string
): NbaTeamStatSide["ranks"] {
  const higher: RankKey[] = [
    "ppg",
    "diff",
    "ortg",
    "netrtg",
    "pace",
    "fgPct",
    "fg3Pct",
    "efgPct",
    "ftPct",
  ];
  const lower: RankKey[] = ["papg", "drtg", "tovPct"];
  const ranks: NonNullable<NbaTeamStatSide["ranks"]> = {};
  for (const m of RANK_METRICS) {
    const map = rankMap(rows, m, higher.includes(m) && !lower.includes(m));
    const r = map.get(teamId);
    if (r != null) ranks[m] = r;
  }
  return ranks;
}

function formResultsFromLog(
  log: NbaTeamGameLogSlice | null | undefined
): Array<"W" | "L"> {
  if (!log?.recentGames?.length) return [];
  return [...log.recentGames]
    .reverse()
    .map((g) => g.result)
    .filter((r): r is "W" | "L" => r === "W" || r === "L");
}

/** recentGames は新しい→古い。先頭 5 件。 */
function recentFormGamesFromLog(
  log: NbaTeamGameLogSlice | null | undefined
): NbaTeamFormGame[] {
  if (!log?.recentGames?.length) return [];
  return log.recentGames.slice(0, 5).map((g) => ({
    dateLabel: g.dateLabel,
    ...(g.gameId ? { gameId: g.gameId } : null),
    oppAbbr: g.oppAbbr,
    home: g.home,
    teamScore: g.teamScore,
    oppScore: g.oppScore,
    result: g.result,
  }));
}

function sideFromSources(input: {
  teamId: string;
  row: NbaLeagueTeamStatRow | undefined;
  allRows: NbaLeagueTeamStatRow[];
  log: NbaTeamGameLogSlice | null | undefined;
  window: "season" | "last10";
}): NbaTeamStatSide {
  const { teamId, row, allRows, log, window } = input;
  const nick = getNbaTeamNicknameById(teamId);
  const ranks = row ? ranksForTeam(allRows, teamId) : undefined;

  const homeW = log?.homeAwaySplit.home.wins ?? 0;
  const homeL = log?.homeAwaySplit.home.losses ?? 0;
  const awayW = log?.homeAwaySplit.away.wins ?? 0;
  const awayL = log?.homeAwaySplit.away.losses ?? 0;

  const formW =
    window === "last10"
      ? (log?.last10Record.wins ?? row?.wins ?? 0)
      : (log?.seasonRecord.wins ?? row?.wins ?? 0);
  const formL =
    window === "last10"
      ? (log?.last10Record.losses ?? row?.losses ?? 0)
      : (log?.seasonRecord.losses ?? row?.losses ?? 0);

  const recentFormGames = recentFormGamesFromLog(log);

  return {
    teamId,
    teamName: row?.teamName || nick,
    ppg: row?.ppg ?? 0,
    papg: row?.papg ?? 0,
    diff: row?.diff ?? 0,
    ortg: row?.ortg ?? 0,
    drtg: row?.drtg ?? 0,
    netrtg: row?.netrtg ?? 0,
    pace: row?.pace ?? 0,
    fgPct: numField(row, "fgPct") || undefined,
    fg3Pct: row?.fg3Pct || undefined,
    efgPct: row?.efgPct || undefined,
    ftPct: numField(row, "ftPct") || undefined,
    tovPct: row?.tovPct || undefined,
    homeW,
    homeL,
    awayW,
    awayL,
    formW: window === "last10" ? formW : undefined,
    formL: window === "last10" ? formL : undefined,
    formResults:
      window === "last10" ? formResultsFromLog(log) : undefined,
    recentFormGames:
      recentFormGames.length > 0 ? recentFormGames : undefined,
    ranks,
  };
}

export function buildMatchupTeamStatsBundle(input: {
  homeTeamId: string;
  awayTeamId: string;
  seasonRows: NbaLeagueTeamStatRow[];
  last10Rows: NbaLeagueTeamStatRow[];
  homeLog?: NbaTeamGameLogSlice | null;
  awayLog?: NbaTeamGameLogSlice | null;
}): NbaTeamStatsBundle {
  const homeId = input.homeTeamId.trim();
  const awayId = input.awayTeamId.trim();
  if (!homeId || !awayId) {
    return emptyTeamStatsBundle(homeId || "home", awayId || "away");
  }

  const seasonHome = input.seasonRows.find((r) => r.teamId === homeId);
  const seasonAway = input.seasonRows.find((r) => r.teamId === awayId);
  const last10Home = input.last10Rows.find((r) => r.teamId === homeId);
  const last10Away = input.last10Rows.find((r) => r.teamId === awayId);

  const hasAny =
    Boolean(seasonHome || seasonAway || last10Home || last10Away) ||
    Boolean(input.homeLog?.finalCount || input.awayLog?.finalCount);
  if (!hasAny) {
    return emptyTeamStatsBundle(homeId, awayId);
  }

  return {
    season: {
      home: sideFromSources({
        teamId: homeId,
        row: seasonHome,
        allRows: input.seasonRows,
        log: input.homeLog,
        window: "season",
      }),
      away: sideFromSources({
        teamId: awayId,
        row: seasonAway,
        allRows: input.seasonRows,
        log: input.awayLog,
        window: "season",
      }),
    },
    last10: {
      home: sideFromSources({
        teamId: homeId,
        row: last10Home,
        allRows: input.last10Rows,
        log: input.homeLog,
        window: "last10",
      }),
      away: sideFromSources({
        teamId: awayId,
        row: last10Away,
        allRows: input.last10Rows,
        log: input.awayLog,
        window: "last10",
      }),
    },
  };
}
