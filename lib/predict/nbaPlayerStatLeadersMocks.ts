import {
  NBA_EAST_TEAM_IDS,
  NBA_WEST_TEAM_IDS,
  type NbaConferenceId as NbaConf,
} from "@/lib/nba/nbaConferenceTeams";
import { TEAM_SHORT } from "@/lib/team-short";
import {
  NBA_LEAGUE_ADVANCED_CATEGORIES,
  type NbaLeagueAdvancedCategory,
} from "@/lib/predict/nbaLeagueStatBoard";
import {
  buildPlayerAdvancedMetricValue,
  formatPlayerAdvancedLeaderValue,
  NBA_PLAYER_ADVANCED_LEADER_METRICS,
  playerAdvancedMetricDef,
  playerAdvancedMetricsForCategory,
  type NbaPlayerAdvancedLeaderMetric,
} from "@/lib/predict/nbaPlayerStatLeadersAdvanced";

/**
 * BallDontLie `GET /v1/leaders` の `stat_type` と同一 ID。
 * @see https://docs.balldontlie.io/
 */
export type NbaPlayerLeaderBdlStatType =
  | "pts"
  | "reb"
  | "ast"
  | "oreb"
  | "dreb"
  | "stl"
  | "blk"
  | "fg3m"
  | "fg3_pct"
  | "fg_pct"
  | "ft_pct"
  | "tov"
  | "min"
  | "eff"
  | "fg3a"
  | "fga"
  | "fgm"
  | "fta"
  | "ftm";

export type NbaPlayerLeaderMetricId =
  | NbaPlayerLeaderBdlStatType
  | NbaPlayerAdvancedLeaderMetric;

/** @deprecated 命名互換 — 実体は leaders / advanced 指標 ID */
export type NbaPlayerStatLeaderMetric = NbaPlayerLeaderMetricId;

export const NBA_BDL_PLAYER_LEADER_STAT_TYPES: readonly NbaPlayerLeaderBdlStatType[] =
  [
    "pts",
    "reb",
    "ast",
    "oreb",
    "dreb",
    "stl",
    "blk",
    "fg3m",
    "fg3_pct",
    "fg_pct",
    "ft_pct",
    "tov",
    "min",
    "eff",
    "fg3a",
    "fga",
    "fgm",
    "fta",
    "ftm",
  ] as const;

export type NbaPlayerStatLeaderRow = {
  playerId: string;
  playerName: string;
  teamId: string;
  conference: NbaConf;
  /** BallDontLie leaders `games_played` */
  gamesPlayed: number;
  value: number;
};

export type NbaPlayerStatLeadersBundle = {
  season: Record<NbaPlayerLeaderMetricId, NbaPlayerStatLeaderRow[]>;
  last10: Record<NbaPlayerLeaderMetricId, NbaPlayerStatLeaderRow[]>;
  asOfLabel: string;
};

export type NbaPlayerStatLeaderMetricKind =
  | "pct"
  | "perGame"
  | "minutes"
  | "eff";

export type NbaPlayerStatLeaderMetricDef = {
  id: NbaPlayerLeaderBdlStatType;
  label: string;
  short: string;
  higherIsBetter: boolean;
  hintJa: string;
  hintEn: string;
  kind: NbaPlayerStatLeaderMetricKind;
  /** 指標チップ行に出す（全 stat_type は bundle に保持） */
  showInChipBar: boolean;
};

