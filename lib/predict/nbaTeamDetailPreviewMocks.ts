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
import { playerCardName, sortRosterPlayers } from "@/lib/predict/nbaRoster";
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
  /** 欠場・GTD（Active は含めない） */
  injuries: NbaTeamInjuryEntry[];
  /**
   * 相手に許している指標（BallDontLie `general` + `type=opponent` / four factors 系）。
   * 低いほど DF が良い（TOV のみ高いほど良い＝ターンオーバーを誘発）。
   */
  opponentStats: NbaTeamOpponentAllowedMetric[];
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
  /** 今季チームペイロール（モック） */
  payroll: NbaTeamPayroll;
  asOfLabel: string;
};

export type NbaTeamInjuryEntry = {
  playerId: string;
  name: string;
  status: "out" | "gtd";
  reason: string | null;
  returnEstimate: string | null;
};

/** 相手に許しているスタッツ（BallDontLie opponent averages 相当） */
export type NbaTeamOpponentAllowedMetricId =
  | "pts_allowed"
  | "fg_pct_allowed"
  | "fg3_pct_allowed"
  | "ft_pct_allowed"
  | "reb_allowed"
  | "ast_allowed"
  | "tov_forced"
  | "oreb_allowed"
  | "efg_pct_allowed";

export type NbaTeamOpponentAllowedMetricDef = {
  id: NbaTeamOpponentAllowedMetricId;
  short: string;
  /** false = 高いほど良い（誘発 TOV など） */
  lowerIsBetter: boolean;
  hintJa: string;
  hintEn: string;
};

/** BallDontLie `general?type=opponent` / four-factors 相当の指標定義 */
export const NBA_TEAM_OPPONENT_ALLOWED_METRICS: readonly NbaTeamOpponentAllowedMetricDef[] =
  [
    {
      id: "pts_allowed",
      short: "PTS",
      lowerIsBetter: true,
      hintJa: "相手に許した平均得点。低いほど DF が良い。順位 #1 = 最少失点。",
      hintEn: "Points allowed per game. Lower is better. Rank #1 = fewest allowed.",
    },
    {
      id: "fg_pct_allowed",
      short: "FG%",
      lowerIsBetter: true,
      hintJa: "相手の FG%。低いほどシュートを抑えられている。",
      hintEn: "Opponent FG%. Lower means better shot defense.",
    },
    {
      id: "fg3_pct_allowed",
      short: "3P%",
      lowerIsBetter: true,
      hintJa: "相手の 3P%。低いほど外を抑えられている。",
      hintEn: "Opponent 3P%. Lower means better perimeter defense.",
    },
    {
      id: "ft_pct_allowed",
      short: "FT%",
      lowerIsBetter: true,
      hintJa: "相手の FT%。低いほどフリースローを決められていない（運要素あり）。",
      hintEn: "Opponent FT%. Lower is better (some luck).",
    },
    {
      id: "reb_allowed",
      short: "REB",
      lowerIsBetter: true,
      hintJa: "相手のリバウンド数。低いほどボードで負けていない。",
      hintEn: "Opponent rebounds. Lower means better glass control.",
    },
    {
      id: "ast_allowed",
      short: "AST",
      lowerIsBetter: true,
      hintJa: "相手のアシスト。低いほどパスを通されにくい。",
      hintEn: "Opponent assists. Lower means less ball movement allowed.",
    },
    {
      id: "tov_forced",
      short: "TOV",
      lowerIsBetter: false,
      hintJa: "相手のターンオーバー（誘発数）。高いほど DF がボールを奪えている。",
      hintEn: "Opponent turnovers forced. Higher is better defense.",
    },
    {
      id: "oreb_allowed",
      short: "OREB",
      lowerIsBetter: true,
      hintJa: "相手のオフェンスリバウンド。低いほどセカンドチャンスを許さない。",
      hintEn: "Opponent offensive rebounds. Lower limits second chances.",
    },
    {
      id: "efg_pct_allowed",
      short: "EFG%",
      lowerIsBetter: true,
      hintJa: "相手の eFG%（3P 加味）。低いほど総合的にシュートを抑えられている。",
      hintEn: "Opponent eFG%. Lower means better overall shot defense.",
    },
  ] as const;

