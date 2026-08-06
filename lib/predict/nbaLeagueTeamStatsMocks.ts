/**
 * リーグ視点の Team Stats mock（30 チーム）。
 * 予想オーバーレイの 2 チーム比較とは別。後で BallDontLie / 自前集計に差し替え。
 */
import { NBA_TEAM_NAME_BY_ID } from "@/lib/nba-team-names";
import {
  NBA_EAST_TEAM_IDS,
  NBA_WEST_TEAM_IDS,
  type NbaConferenceId,
} from "@/lib/nba/nbaConferenceTeams";

export type NbaLeagueTeamStatMetric =
  | "netrtg"
  | "ortg"
  | "drtg"
  | "pace"
  | "winPct"
  | "diff"
  | "ppg"
  | "papg"
  | "efgPct"
  | "fg3Pct"
  | "fg3a"
  | "tovPct";

export type NbaLeagueTeamStatWindow = "season" | "last10";

export type NbaLeagueTeamStatRow = {
  teamId: string;
  teamName: string;
  conference: NbaConferenceId;
  wins: number;
  losses: number;
  winPct: number;
  ppg: number;
  papg: number;
  diff: number;
  ortg: number;
  drtg: number;
  netrtg: number;
  pace: number;
  /** Effective FG% (0–1) */
  efgPct: number;
  /** 3P% (0–1) */
  fg3Pct: number;
  /** 3PA per game */
  fg3a: number;
  /** Turnover % of possessions (0–1) */
  tovPct: number;
};

export type NbaLeagueTeamStatsBundle = {
  season: NbaLeagueTeamStatRow[];
  last10: NbaLeagueTeamStatRow[];
  asOfLabel: string;
};

export type NbaLeagueTeamStatMetricDef = {
  id: NbaLeagueTeamStatMetric;
  label: string;
  short: string;
  higherIsBetter: boolean;
  hintJa: string;
  hintEn: string;
};

export const NBA_LEAGUE_TEAM_STAT_METRICS: readonly NbaLeagueTeamStatMetricDef[] =
  [
    {
      id: "netrtg",
      label: "Net Rating",
      short: "NET",
      higherIsBetter: true,
      hintJa: "100 possessions あたりの得失点差。チーム総合の強さの目安。",
      hintEn: "Point diff per 100 possessions. Overall team strength.",
    },
    {
      id: "ortg",
      label: "Off Rating",
      short: "ORTG",
      higherIsBetter: true,
      hintJa: "100 possessions あたりの得点。攻撃力。",
      hintEn: "Points scored per 100 possessions. Offense.",
    },
    {
      id: "drtg",
      label: "Def Rating",
      short: "DRTG",
      higherIsBetter: false,
      hintJa: "100 possessions あたりの失点。低いほど DF がいい。",
      hintEn: "Points allowed per 100 possessions. Lower is better defense.",
    },
    {
      id: "pace",
      label: "Pace",
      short: "PACE",
      higherIsBetter: true,
      hintJa: "1 試合あたりの possessions 数。高いほどテンポが速い。",
      hintEn: "Possessions per game. Higher means faster pace.",
    },
    {
      id: "winPct",
      label: "Win %",
      short: "W%",
      higherIsBetter: true,
      hintJa: "勝率。結果そのものの順位。",
      hintEn: "Win percentage. Standings outcome.",
    },
    {
      id: "diff",
      label: "Point Diff",
      short: "DIFF",
      higherIsBetter: true,
      hintJa: "1 試合平均の得失点差。",
      hintEn: "Average point differential per game.",
    },
    {
      id: "ppg",
      label: "Points / G",
      short: "PPG",
      higherIsBetter: true,
      hintJa: "1 試合平均得点。",
      hintEn: "Average points scored per game.",
    },
    {
      id: "papg",
      label: "Opp Points / G",
      short: "PA",
      higherIsBetter: false,
      hintJa: "1 試合平均失点。低いほど良い。",
      hintEn: "Average points allowed per game. Lower is better.",
    },
    {
      id: "efgPct",
      label: "eFG%",
      short: "EFG",
      higherIsBetter: true,
      hintJa: "実効 FG%。3P の価値を込めたシュート精度。",
      hintEn: "Effective FG%. Shooting efficiency including 3s.",
    },
    {
      id: "fg3Pct",
      label: "3P%",
      short: "3P%",
      higherIsBetter: true,
      hintJa: "3 ポイント成功率。",
      hintEn: "Three-point percentage.",
    },
    {
      id: "fg3a",
      label: "3PA / G",
      short: "3PA",
      higherIsBetter: true,
      hintJa: "1 試合平均の 3 ポイント試投数。外への依存度。",
      hintEn: "Three-point attempts per game. Perimeter volume.",
    },
    {
      id: "tovPct",
      label: "TOV%",
      short: "TOV",
      higherIsBetter: false,
      hintJa: "possession あたりのターンオーバー率。低いほど良い。",
      hintEn: "Turnover rate on possessions. Lower is better.",
    },
  ] as const;

/** 指標チップ 2 行（6 + 6） */
export const NBA_LEAGUE_TEAM_STAT_METRIC_ROWS: readonly (
  readonly NbaLeagueTeamStatMetricDef[]
)[] = [
  NBA_LEAGUE_TEAM_STAT_METRICS.slice(0, 6),
  NBA_LEAGUE_TEAM_STAT_METRICS.slice(6, 12),
];