export const NBA_PLAYER_STAT_LEADER_METRICS: readonly NbaPlayerStatLeaderMetricDef[] =
  [
    {
      id: "pts",
      label: "Points per Game",
      short: "PTS",
      higherIsBetter: true,
      hintJa: "1試合あたりの得点（PPG）。",
      hintEn: "Points per game.",
      kind: "perGame",
      showInChipBar: true,
    },
    {
      id: "reb",
      label: "Rebounds per Game",
      short: "REB",
      higherIsBetter: true,
      hintJa: "1試合あたりのリバウンド。",
      hintEn: "Rebounds per game.",
      kind: "perGame",
      showInChipBar: true,
    },
    {
      id: "ast",
      label: "Assists per Game",
      short: "AST",
      higherIsBetter: true,
      hintJa: "1試合あたりのアシスト。",
      hintEn: "Assists per game.",
      kind: "perGame",
      showInChipBar: true,
    },
    {
      id: "oreb",
      label: "Offensive Rebounds per Game",
      short: "ORB",
      higherIsBetter: true,
      hintJa: "1試合あたりのオフェンスリバウンド。",
      hintEn: "Offensive rebounds per game.",
      kind: "perGame",
      showInChipBar: true,
    },
    {
      id: "dreb",
      label: "Defensive Rebounds per Game",
      short: "DRB",
      higherIsBetter: true,
      hintJa: "1試合あたりのディフェンスリバウンド。",
      hintEn: "Defensive rebounds per game.",
      kind: "perGame",
      showInChipBar: true,
    },
    {
      id: "stl",
      label: "Steals per Game",
      short: "STL",
      higherIsBetter: true,
      hintJa: "1試合あたりのスティール。",
      hintEn: "Steals per game.",
      kind: "perGame",
      showInChipBar: true,
    },
    {
      id: "blk",
      label: "Blocks per Game",
      short: "BLK",
      higherIsBetter: true,
      hintJa: "1試合あたりのブロック。",
      hintEn: "Blocks per game.",
      kind: "perGame",
      showInChipBar: true,
    },
    {
      id: "fg3m",
      label: "3PM per Game",
      short: "3PM",
      higherIsBetter: true,
      hintJa: "1試合あたりの3PM。",
      hintEn: "Made threes per game.",
      kind: "perGame",
      showInChipBar: true,
    },
    {
      id: "fg3a",
      label: "3PA per Game",
      short: "3PA",
      higherIsBetter: true,
      hintJa: "1試合あたりの3PA。打ちまくりが見える。",
      hintEn: "Three-point attempts per game.",
      kind: "perGame",
      showInChipBar: true,
    },
    {
      id: "fg3_pct",
      label: "3-Point %",
      short: "3P%",
      higherIsBetter: true,
      hintJa: "3P%。",
      hintEn: "Three-point percentage.",
      kind: "pct",
      showInChipBar: true,
    },
    {
      id: "fg_pct",
      label: "Field Goal %",
      short: "FG%",
      higherIsBetter: true,
      hintJa: "FG%。",
      hintEn: "Field goal percentage.",
      kind: "pct",
      showInChipBar: true,
    },
    {
      id: "fga",
      label: "FGA per Game",
      short: "FGA",
      higherIsBetter: true,
      hintJa: "1試合あたりの FGA。打ちまくりが見える。",
      hintEn: "Field goal attempts per game.",
      kind: "perGame",
      showInChipBar: true,
    },
    {
      id: "ft_pct",
      label: "Free Throw %",
      short: "FT%",
      higherIsBetter: true,
      hintJa: "FT%。",
      hintEn: "Free throw percentage.",
      kind: "pct",
      showInChipBar: true,
    },
    {
      id: "tov",
      label: "Turnovers per Game",
      short: "TOV",
      higherIsBetter: true,
      hintJa: "1試合あたりのターンオーバー（多い順）。",
      hintEn: "Turnovers per game (most turnovers).",
      kind: "perGame",
      showInChipBar: true,
    },
    {
      id: "min",
      label: "Minutes per Game",
      short: "MIN",
      higherIsBetter: true,
      hintJa: "1試合あたりの出場時間。",
      hintEn: "Minutes per game.",
      kind: "minutes",
      showInChipBar: true,
    },
    {
      id: "eff",
      label: "Efficiency",
      short: "EFF",
      higherIsBetter: true,
      hintJa: "EFF（NBA 効率値。高いほど良い）。",
      hintEn: "NBA efficiency rating.",
      kind: "eff",
      showInChipBar: true,
    },
    {
      id: "fgm",
      label: "FGM per Game",
      short: "FGM",
      higherIsBetter: true,
      hintJa: "1試合あたりの FGM。",
      hintEn: "Field goals made per game.",
      kind: "perGame",
      showInChipBar: false,
    },
    {
      id: "fta",
      label: "FTA per Game",
      short: "FTA",
      higherIsBetter: true,
      hintJa: "1試合あたりの FTA。",
      hintEn: "Free throw attempts per game.",
      kind: "perGame",
      showInChipBar: false,
    },
    {
      id: "ftm",
      label: "FTM per Game",
      short: "FTM",
      higherIsBetter: true,
      hintJa: "1試合あたりの FTM。",
      hintEn: "Free throws made per game.",
      kind: "perGame",
      showInChipBar: false,
    },
  ] as const;

