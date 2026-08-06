import {
  NBA_DIVISION_LABEL,
  type NbaDivisionId,
  NBA_TEAM_US_GEO,
} from "@/lib/nba/nbaTeamUsGeo";
import { NBA_TEAM_NAME_BY_ID } from "@/lib/nba-team-names";
import type { NbaConferenceId } from "@/lib/nba/nbaConferenceTeams";
import { TEAM_SHORT } from "@/lib/team-short";
import { splitTeamNameByLeague } from "@/lib/team-name-split";
import type { NbaRosterPlayer, NbaRosterTeamBlock } from "@/lib/predict/nbaRoster";
import { sortRosterPlayers } from "@/lib/predict/nbaRoster";
import {
  formatMetricValue,
  getNbaLeagueTeamStatsMock,
  metricValue,
  NBA_LEAGUE_TEAM_STAT_METRICS,
  type NbaLeagueTeamStatMetric,
  type NbaLeagueTeamStatRow,
  type NbaLeagueTeamStatWindow,
} from "@/lib/predict/nbaLeagueTeamStatsMocks";

export type NbaTeamProfileLean = "offense" | "defense" | "balanced";

export type NbaTeamMetricWithRank = {
  id: NbaLeagueTeamStatMetric;
  short: string;
  value: number;
  display: string;
  leagueRank: number;
  higherIsBetter: boolean;
};

export type NbaTeamRecentGame = {
  dateLabel: string;
  oppTeamId: string;
  oppAbbr: string;
  home: boolean;
  teamScore: number;
  oppScore: number;
  result: "W" | "L";
  conferenceGame: boolean;
};

export type NbaTeamUpcomingGame = {
  dateLabel: string;
  tipLabel: string;
  oppTeamId: string;
  oppAbbr: string;
  home: boolean;
  conferenceGame: boolean;
};

export type NbaTeamStreak = {
  kind: "W" | "L";
  count: number;
};

export type NbaTeamRosterPreviewPlayer = {
  playerId: string;
  name: string;
  pos: string;
  pts: number;
  reb: number;
  ast: number;
};

export type NbaTeamDetailPreview = {
  teamId: string;
  teamName: string;
  teamAbbr: string;
  /** English city line (e.g. Sacramento) */
  cityEn: string;
  /** English nickname line (e.g. Kings) */
  nickEn: string;
  conference: NbaConferenceId;
  conferenceRank: number;
  divisionId: NbaDivisionId;
  divisionLabelJa: string;
  divisionLabelEn: string;
  season: {
    wins: number;
    losses: number;
    winPct: number;
  };
  last10Record: { wins: number; losses: number };
  /** 直近連続 W/L（newest 基準） */
  streak: NbaTeamStreak;
  profileLean: NbaTeamProfileLean;
  profileLeanJa: string;
  profileLeanEn: string;
  profileNoteJa: string;
  profileNoteEn: string;
  metrics: {
    season: NbaTeamMetricWithRank[];
    last10: NbaTeamMetricWithRank[];
  };
  recentGames: NbaTeamRecentGame[];
  upcomingGames: NbaTeamUpcomingGame[];
  conferenceSplit: {
    vsEast: { wins: number; losses: number };
    vsWest: { wins: number; losses: number };
  };
  homeAwaySplit: {
    home: { wins: number; losses: number };
    away: { wins: number; losses: number };
  };
  /** 予想入力ロスターと同じ形 */
  rosterBlock: NbaRosterTeamBlock;
  asOfLabel: string;
};

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

function leagueRanksForMetric(
  rows: NbaLeagueTeamStatRow[],
  metric: NbaLeagueTeamStatMetric,
  higherIsBetter: boolean
): Map<string, number> {
  const sorted = [...rows].sort((a, b) => {
    const va = metricValue(a, metric);
    const vb = metricValue(b, metric);
    if (va === vb) return a.teamId.localeCompare(b.teamId);
    return higherIsBetter ? vb - va : va - vb;
  });
  const map = new Map<string, number>();
  sorted.forEach((r, i) => map.set(r.teamId, i + 1));
  return map;
}