export function leagueMetricDef(
  id: NbaLeagueTeamStatMetric
): NbaLeagueTeamStatMetricDef {
  const found = NBA_LEAGUE_TEAM_STAT_METRICS.find((m) => m.id === id);
  if (!found) throw new Error(`unknown metric ${id}`);
  return found;
}

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

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function pct3(n: number): number {
  return Math.round(n * 1000) / 1000;
}

function buildRow(
  teamId: string,
  conference: NbaConferenceId,
  window: NbaLeagueTeamStatWindow
): NbaLeagueTeamStatRow {
  const rnd = mulberry32(hashSeed(`${teamId}:${window}:v2`));
  const tier = rnd();
  const winPctBase = 0.28 + tier * 0.44 + (rnd() - 0.5) * 0.06;
  const winPct = Math.min(0.82, Math.max(0.18, winPctBase));
  const games = window === "season" ? 72 : 10;
  const wins = Math.round(winPct * games);
  const losses = games - wins;

  const netBase = (winPct - 0.5) * 28 + (rnd() - 0.5) * 2.4;
  const pace = round1(96 + rnd() * 8 + (window === "last10" ? (rnd() - 0.5) * 2 : 0));
  const ortg = round1(108 + netBase * 0.55 + (rnd() - 0.5) * 3);
  const drtg = round1(ortg - netBase + (rnd() - 0.5) * 1.2);
  const netrtg = round1(ortg - drtg);
  const ppg = round1(pace * (ortg / 100) * 0.98 + (rnd() - 0.5) * 1.5);
  const papg = round1(ppg - netrtg * 0.95 + (rnd() - 0.5) * 1.2);
  const diff = round1(ppg - papg);

  const fg3Pct = pct3(0.335 + tier * 0.06 + (rnd() - 0.5) * 0.02);
  const fg3a = round1(32 + tier * 10 + rnd() * 6);
  const efgPct = pct3(0.51 + tier * 0.05 + fg3Pct * 0.08 + (rnd() - 0.5) * 0.015);
  const tovPct = pct3(0.145 - tier * 0.02 + (rnd() - 0.5) * 0.012);

  return {
    teamId,
    teamName: NBA_TEAM_NAME_BY_ID[teamId] ?? teamId,
    conference,
    wins,
    losses,
    winPct: pct3(winPct),
    ppg,
    papg,
    diff,
    ortg,
    drtg,
    netrtg,
    pace,
    efgPct,
    fg3Pct,
    fg3a,
    tovPct,
  };
}

function buildWindow(window: NbaLeagueTeamStatWindow): NbaLeagueTeamStatRow[] {
  const rows: NbaLeagueTeamStatRow[] = [];
  for (const id of NBA_EAST_TEAM_IDS) {
    rows.push(buildRow(id, "east", window));
  }
  for (const id of NBA_WEST_TEAM_IDS) {
    rows.push(buildRow(id, "west", window));
  }
  return rows;
}

let cached: NbaLeagueTeamStatsBundle | null = null;
let cacheVer: string | null = null;
const MOCK_CACHE_KEY = "v3-metrics";

/** 安定モック（呼び出しごとに同じ値） */
export function getNbaLeagueTeamStatsMock(): NbaLeagueTeamStatsBundle {
  if (cached && cacheVer === MOCK_CACHE_KEY) return cached;
  cacheVer = MOCK_CACHE_KEY;
  cached = {
    season: buildWindow("season"),
    last10: buildWindow("last10"),
    asOfLabel: "MOCK · 2025-26",
  };
  return cached;
}

export function metricValue(
  row: NbaLeagueTeamStatRow,
  metric: NbaLeagueTeamStatMetric
): number {
  return row[metric];
}

export function formatMetricValue(
  metric: NbaLeagueTeamStatMetric,
  value: number
): string {
  if (metric === "winPct" || metric === "efgPct" || metric === "fg3Pct") {
    return `${(value * 100).toFixed(1)}%`;
  }
  if (metric === "tovPct") {
    return `${(value * 100).toFixed(1)}%`;
  }
  if (metric === "diff" || metric === "netrtg") {
    return `${value > 0 ? "+" : ""}${value.toFixed(1)}`;
  }
  return value.toFixed(1);
}

/** 表の並び順（指標値の大小） */
export type NbaLeagueTeamStatSortDir = "desc" | "asc";

/** 指標の「良い方向」をデフォルトの並びにする */
export function defaultLeagueTeamStatSortDir(
  higherIsBetter: boolean
): NbaLeagueTeamStatSortDir {
  return higherIsBetter ? "desc" : "asc";
}

export function sortLeagueTeamRows(
  rows: readonly NbaLeagueTeamStatRow[],
  metric: NbaLeagueTeamStatMetric,
  dir: NbaLeagueTeamStatSortDir
): NbaLeagueTeamStatRow[] {
  return [...rows].sort((a, b) => {
    const av = metricValue(a, metric);
    const bv = metricValue(b, metric);
    if (av === bv) return a.teamName.localeCompare(b.teamName);
    const cmp = bv - av;
    return dir === "desc" ? cmp : -cmp;
  });
}