export const NBA_PLAYER_STAT_LEADER_CHIP_METRICS =
  NBA_PLAYER_STAT_LEADER_METRICS.filter((m) => m.showInChipBar);

const METRICS_PER_CHIP_ROW = 6;

export const NBA_PLAYER_STAT_LEADER_METRIC_ROWS: readonly (
  readonly NbaPlayerStatLeaderMetricDef[]
)[] = (() => {
  const chip = [...NBA_PLAYER_STAT_LEADER_CHIP_METRICS];
  const rows: NbaPlayerStatLeaderMetricDef[][] = [];
  for (let i = 0; i < chip.length; i += METRICS_PER_CHIP_ROW) {
    rows.push(chip.slice(i, i + METRICS_PER_CHIP_ROW));
  }
  return rows;
})();

export type NbaPlayerLeaderBoardMetricDef = {
  id: NbaPlayerLeaderMetricId;
  label: string;
  short: string;
  higherIsBetter: boolean;
  hintJa: string;
  hintEn: string;
};

export function playerBoardMetricsForCategory(
  category: NbaLeagueAdvancedCategory
): NbaPlayerLeaderBoardMetricDef[] {
  return playerAdvancedMetricsForCategory(category).map((m) => ({
    id: m.id,
    label: m.label,
    short: m.short,
    higherIsBetter: m.higherIsBetter,
    hintJa: m.hintJa,
    hintEn: m.hintEn,
  }));
}

export type NbaPlayerRailGroup = {
  id: string;
  short: string;
  metrics: readonly NbaPlayerLeaderBoardMetricDef[];
};

/** 左レール。BASIC の下に RATINGS / 4FCT … */
export function leaguePlayerRailGroups(): NbaPlayerRailGroup[] {
  return [
    {
      id: "basic",
      short: "BASIC",
      metrics: NBA_PLAYER_STAT_LEADER_CHIP_METRICS.map((m) => ({
        id: m.id,
        label: m.label,
        short: m.short,
        higherIsBetter: m.higherIsBetter,
        hintJa: m.hintJa,
        hintEn: m.hintEn,
      })),
    },
    ...NBA_LEAGUE_ADVANCED_CATEGORIES.map((c) => ({
      id: c.id,
      short: c.short,
      metrics: playerBoardMetricsForCategory(c.id),
    })),
  ].filter((g) => g.metrics.length > 0);
}

/**
 * Last 10 は試合ログ由来の box 指標のみ（advanced / OREB / DREB はログに無い）。
 */
const PLAYER_LAST10_METRIC_IDS = new Set<NbaPlayerLeaderMetricId>([
  "pts",
  "reb",
  "ast",
  "stl",
  "blk",
  "fg3m",
  "fg3_pct",
  "fg_pct",
  "ft_pct",
  "tov",
  "min",
  "eff",
  "fg3a",
  "fga",
  "fgm",
  "fta",
  "ftm",
]);

export function leaguePlayerRailGroupsForMode(
  mode: "per_game" | "total" | "last10"
): NbaPlayerRailGroup[] {
  if (mode !== "last10") return leaguePlayerRailGroups();
  const basic = NBA_PLAYER_STAT_LEADER_CHIP_METRICS.filter((m) =>
    PLAYER_LAST10_METRIC_IDS.has(m.id)
  ).map((m) => ({
    id: m.id as NbaPlayerLeaderMetricId,
    label: m.label,
    short: m.short,
    higherIsBetter: m.higherIsBetter,
    hintJa: m.hintJa,
    hintEn: m.hintEn,
  }));
  return [{ id: "basic", short: "BASIC", metrics: basic }];
}

export function isPlayerAdvancedLeaderMetric(
  id: NbaPlayerLeaderMetricId
): id is NbaPlayerAdvancedLeaderMetric {
  return NBA_PLAYER_ADVANCED_LEADER_METRICS.some((m) => m.id === id);
}

const PCT_METRICS = new Set<NbaPlayerLeaderBdlStatType>([
  "fg3_pct",
  "fg_pct",
  "ft_pct",
]);

function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pct(n: number) {
  return Math.round(n * 1000) / 1000;
}

function pick<T>(arr: readonly T[], rnd: () => number): T {
  return arr[Math.floor(rnd() * arr.length)]!;
}