function buildMetrics(
  rows: NbaLeagueTeamStatRow[],
  teamId: string
): NbaTeamMetricWithRank[] {
  const team = rows.find((r) => r.teamId === teamId);
  if (!team) return [];
  return NBA_LEAGUE_TEAM_STAT_METRICS.map((def) => {
    const ranks = leagueRanksForMetric(rows, def.id, def.higherIsBetter);
    const value = metricValue(team, def.id);
    return {
      id: def.id,
      short: def.short,
      value,
      display: formatMetricValue(def.id, value),
      leagueRank: ranks.get(teamId) ?? 30,
      higherIsBetter: def.higherIsBetter,
    };
  });
}

function resolveLean(
  seasonMetrics: NbaTeamMetricWithRank[]
): Pick<
  NbaTeamDetailPreview,
  "profileLean" | "profileLeanJa" | "profileLeanEn" | "profileNoteJa" | "profileNoteEn"
> {
  const ortg = seasonMetrics.find((m) => m.id === "ortg");
  const drtg = seasonMetrics.find((m) => m.id === "drtg");
  const oRank = ortg?.leagueRank ?? 15;
  const dRank = drtg?.leagueRank ?? 15;
  const delta = dRank - oRank; // positive => offense better ranked than defense

  if (delta >= 4) {
    return {
      profileLean: "offense",
      profileLeanJa: "OF 寄り",
      profileLeanEn: "Offense-leaning",
      profileNoteJa: `ORTG #${oRank} / DRTG #${dRank}。得点効率で勝つタイプ。`,
      profileNoteEn: `ORTG #${oRank} / DRTG #${dRank}. Wins more with offense.`,
    };
  }
  if (delta <= -4) {
    return {
      profileLean: "defense",
      profileLeanJa: "DF 寄り",
      profileLeanEn: "Defense-leaning",
      profileNoteJa: `ORTG #${oRank} / DRTG #${dRank}。守りでゲームを作るタイプ。`,
      profileNoteEn: `ORTG #${oRank} / DRTG #${dRank}. Built around defense.`,
    };
  }
  return {
    profileLean: "balanced",
    profileLeanJa: "均衡",
    profileLeanEn: "Balanced",
    profileNoteJa: `ORTG #${oRank} / DRTG #${dRank}。攻守のバランス型。`,
    profileNoteEn: `ORTG #${oRank} / DRTG #${dRank}. Balanced attack and defense.`,
  };
}

function buildRecentGames(
  teamId: string,
  conference: NbaConferenceId
): NbaTeamRecentGame[] {
  const bundle = getNbaLeagueTeamStatsMock();
  const pool = bundle.season.filter((r) => r.teamId !== teamId);
  const rnd = mulberry32(hashSeed(`${teamId}:games:v1`));
  const games: NbaTeamRecentGame[] = [];
  for (let i = 0; i < 10; i += 1) {
    const opp = pool[Math.floor(rnd() * pool.length)]!;
    const home = rnd() > 0.45;
    const win = rnd() > 0.42;
    const teamScore = Math.round(104 + rnd() * 28);
    const oppScore = win
      ? teamScore - Math.round(3 + rnd() * 18)
      : teamScore + Math.round(2 + rnd() * 16);
    const month = 10 + Math.floor(i / 4);
    const day = 2 + i * 3;
    games.push({
      dateLabel: `${month}/${day}`,
      oppTeamId: opp.teamId,
      oppAbbr: TEAM_SHORT[opp.teamId] ?? opp.teamId,
      home,
      teamScore,
      oppScore,
      result: win ? "W" : "L",
      conferenceGame: opp.conference === conference,
    });
  }
  return games;
}

/** games は古い→新しい。末尾から連続結果を数える */
export function computeStreakFromGames(
  games: Array<{ result: "W" | "L" }>
): NbaTeamStreak {
  if (games.length === 0) return { kind: "W", count: 0 };
  const kind = games[games.length - 1]!.result;
  let count = 0;
  for (let i = games.length - 1; i >= 0; i -= 1) {
    if (games[i]!.result !== kind) break;
    count += 1;
  }
  return { kind, count };
}

export function formatStreakLabel(streak: NbaTeamStreak): string {
  if (streak.count <= 0) return "—";
  return `${streak.kind}${streak.count}`;
}