export type NbaTeamOpponentAllowedMetric = {
  id: NbaTeamOpponentAllowedMetricId;
  short: string;
  value: number;
  display: string;
  leagueRank: number;
  /** true = 値が低いほど良い（許している量が少ない） */
  lowerIsBetter: boolean;
  hintJa: string;
  hintEn: string;
};

export type NbaTeamPayroll = {
  /** 総年俸 */
  totalSalary: number;
  /** リーグ内ペイロール順位（1=最高） */
  leagueRank: number;
  /** サラリーキャップ概算 */
  salaryCap: number;
  /** ラグジュアリータックスライン */
  taxLine: number;
  /** キャップ余裕（マイナス=オーバー） */
  capSpace: number;
  /** タックス概算（非課税なら 0） */
  taxBill: number;
  /** 保証額合計 */
  guaranteed: number;
  /** 選手別内訳（年俸降順） */
  lines: NbaTeamPayrollLine[];
};

export type NbaTeamPayrollLine = {
  playerId: string;
  /** 表示名（例: L.DONCIC） */
  name: string;
  salary: number;
  /** 総年俸に占める割合 0–1 */
  share: number;
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

function buildInjuries(
  teamId: string,
  roster: NbaRosterTeamBlock
): NbaTeamInjuryEntry[] {
  const rnd = mulberry32(hashSeed(`${teamId}:injuries:v1`));
  const reasons = [
    "Left ankle sprain",
    "Right knee soreness",
    "Hamstring strain",
    "Lower back tightness",
    "Shoulder impingement",
  ];
  const returns = ["Day-to-day", "Week-to-week", "2 weeks", "Re-evaluate"];
  const pool = [...roster.players].sort((a, b) => b.mpg - a.mpg);
  const count = 1 + Math.floor(rnd() * 3);
  const out: NbaTeamInjuryEntry[] = [];
  for (let i = 0; i < count && i < pool.length; i += 1) {
    const p = pool[Math.floor(rnd() * pool.length)]!;
    if (out.some((e) => e.playerId === String(p.id))) continue;
    out.push({
      playerId: String(p.id),
      name: playerCardName(p),
      status: rnd() > 0.45 ? "out" : "gtd",
      reason: reasons[Math.floor(rnd() * reasons.length)]!,
      returnEstimate: returns[Math.floor(rnd() * returns.length)]!,
    });
  }
  return out.sort((a, b) => {
    if (a.status !== b.status) return a.status === "out" ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}

/** BallDontLie `general?type=opponent` + four-factors 相当のモック */
type OppAllowedBox = {
  pts: number;
  fgPct: number;
  fg3Pct: number;
  ftPct: number;
  reb: number;
  ast: number;
  /** 相手の TOV（高い＝誘発できている） */
  tov: number;
  oreb: number;
  efgPct: number;
};

function allowedBoxFromRow(row: NbaLeagueTeamStatRow): OppAllowedBox {
  const rnd = mulberry32(hashSeed(`${row.teamId}:oppAllowed:v2`));
  /** DRTG が高いほど相手に楽に得点・高効率を許しやすい */
  const pressure = (row.drtg - 110) / 12;
  const j = () => (rnd() - 0.5) * 2;
  const fgPct = Math.max(
    0.42,
    Math.min(0.52, 0.465 + pressure * 0.025 + j() * 0.01)
  );
  const fg3Pct = Math.max(
    0.32,
    Math.min(0.42, 0.36 + pressure * 0.02 + j() * 0.012)
  );
  const ftPct = Math.max(
    0.72,
    Math.min(0.82, 0.775 + pressure * 0.01 + j() * 0.015)
  );
  const efgPct = Math.max(
    0.48,
    Math.min(0.58, fgPct + fg3Pct * 0.5 * 0.35 + j() * 0.008)
  );
  const reb = Math.max(40, Math.min(50, 44.5 + pressure * 1.2 + j() * 1.5));
  const oreb = Math.max(8.5, Math.min(14, 11.2 + pressure * 0.8 + j() * 0.9));
  const ast = Math.max(22, Math.min(30, 26 + pressure * 1.4 + j() * 1.2));
  /** 良い DF は相手 TOV を増やしやすい */
  const tov = Math.max(11, Math.min(17, 14.2 - pressure * 1.1 + j() * 1.0));
  return {
    pts: row.papg,
    fgPct: Math.round(fgPct * 1000) / 1000,
    fg3Pct: Math.round(fg3Pct * 1000) / 1000,
    ftPct: Math.round(ftPct * 1000) / 1000,
    reb: Math.round(reb * 10) / 10,
    ast: Math.round(ast * 10) / 10,
    tov: Math.round(tov * 10) / 10,
    oreb: Math.round(oreb * 10) / 10,
    efgPct: Math.round(efgPct * 1000) / 1000,
  };
}

function rankByValue(
  values: Array<{ teamId: string; value: number }>,
  lowerIsBetter: boolean
) {
  const sorted = [...values].sort((a, b) => {
    if (a.value === b.value) return a.teamId.localeCompare(b.teamId);
    return lowerIsBetter ? a.value - b.value : b.value - a.value;
  });
  const map = new Map<string, number>();
  sorted.forEach((r, i) => map.set(r.teamId, i + 1));
  return map;
}

/** BallDontLie opponent averages 相当（9 指標） */
function buildOpponentStats(teamId: string): NbaTeamOpponentAllowedMetric[] {
  const season = getNbaLeagueTeamStatsMock().season;
  const team = season.find((r) => r.teamId === teamId);
  if (!team) return [];

  const boxes = season.map((r) => ({
    teamId: r.teamId,
    box: allowedBoxFromRow(r),
  }));
  const pick = (key: keyof OppAllowedBox) =>
    boxes.map((b) => ({ teamId: b.teamId, value: b.box[key] }));

  const ranks = {
    pts: rankByValue(pick("pts"), true),
    fgPct: rankByValue(pick("fgPct"), true),
    fg3Pct: rankByValue(pick("fg3Pct"), true),
    ftPct: rankByValue(pick("ftPct"), true),
    reb: rankByValue(pick("reb"), true),
    ast: rankByValue(pick("ast"), true),
    tov: rankByValue(pick("tov"), false),
    oreb: rankByValue(pick("oreb"), true),
    efgPct: rankByValue(pick("efgPct"), true),
  };
  const box = allowedBoxFromRow(team);
  const pct = (v: number) => `${(v * 100).toFixed(1)}%`;
  const meta = (id: NbaTeamOpponentAllowedMetricId) =>
    NBA_TEAM_OPPONENT_ALLOWED_METRICS.find((m) => m.id === id)!;

  const mk = (
    id: NbaTeamOpponentAllowedMetricId,
    value: number,
    display: string,
    rank: number
  ): NbaTeamOpponentAllowedMetric => {
    const def = meta(id);
    return {
      id,
      short: def.short,
      value,
      display,
      leagueRank: rank,
      lowerIsBetter: def.lowerIsBetter,
      hintJa: def.hintJa,
      hintEn: def.hintEn,
    };
  };

  return [
    mk("pts_allowed", box.pts, box.pts.toFixed(1), ranks.pts.get(teamId) ?? 30),
    mk("fg_pct_allowed", box.fgPct, pct(box.fgPct), ranks.fgPct.get(teamId) ?? 30),
    mk(
      "fg3_pct_allowed",
      box.fg3Pct,
      pct(box.fg3Pct),
      ranks.fg3Pct.get(teamId) ?? 30
    ),
    mk("ft_pct_allowed", box.ftPct, pct(box.ftPct), ranks.ftPct.get(teamId) ?? 30),
    mk("reb_allowed", box.reb, box.reb.toFixed(1), ranks.reb.get(teamId) ?? 30),
    mk("ast_allowed", box.ast, box.ast.toFixed(1), ranks.ast.get(teamId) ?? 30),
    mk("tov_forced", box.tov, box.tov.toFixed(1), ranks.tov.get(teamId) ?? 30),
    mk(
      "oreb_allowed",
      box.oreb,
      box.oreb.toFixed(1),
      ranks.oreb.get(teamId) ?? 30
    ),
    mk(
      "efg_pct_allowed",
      box.efgPct,
      pct(box.efgPct),
      ranks.efgPct.get(teamId) ?? 30
    ),
  ];
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

/** Team Detail ロスター行 → Player Detail プレビュー用（ID から同一モック選手を復元） */
export function lookupTeamDetailRosterPlayer(
  playerId: string
): { player: NbaRosterPlayer; teamId: string } | null {
  const match = /^(.+)-p(\d+)$/.exec(playerId);
  if (!match) return null;
  const teamId = match[1]!;
  const block = buildRosterBlock(
    teamId,
    NBA_TEAM_NAME_BY_ID[teamId] ?? teamId,
    1
  );
  const player = block.players.find((p) => String(p.id) === playerId);
  if (!player) return null;
  return { player, teamId };
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
  const rosterBlock = buildRosterBlock(teamId, teamName, confRank);

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
    injuries: buildInjuries(teamId, rosterBlock),
    opponentStats: buildOpponentStats(teamId),
    conferenceSplit: buildConferenceSplit(teamId),
    homeAwaySplit: buildHomeAwaySplit(teamId),
    rosterBlock,
    payroll: buildPayroll(teamId, rosterBlock),
    asOfLabel: bundle.asOfLabel,
  };
}

function buildPayroll(
  teamId: string,
  roster: NbaRosterTeamBlock
): NbaTeamPayroll {
  const rnd = mulberry32(hashSeed(`${teamId}:payroll:v2`));
  const salaryCap = 140_588_000;
  const taxLine = 170_814_000;
  /** おおよそ $120M–$220M */
  const totalSalary = Math.round(120_000_000 + rnd() * 100_000_000);
  const guaranteed = Math.round(totalSalary * (0.88 + rnd() * 0.1));
  const capSpace = salaryCap - totalSalary;
  const overTax = Math.max(0, totalSalary - taxLine);
  const taxBill =
    overTax <= 0
      ? 0
      : Math.round(overTax * (1.5 + Math.min(2, overTax / 20_000_000)));
  const leagueRank = Math.max(1, Math.min(30, Math.round(1 + rnd() * 29)));

  const rosterPlayers = [...roster.players].sort((a, b) => {
    if (a.starter !== b.starter) return a.starter ? -1 : 1;
    return b.ppg - a.ppg;
  });
  const weights = rosterPlayers.map((p, i) => {
    const base = p.starter ? 1.35 - i * 0.08 : 0.55 - (i - 5) * 0.035;
    return Math.max(0.08, base + rnd() * 0.12);
  });
  const weightSum = weights.reduce((a, b) => a + b, 0) || 1;
  let allocated = 0;
  const lines: NbaTeamPayrollLine[] = rosterPlayers.map((p, i) => {
    const isLast = i === rosterPlayers.length - 1;
    const salary = isLast
      ? Math.max(0, totalSalary - allocated)
      : Math.round((totalSalary * weights[i]!) / weightSum);
    allocated += salary;
    return {
      playerId: String(p.id),
      name: playerCardName(p),
      salary,
      share: totalSalary > 0 ? salary / totalSalary : 0,
    };
  });
  lines.sort((a, b) => b.salary - a.salary);

  return {
    totalSalary,
    leagueRank,
    salaryCap,
    taxLine,
    capSpace,
    taxBill,
    guaranteed,
    lines,
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

const PAYROLL_SEG_FALLBACK = [
  "#5CF0B5",
  "#00E5FF",
  "#FCD34D",
  "#FF8A3D",
  "#B388FF",
] as const;

export type NbaTeamPayrollSlice = {
  key: string;
  label: string;
  salary: number;
  share: number;
  color: string;
};

/** 上位 N + OTHER の積み上げバー用スライス */
export function payrollDisplaySlices(
  lines: NbaTeamPayrollLine[],
  accent: string,
  topN = 5
): NbaTeamPayrollSlice[] {
  const top = lines.slice(0, topN);
  const rest = lines.slice(topN);
  const otherSalary = rest.reduce((s, l) => s + l.salary, 0);
  const otherShare = rest.reduce((s, l) => s + l.share, 0);
  const slices: NbaTeamPayrollSlice[] = top.map((l, i) => ({
    key: l.playerId,
    label: l.name,
    salary: l.salary,
    share: l.share,
    color:
      i === 0
        ? accent
        : PAYROLL_SEG_FALLBACK[(i - 1) % PAYROLL_SEG_FALLBACK.length]!,
  }));
  if (otherSalary > 0) {
    slices.push({
      key: "other",
      label: "OTHER",
      salary: otherSalary,
      share: otherShare,
      color: "rgba(255,255,255,0.22)",
    });
  }
  return slices;
}