function formatValue(metric: NbaPlayerLeaderMetricId, value: number) {
  if (isPlayerAdvancedLeaderMetric(metric)) {
    return formatPlayerAdvancedLeaderValue(metric, value);
  }
  const def = NBA_PLAYER_STAT_LEADER_METRICS.find((m) => m.id === metric)!;
  if (def.kind === "pct") return `${(value * 100).toFixed(1)}%`;
  if (def.kind === "eff") return value.toFixed(1);
  if (def.kind === "minutes") return value.toFixed(1);
  return value.toFixed(1);
}

const FIRST = [
  "JAMES",
  "MICHAEL",
  "DAVID",
  "JOHN",
  "ROBERT",
  "WILLIAM",
  "THOMAS",
  "CHARLES",
  "JOSEPH",
  "PETER",
  "MARK",
  "LUKE",
  "ADAM",
  "SAM",
  "NICK",
  "RYAN",
  "TOM",
  "DAN",
  "CAL",
  "OSCAR",
] as const;

const LAST = [
  "HUGHES",
  "CLARK",
  "HARRIS",
  "LEWIS",
  "WALKER",
  "YOUNG",
  "ALLEN",
  "KING",
  "SCOTT",
  "GREEN",
  "BROWN",
  "HALL",
  "COX",
  "WARD",
  "COOPER",
  "RIVERA",
  "BLAKE",
  "FOSTER",
  "PRICE",
] as const;

const PLAYER_POOL = 120;

function buildPlayerPool() {
  const players: Array<{
    playerId: string;
    playerName: string;
    teamId: string;
    conference: NbaConf;
  }> = [];

  const rnd = mulberry32(hashSeed("playerPool:bdl-leaders"));

  for (let i = 0; i < PLAYER_POOL; i += 1) {
    const windowRnd = mulberry32(hashSeed(`player:${i}:bdl`));
    const conference = windowRnd() > 0.5 ? "east" : "west";
    const teamList =
      conference === "east" ? NBA_EAST_TEAM_IDS : NBA_WEST_TEAM_IDS;
    const teamId = pick(teamList as unknown as string[], windowRnd);

    const first = pick(FIRST, rnd);
    const last = pick(LAST, rnd);
    const playerName = `${first} ${last}`;

    players.push({
      playerId: `player-${i + 1}`,
      playerName,
      teamId: String(teamId),
      conference,
    });
  }
  return players;
}

function buildMetricValue(
  metric: NbaPlayerLeaderMetricId,
  rnd: () => number
): number {
  if (isPlayerAdvancedLeaderMetric(metric)) {
    return buildPlayerAdvancedMetricValue(metric, rnd);
  }
  switch (metric) {
    case "pts":
      return Math.round((12 + rnd() * 20) * 10) / 10;
    case "reb":
      return Math.round((3 + rnd() * 12) * 10) / 10;
    case "ast":
      return Math.round((1.5 + rnd() * 9) * 10) / 10;
    case "oreb":
      return Math.round((0.4 + rnd() * 4.2) * 10) / 10;
    case "dreb":
      return Math.round((2 + rnd() * 10) * 10) / 10;
    case "stl":
      return Math.round((0.4 + rnd() * 2.2) * 10) / 10;
    case "blk":
      return Math.round((0.2 + rnd() * 3.2) * 10) / 10;
    case "fg3m":
      return Math.round((0.5 + rnd() * 4.8) * 10) / 10;
    case "fg3_pct":
      return pct(0.28 + rnd() * 0.18);
    case "fg_pct":
      return pct(0.38 + rnd() * 0.22);
    case "ft_pct":
      return pct(0.62 + rnd() * 0.35);
    case "tov":
      return Math.round((1.2 + rnd() * 4.5) * 10) / 10;
    case "min":
      return Math.round((18 + rnd() * 22) * 10) / 10;
    case "eff":
      return Math.round((8 + rnd() * 28) * 10) / 10;
    case "fg3a":
      return Math.round((1.5 + rnd() * 10) * 10) / 10;
    case "fga":
      return Math.round((8 + rnd() * 14) * 10) / 10;
    case "fgm":
      return Math.round((3.5 + rnd() * 9) * 10) / 10;
    case "fta":
      return Math.round((1.5 + rnd() * 8) * 10) / 10;
    case "ftm":
      return Math.round((1 + rnd() * 6.5) * 10) / 10;
    default:
      return rnd();
  }
}