function buildUpcomingGames(
  teamId: string,
  conference: NbaConferenceId
): NbaTeamUpcomingGame[] {
  const bundle = getNbaLeagueTeamStatsMock();
  const pool = bundle.season.filter((r) => r.teamId !== teamId);
  const rnd = mulberry32(hashSeed(`${teamId}:upcoming:v1`));
  const tips = ["19:00", "19:30", "20:00", "22:00", "13:00"];
  const games: NbaTeamUpcomingGame[] = [];
  for (let i = 0; i < 4; i += 1) {
    const opp = pool[Math.floor(rnd() * pool.length)]!;
    const home = rnd() > 0.48;
    const month = 3 + Math.floor(i / 3);
    const day = 8 + i * 2;
    games.push({
      dateLabel: `${month}/${day}`,
      tipLabel: tips[Math.floor(rnd() * tips.length)]!,
      oppTeamId: opp.teamId,
      oppAbbr: TEAM_SHORT[opp.teamId] ?? opp.teamId,
      home,
      conferenceGame: opp.conference === conference,
    });
  }
  return games;
}

function buildConferenceSplit(teamId: string) {
  const rnd = mulberry32(hashSeed(`${teamId}:confSplit:v1`));
  const veW = Math.round(8 + rnd() * 12);
  const veL = Math.round(6 + rnd() * 12);
  const vwW = Math.round(7 + rnd() * 12);
  const vwL = Math.round(6 + rnd() * 12);
  return {
    vsEast: { wins: veW, losses: veL },
    vsWest: { wins: vwW, losses: vwL },
  };
}

function buildHomeAwaySplit(teamId: string) {
  const rnd = mulberry32(hashSeed(`${teamId}:homeAway:v1`));
  const hW = Math.round(12 + rnd() * 18);
  const hL = Math.round(6 + rnd() * 14);
  const aW = Math.round(10 + rnd() * 16);
  const aL = Math.round(8 + rnd() * 16);
  return {
    home: { wins: hW, losses: hL },
    away: { wins: aW, losses: aL },
  };
}

const ROSTER_NAMES = [
  ["JAMES", "HUGHES", "G"],
  ["MICHAEL", "CLARK", "F"],
  ["DAVID", "HARRIS", "C"],
  ["JOHN", "LEWIS", "G"],
  ["ROBERT", "WALKER", "F"],
  ["WILLIAM", "YOUNG", "G"],
  ["THOMAS", "ALLEN", "F"],
  ["CHARLES", "KING", "C"],
  ["OSCAR", "PRICE", "G"],
  ["SAM", "FOSTER", "F"],
] as const;

function buildRosterBlock(
  teamId: string,
  teamName: string,
  seed: number
): NbaRosterTeamBlock {
  const rnd = mulberry32(hashSeed(`${teamId}:roster:v2`));
  const players: NbaRosterPlayer[] = ROSTER_NAMES.map(([first, last, pos], i) => {
    const starter = i < 5;
    const mpg = Math.round((starter ? 28 + rnd() * 10 : 12 + rnd() * 14) * 10) / 10;
    const ppg = Math.round((starter ? 12 + rnd() * 18 : 4 + rnd() * 10) * 10) / 10;
    return {
      id: `${teamId}-p${i + 1}`,
      firstName: first,
      lastName: last,
      position: pos,
      jerseyNumber: String(i + 1),
      starter,
      gp: Math.round(40 + rnd() * 30),
      mpg,
      ppg,
      rpg: Math.round((2 + rnd() * 10) * 10) / 10,
      apg: Math.round((1 + rnd() * 8) * 10) / 10,
      fgPct: 0.4 + rnd() * 0.18,
      fg3Pct: 0.3 + rnd() * 0.15,
      ftPct: 0.7 + rnd() * 0.22,
      fgm: Math.round((3 + rnd() * 7) * 10) / 10,
      fga: Math.round((8 + rnd() * 12) * 10) / 10,
      fg3m: Math.round((0.5 + rnd() * 3.5) * 10) / 10,
      fg3a: Math.round((2 + rnd() * 8) * 10) / 10,
      ftm: Math.round((1 + rnd() * 5) * 10) / 10,
      fta: Math.round((1.5 + rnd() * 6) * 10) / 10,
      spg: Math.round((0.3 + rnd() * 1.8) * 10) / 10,
      bpg: Math.round((0.2 + rnd() * 2) * 10) / 10,
      tpg: Math.round((0.8 + rnd() * 3) * 10) / 10,
      dimmed: !starter && rnd() > 0.55,
    };
  });
  const sorted = sortRosterPlayers(players);
  const activeCount = sorted.filter((p) => !p.dimmed).length;
  return {
    teamId,
    teamName,
    side: "home",
    seed,
    activeCount,
    rosterCount: sorted.length,
    players: sorted,
  };
}

