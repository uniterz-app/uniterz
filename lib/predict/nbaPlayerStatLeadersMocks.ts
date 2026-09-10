import type { UiStrings } from "@/lib/i18n/ui";
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
  hint: UiStrings;
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
      hint: {
        ja: "1試合あたりの得点（PPG）。",
        en: "Points per game.",
        ko: "경기당 득점(PPG).",
        zh: "场均得分（PPG）。",
        es: "Puntos por partido.",
        pt: "Pontos por jogo.",
        fr: "Points par match.",
      },
      kind: "perGame",
      showInChipBar: true,
    },
    {
      id: "reb",
      label: "Rebounds per Game",
      short: "REB",
      higherIsBetter: true,
      hint: {
        ja: "1試合あたりのリバウンド。",
        en: "Rebounds per game.",
        ko: "경기당 리바운드.",
        zh: "场均篮板。",
        es: "Rebotes por partido.",
        pt: "Rebotes por jogo.",
        fr: "Rebonds par match.",
      },
      kind: "perGame",
      showInChipBar: true,
    },
    {
      id: "ast",
      label: "Assists per Game",
      short: "AST",
      higherIsBetter: true,
      hint: {
        ja: "1試合あたりのアシスト。",
        en: "Assists per game.",
        ko: "경기당 어시스트.",
        zh: "场均助攻。",
        es: "Asistencias por partido.",
        pt: "Assistências por jogo.",
        fr: "Passes décisives par match.",
      },
      kind: "perGame",
      showInChipBar: true,
    },
    {
      id: "oreb",
      label: "Offensive Rebounds per Game",
      short: "ORB",
      higherIsBetter: true,
      hint: {
        ja: "1試合あたりのオフェンスリバウンド。",
        en: "Offensive rebounds per game.",
        ko: "경기당 공격 리바운드.",
        zh: "场均进攻篮板。",
        es: "Rebotes ofensivos por partido.",
        pt: "Rebotes ofensivos por jogo.",
        fr: "Rebonds offensifs par match.",
      },
      kind: "perGame",
      showInChipBar: true,
    },
    {
      id: "dreb",
      label: "Defensive Rebounds per Game",
      short: "DRB",
      higherIsBetter: true,
      hint: {
        ja: "1試合あたりのディフェンスリバウンド。",
        en: "Defensive rebounds per game.",
        ko: "경기당 수비 리바운드.",
        zh: "场均防守篮板。",
        es: "Rebotes defensivos por partido.",
        pt: "Rebotes defensivos por jogo.",
        fr: "Rebonds défensifs par match.",
      },
      kind: "perGame",
      showInChipBar: true,
    },
    {
      id: "stl",
      label: "Steals per Game",
      short: "STL",
      higherIsBetter: true,
      hint: {
        ja: "1試合あたりのスティール。",
        en: "Steals per game.",
        ko: "경기당 스틸.",
        zh: "场均抢断。",
        es: "Robos por partido.",
        pt: "Roubos de bola por jogo.",
        fr: "Interceptions par match.",
      },
      kind: "perGame",
      showInChipBar: true,
    },
    {
      id: "blk",
      label: "Blocks per Game",
      short: "BLK",
      higherIsBetter: true,
      hint: {
        ja: "1試合あたりのブロック。",
        en: "Blocks per game.",
        ko: "경기당 블록.",
        zh: "场均盖帽。",
        es: "Tapones por partido.",
        pt: "Bloqueios por jogo.",
        fr: "Contres par match.",
      },
      kind: "perGame",
      showInChipBar: true,
    },
    {
      id: "fg3m",
      label: "3PM per Game",
      short: "3PM",
      higherIsBetter: true,
      hint: {
        ja: "1試合あたりの3PM。",
        en: "Made threes per game.",
        ko: "경기당 3점 성공.",
        zh: "场均三分命中数。",
        es: "Triples anotados por partido.",
        pt: "Bolas de 3 convertidas por jogo.",
        fr: "Paniers à 3 pts réussis par match.",
      },
      kind: "perGame",
      showInChipBar: true,
    },
    {
      id: "fg3a",
      label: "3PA per Game",
      short: "3PA",
      higherIsBetter: true,
      hint: {
        ja: "1試合あたりの3PA。打ちまくりが見える。",
        en: "Three-point attempts per game.",
        ko: "경기당 3점 시도. 외곽 시도량이 보임.",
        zh: "场均三分出手数。看得出出手意愿。",
        es: "Triples intentados por partido.",
        pt: "Tentativas de 3 por jogo.",
        fr: "Tirs à 3 pts tentés par match.",
      },
      kind: "perGame",
      showInChipBar: true,
    },
    {
      id: "fg3_pct",
      label: "3-Point %",
      short: "3P%",
      higherIsBetter: true,
      hint: {
        ja: "3P%。",
        en: "Three-point percentage.",
        ko: "3점 성공률.",
        zh: "三分命中率。",
        es: "Porcentaje de triples.",
        pt: "Aproveitamento de 3 pontos.",
        fr: "Pourcentage à 3 points.",
      },
      kind: "pct",
      showInChipBar: true,
    },
    {
      id: "fg_pct",
      label: "Field Goal %",
      short: "FG%",
      higherIsBetter: true,
      hint: {
        ja: "FG%。",
        en: "Field goal percentage.",
        ko: "야투 성공률.",
        zh: "投篮命中率。",
        es: "Porcentaje de tiros de campo.",
        pt: "Aproveitamento de arremessos.",
        fr: "Pourcentage aux tirs.",
      },
      kind: "pct",
      showInChipBar: true,
    },
    {
      id: "fga",
      label: "FGA per Game",
      short: "FGA",
      higherIsBetter: true,
      hint: {
        ja: "1試合あたりの FGA。打ちまくりが見える。",
        en: "Field goal attempts per game.",
        ko: "경기당 야투 시도. 시도량이 보임.",
        zh: "场均投篮出手数。看得出出手意愿。",
        es: "Tiros de campo intentados por partido.",
        pt: "Tentativas de arremesso por jogo.",
        fr: "Tirs tentés par match.",
      },
      kind: "perGame",
      showInChipBar: true,
    },
    {
      id: "ft_pct",
      label: "Free Throw %",
      short: "FT%",
      higherIsBetter: true,
      hint: {
        ja: "FT%。",
        en: "Free throw percentage.",
        ko: "자유투 성공률.",
        zh: "罚球命中率。",
        es: "Porcentaje de tiros libres.",
        pt: "Aproveitamento de lances livres.",
        fr: "Pourcentage aux lancers francs.",
      },
      kind: "pct",
      showInChipBar: true,
    },
    {
      id: "tov",
      label: "Turnovers per Game",
      short: "TOV",
      higherIsBetter: true,
      hint: {
        ja: "1試合あたりのターンオーバー（多い順）。",
        en: "Turnovers per game (most turnovers).",
        ko: "경기당 턴오버(많은 순).",
        zh: "场均失误（由多到少）。",
        es: "Pérdidas por partido (de más a menos).",
        pt: "Turnovers por jogo (do maior para o menor).",
        fr: "Pertes de balle par match (des plus nombreuses).",
      },
      kind: "perGame",
      showInChipBar: true,
    },
    {
      id: "min",
      label: "Minutes per Game",
      short: "MIN",
      higherIsBetter: true,
      hint: {
        ja: "1試合あたりの出場時間。",
        en: "Minutes per game.",
        ko: "경기당 출전 시간.",
        zh: "场均出场时间。",
        es: "Minutos por partido.",
        pt: "Minutos por jogo.",
        fr: "Minutes par match.",
      },
      kind: "minutes",
      showInChipBar: true,
    },
    {
      id: "eff",
      label: "Efficiency",
      short: "EFF",
      higherIsBetter: true,
      hint: {
        ja: "EFF（NBA 効率値。高いほど良い）。",
        en: "NBA efficiency rating.",
        ko: "EFF(NBA 효율 지표. 높을수록 좋음).",
        zh: "EFF（NBA 效率值，越高越好）。",
        es: "EFF: índice de eficiencia NBA.",
        pt: "EFF: índice de eficiência da NBA.",
        fr: "EFF : indice d’efficacité NBA.",
      },
      kind: "eff",
      showInChipBar: true,
    },
    {
      id: "fgm",
      label: "FGM per Game",
      short: "FGM",
      higherIsBetter: true,
      hint: {
        ja: "1試合あたりの FGM。",
        en: "Field goals made per game.",
        ko: "경기당 야투 성공.",
        zh: "场均投篮命中数。",
        es: "Tiros de campo anotados por partido.",
        pt: "Arremessos convertidos por jogo.",
        fr: "Tirs réussis par match.",
      },
      kind: "perGame",
      showInChipBar: false,
    },
    {
      id: "fta",
      label: "FTA per Game",
      short: "FTA",
      higherIsBetter: true,
      hint: {
        ja: "1試合あたりの FTA。",
        en: "Free throw attempts per game.",
        ko: "경기당 자유투 시도.",
        zh: "场均罚球出手数。",
        es: "Tiros libres intentados por partido.",
        pt: "Tentativas de lance livre por jogo.",
        fr: "Lancers francs tentés par match.",
      },
      kind: "perGame",
      showInChipBar: false,
    },
    {
      id: "ftm",
      label: "FTM per Game",
      short: "FTM",
      higherIsBetter: true,
      hint: {
        ja: "1試合あたりの FTM。",
        en: "Free throws made per game.",
        ko: "경기당 자유투 성공.",
        zh: "场均罚球命中数。",
        es: "Tiros libres anotados por partido.",
        pt: "Lances livres convertidos por jogo.",
        fr: "Lancers francs réussis par match.",
      },
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
  hint: UiStrings;
};

export function playerBoardMetricsForCategory(
  category: NbaLeagueAdvancedCategory
): NbaPlayerLeaderBoardMetricDef[] {
  return playerAdvancedMetricsForCategory(category).map((m) => ({
    id: m.id,
    label: m.label,
    short: m.short,
    higherIsBetter: m.higherIsBetter,
    hint: m.hint,
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
        hint: m.hint,
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
 * Last 10 は試合ログ由来の box 指標（advanced は season のみ）。
 */
const PLAYER_LAST10_METRIC_IDS = new Set<NbaPlayerLeaderMetricId>([
  "pts",
  "reb",
  "oreb",
  "dreb",
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
    hint: m.hint,
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
      hint: found.hint,
    };
  }
  const found = NBA_PLAYER_STAT_LEADER_METRICS.find((m) => m.id === id);
  if (!found) throw new Error(`unknown player leader metric ${id}`);
  return {
    id: found.id,
    label: found.label,
    short: found.short,
    higherIsBetter: found.higherIsBetter,
    hint: found.hint,
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