function buildLeadersBundle(window: "season" | "last10") {
  const players = buildPlayerPool();

  const seasonBoost = window === "season" ? 1 : 0.98;
  const last10Noise = window === "last10";

  const leaders: Partial<Record<NbaPlayerLeaderMetricId, NbaPlayerStatLeaderRow[]>> =
    {};

  const allDefs: Array<{
    id: NbaPlayerLeaderMetricId;
    higherIsBetter: boolean;
  }> = [
    ...NBA_PLAYER_STAT_LEADER_METRICS.map((m) => ({
      id: m.id as NbaPlayerLeaderMetricId,
      higherIsBetter: m.higherIsBetter,
    })),
    ...NBA_PLAYER_ADVANCED_LEADER_METRICS.map((m) => ({
      id: m.id,
      higherIsBetter: m.higherIsBetter,
    })),
  ];

  for (const def of allDefs) {
    const metricId = def.id;
    const rows: NbaPlayerStatLeaderRow[] = [];
    for (let i = 0; i < players.length; i += 1) {
      const p = players[i]!;
      const rnd = mulberry32(
        hashSeed(`${p.playerId}:${metricId}:${window}:bdl-v1`)
      );
      const base = buildMetricValue(metricId, rnd);
      const noise = last10Noise ? (rnd() - 0.5) * 0.06 : 0;
      const isPct =
        (isPlayerAdvancedLeaderMetric(metricId) &&
          playerAdvancedMetricDef(metricId).kind === "pct") ||
        PCT_METRICS.has(metricId as NbaPlayerLeaderBdlStatType);
      const scaled = isPct
        ? pct(Math.min(0.999, Math.max(0.001, base * seasonBoost + noise)))
        : base * seasonBoost + (last10Noise ? (rnd() - 0.5) * 0.85 : 0);
      const gpRnd = mulberry32(
        hashSeed(`${p.playerId}:gp:${window}:bdl-v1`)
      );
      const gamesPlayed =
        window === "last10"
          ? Math.max(5, Math.min(10, Math.round(7 + gpRnd() * 3)))
          : Math.max(12, Math.round(38 + gpRnd() * 34));
      rows.push({
        playerId: p.playerId,
        playerName: p.playerName,
        teamId: p.teamId,
        conference: p.conference,
        gamesPlayed,
        value: scaled,
      });
    }

    const sorted = [...rows].sort((a, b) => {
      if (a.value === b.value) return a.playerName.localeCompare(b.playerName);
      return def.higherIsBetter ? b.value - a.value : a.value - b.value;
    });
    leaders[metricId] = sorted.slice(0, 30);
  }

  return leaders as Record<NbaPlayerLeaderMetricId, NbaPlayerStatLeaderRow[]>;
}

let cached: NbaPlayerStatLeadersBundle | null = null;
let cacheVer: string | null = null;
const MOCK_CACHE_KEY = "v8-player-playtype-freq";

export function getNbaPlayerStatLeadersMock(): NbaPlayerStatLeadersBundle {
  if (cached && cacheVer === MOCK_CACHE_KEY) return cached;
  cacheVer = MOCK_CACHE_KEY;
  cached = {
    season: buildLeadersBundle("season"),
    last10: buildLeadersBundle("last10"),
    asOfLabel: "MOCK · BDL leaders · 2025-26",
  };
  return cached;
}

export function playerLeaderMetricDef(
  id: NbaPlayerLeaderMetricId
): NbaPlayerLeaderBoardMetricDef {
  if (isPlayerAdvancedLeaderMetric(id)) {
    const found = playerAdvancedMetricDef(id);
    return {
      id: found.id,
      label: found.label,
      short: found.short,
      higherIsBetter: found.higherIsBetter,
      hintJa: found.hintJa,
      hintEn: found.hintEn,
    };
  }
  const found = NBA_PLAYER_STAT_LEADER_METRICS.find((m) => m.id === id);
  if (!found) throw new Error(`unknown player leader metric ${id}`);
  return {
    id: found.id,
    label: found.label,
    short: found.short,
    higherIsBetter: found.higherIsBetter,
    hintJa: found.hintJa,
    hintEn: found.hintEn,
  };
}

export function formatPlayerLeaderValue(
  metric: NbaPlayerLeaderMetricId,
  value: number
) {
  return formatValue(metric, value);
}

export function getPlayerLeaderTeamAbbr(teamId: string) {
  return TEAM_SHORT[teamId] ?? teamId;
}