function conferenceRankAmong(
  rows: NbaLeagueTeamStatRow[],
  teamId: string,
  conference: NbaConferenceId
): number {
  const conf = rows
    .filter((r) => r.conference === conference)
    .sort((a, b) => b.winPct - a.winPct || b.netrtg - a.netrtg);
  const idx = conf.findIndex((r) => r.teamId === teamId);
  return idx >= 0 ? idx + 1 : 15;
}

/** プレビュー既定チーム（NET 上位寄りを選ぶ） */
export function defaultTeamDetailPreviewTeamId(): string {
  const season = getNbaLeagueTeamStatsMock().season;
  const sorted = [...season].sort((a, b) => b.netrtg - a.netrtg);
  return sorted[2]?.teamId ?? sorted[0]?.teamId ?? "nba-lakers";
}

export function getNbaTeamDetailPreview(
  teamId: string = defaultTeamDetailPreviewTeamId()
): NbaTeamDetailPreview {
  const bundle = getNbaLeagueTeamStatsMock();
  const seasonRow = bundle.season.find((r) => r.teamId === teamId);
  const last10Row = bundle.last10.find((r) => r.teamId === teamId);
  if (!seasonRow || !last10Row) {
    throw new Error(`team detail preview: unknown team ${teamId}`);
  }

  const seasonMetrics = buildMetrics(bundle.season, teamId);
  const last10Metrics = buildMetrics(bundle.last10, teamId);
  const lean = resolveLean(seasonMetrics);
  const recentGames = buildRecentGames(teamId, seasonRow.conference);
  const l10Wins = recentGames.filter((g) => g.result === "W").length;
  const [cityEn, nickEn] = splitTeamNameByLeague("nba", seasonRow.teamName);
  const divisionId: NbaDivisionId =
    NBA_TEAM_US_GEO[teamId]?.division ?? "pacific";
  const divLabel = NBA_DIVISION_LABEL[divisionId];

  const confRank = conferenceRankAmong(
    bundle.season,
    teamId,
    seasonRow.conference
  );
  const teamName = NBA_TEAM_NAME_BY_ID[teamId] ?? seasonRow.teamName;

  return {
    teamId,
    teamName,
    teamAbbr: TEAM_SHORT[teamId] ?? teamId,
    cityEn: cityEn || seasonRow.teamName,
    nickEn: nickEn || getMobileTeamNameFallback(seasonRow.teamName),
    conference: seasonRow.conference,
    conferenceRank: confRank,
    divisionId,
    divisionLabelJa: divLabel.ja,
    divisionLabelEn: divLabel.en,
    season: {
      wins: seasonRow.wins,
      losses: seasonRow.losses,
      winPct: seasonRow.winPct,
    },
    last10Record: { wins: l10Wins, losses: 10 - l10Wins },
    streak: computeStreakFromGames(recentGames),
    ...lean,
    metrics: { season: seasonMetrics, last10: last10Metrics },
    recentGames,
    upcomingGames: buildUpcomingGames(teamId, seasonRow.conference),
    conferenceSplit: buildConferenceSplit(teamId),
    homeAwaySplit: buildHomeAwaySplit(teamId),
    rosterBlock: buildRosterBlock(teamId, teamName, confRank),
    asOfLabel: bundle.asOfLabel,
  };
}

function getMobileTeamNameFallback(full: string) {
  const parts = full.trim().split(/\s+/);
  return parts[parts.length - 1] ?? full;
}

export function metricWindowRows(
  detail: NbaTeamDetailPreview,
  window: NbaLeagueTeamStatWindow
): NbaTeamMetricWithRank[] {
  return window === "season" ? detail.metrics.season : detail.metrics.last10;
}
