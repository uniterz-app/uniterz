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
import {
  formatMetricValue,
  getNbaLeagueTeamStatsMock,
  metricValue,
  NBA_LEAGUE_TEAM_STAT_METRICS,
  type NbaLeagueTeamStatMetric,
  type NbaLeagueTeamStatRow,
  type NbaLeagueTeamStatsBundle,
  type NbaLeagueTeamStatWindow,
} from "@/lib/predict/nbaLeagueTeamStatsMocks";
import { nbaSeasonStatsReady } from "@/lib/predict/nbaSeasonStatsReady";
import { nbaConferenceForTeam } from "@/lib/nba/nbaConferenceTeams";

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

export type NbaTeamHeadToHeadEntry = {
  oppTeamId: string;
  oppAbbr: string;
  wins: number;
  losses: number;
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
  /** 相手の試合時点勝率による強弱スプリット（nbaTeamSeasonRecords） */
  strengthSplit: {
    vsOver500: { wins: number; losses: number };
    vsUnder500: { wins: number; losses: number };
  };
  /** 相手別 W-L（game log overlay） */
  headToHead: NbaTeamHeadToHeadEntry[];
  /** 予想入力ロスターと同じ形（ライブは overlay で上書き） */
  rosterBlock: NbaRosterTeamBlock;
  /** 今季チームペイロール（ライブは overlay で上書き） */
  payroll: NbaTeamPayroll;
  asOfLabel: string;
};

export type NbaTeamInjuryEntry = {
  playerId: string;
  name: string;
  /** BDL 由来（Available 以外）。旧データは gtd → questionable として読む */
  status:
    | "out"
    | "doubtful"
    | "questionable"
    | "probable"
    | "day-to-day";
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

export type NbaApronStatus =
  | "under_cap"
  | "over_cap"
  | "tax_payer"
  | "first_apron"
  | "second_apron";

export type NbaTeamFuturePayrollYear = {
  seasonKey: string;
  seasonYear: number;
  salaryCap: number;
  taxLine: number;
  firstApron: number;
  secondApron: number;
  committedSalary: number;
  capSpace: number;
  taxSpace: number;
  firstApronSpace: number;
  secondApronSpace: number;
  apronStatus: NbaApronStatus;
  playerCount: number;
  lines: NbaTeamPayrollLine[];
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
  /** 1st エプロン */
  firstApron?: number;
  /** 2nd エプロン */
  secondApron?: number;
  /** エプロン超過ステータス */
  apronStatus?: NbaApronStatus;
  /** キャップ余裕（マイナス=オーバー） */
  capSpace: number;
  /** タックスラインまでの余裕（マイナス=超過） */
  taxSpace?: number;
  /** 1st エプロンまでの余裕（マイナス=超過） */
  firstApronSpace?: number;
  /** 2nd エプロンまでの余裕（マイナス=超過） */
  secondApronSpace?: number;
  /** タックス概算（非課税なら 0） */
  taxBill: number;
  /** 保証額合計 */
  guaranteed: number;
  /** 選手別内訳（年俸降順） */
  lines: NbaTeamPayrollLine[];
  /** 将来シーズン別ペイロール */
  futureYears?: NbaTeamFuturePayrollYear[];
};

export type NbaTeamPayrollLine = {
  playerId: string;
  /** 表示名（例: L.DONCIC） */
  name: string;
  salary: number;
  /** 総年俸に占める割合 0–1 */
  share: number;
  /** 2-Way 契約フラグ（サラリーキャップ非算入） */
  isTwoWay?: boolean;
  /** Player Option (PO) / Team Option (TO) などのオプション種別 */
  option?: "PO" | "TO" | "MO" | null;
};

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

/** BallDontLie `general?type=opponent` + four-factors 相当 */
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
  return {
    pts: row.papg,
    fgPct: row.oppFgPct,
    fg3Pct: row.oppFg3Pct,
    ftPct: row.oppFtPct,
    reb: row.oppReb,
    ast: row.oppAst,
    tov: row.oppTov,
    oreb: row.oppOreb,
    efgPct: row.oppEfgPct,
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
function buildOpponentStats(
  teamId: string,
  bundle: NbaLeagueTeamStatsBundle
): NbaTeamOpponentAllowedMetric[] {
  const season = bundle.season;
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

/** Team Detail ロスター行 → Player Detail プレビュー用（ライブ roster から復元） */
export function lookupTeamDetailRosterPlayer(
  _playerId: string
): { player: NbaRosterPlayer; teamId: string } | null {
  return null;
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
export function defaultTeamDetailPreviewTeamId(
  bundle: NbaLeagueTeamStatsBundle = getNbaLeagueTeamStatsMock()
): string {
  const season = bundle.season;
  const sorted = [...season].sort((a, b) => b.netrtg - a.netrtg);
  return sorted[2]?.teamId ?? sorted[0]?.teamId ?? "nba-lakers";
}


const EMPTY_WL = { wins: 0, losses: 0 } as const;

function emptyConferenceSplit() {
  return {
    vsEast: { ...EMPTY_WL },
    vsWest: { ...EMPTY_WL },
  };
}

function emptyHomeAwaySplit() {
  return {
    home: { ...EMPTY_WL },
    away: { ...EMPTY_WL },
  };
}

function emptyStrengthSplit() {
  return {
    vsOver500: { ...EMPTY_WL },
    vsUnder500: { ...EMPTY_WL },
  };
}

function emptyRosterBlock(teamId: string, teamName: string): NbaRosterTeamBlock {
  return {
    teamId,
    teamName,
    side: "home",
    seed: null,
    activeCount: 0,
    rosterCount: 0,
    players: [],
  };
}

function emptyPayroll(): NbaTeamPayroll {
  return {
    totalSalary: 0,
    leagueRank: 30,
    salaryCap: 154_647_000,
    taxLine: 187_895_000,
    firstApron: 195_945_000,
    secondApron: 207_824_000,
    apronStatus: "under_cap",
    capSpace: 154_647_000,
    taxSpace: 187_895_000,
    firstApronSpace: 195_945_000,
    secondApronSpace: 207_824_000,
    taxBill: 0,
    guaranteed: 0,
    lines: [],
    futureYears: [],
  };
}

function zeroMetricDefs(teamId: string): NbaTeamMetricWithRank[] {
  // buildMetrics([], id) returns []; keep a zero skeleton from defs if available
  const rows = buildMetrics([], teamId);
  if (rows.length > 0) return rows;
  return NBA_LEAGUE_TEAM_STAT_METRICS.map((def) => ({
    id: def.id,
    short: def.short,
    value: 0,
    display: formatMetricValue(def.id, 0),
    leagueRank: 30,
    higherIsBetter: def.higherIsBetter,
  }));
}

/**
 * ライブのリーグ表が空／当該チーム無し（開幕前 empty など）のとき
 * モックで骨組みを組む。見つからなければ throw せず最小プレビューを返す。
 */
function resolveTeamDetailBundle(
  teamId: string,
  bundle: NbaLeagueTeamStatsBundle
): {
  working: NbaLeagueTeamStatsBundle;
  seasonRow: NbaLeagueTeamStatRow;
} | null {
  // モックリーグ表には落とさない。ライブに当該チームがあるときだけ使う。
  const fromLive = bundle.season.find((r) => r.teamId === teamId);
  if (!fromLive) return null;
  return { working: bundle, seasonRow: fromLive };
}

function zeroTeamDetailSeasonStats(
  detail: NbaTeamDetailPreview
): NbaTeamDetailPreview {
  const zeroMetrics = (
    rows: NbaTeamMetricWithRank[]
  ): NbaTeamMetricWithRank[] =>
    rows.map((m) => ({
      ...m,
      value: 0,
      display: formatMetricValue(m.id, 0),
      leagueRank: 30,
    }));
  const emptyRecord = { wins: 0, losses: 0 };
  return {
    ...detail,
    season: { wins: 0, losses: 0, winPct: 0 },
    last10Record: { wins: 0, losses: 0 },
    streak: { kind: "W", count: 0 },
    recentGames: [],
    upcomingGames: [],
    injuries: [],
    metrics: {
      season: zeroMetrics(detail.metrics.season),
      last10: zeroMetrics(detail.metrics.last10),
    },
    opponentStats: detail.opponentStats.map((m) => ({
      ...m,
      value: 0,
      display: m.id.includes("pct") ? "0.0%" : "0.0",
      leagueRank: 30,
    })),
    conferenceSplit: {
      vsEast: { ...emptyRecord },
      vsWest: { ...emptyRecord },
    },
    homeAwaySplit: {
      home: { ...emptyRecord },
      away: { ...emptyRecord },
    },
    strengthSplit: {
      vsOver500: { ...emptyRecord },
      vsUnder500: { ...emptyRecord },
    },
    headToHead: [],
    asOfLabel: "PRESEASON · 2026-27",
  };
}

function buildMinimalTeamDetailPreview(
  teamId: string
): NbaTeamDetailPreview {
  const teamName = NBA_TEAM_NAME_BY_ID[teamId] ?? teamId;
  const conference = nbaConferenceForTeam(teamId) ?? "west";
  const [cityEn, nickEn] = splitTeamNameByLeague("nba", teamName);
  const divisionId: NbaDivisionId =
    NBA_TEAM_US_GEO[teamId]?.division ?? "pacific";
  const divLabel = NBA_DIVISION_LABEL[divisionId];
  const rosterBlock = emptyRosterBlock(teamId, teamName);
  const emptyMetrics = zeroMetricDefs(teamId);
  const lean = resolveLean(emptyMetrics);
  return {
    teamId,
    teamName,
    teamAbbr: TEAM_SHORT[teamId] ?? teamId,
    cityEn: cityEn || teamName,
    nickEn: nickEn || getMobileTeamNameFallback(teamName),
    conference,
    conferenceRank: 15,
    divisionId,
    divisionLabelJa: divLabel.ja,
    divisionLabelEn: divLabel.en,
    season: { wins: 0, losses: 0, winPct: 0 },
    last10Record: { wins: 0, losses: 0 },
    streak: { kind: "W", count: 0 },
    ...lean,
    metrics: { season: emptyMetrics, last10: emptyMetrics },
    recentGames: [],
    upcomingGames: [],
    injuries: [],
    opponentStats: [],
    conferenceSplit: emptyConferenceSplit(),
    homeAwaySplit: emptyHomeAwaySplit(),
    strengthSplit: emptyStrengthSplit(),
    headToHead: [],
    rosterBlock,
    payroll: emptyPayroll(),
    asOfLabel: "PRESEASON · 2026-27",
  };
}

function last10RowHasData(row: NbaLeagueTeamStatRow | undefined): boolean {
  if (!row) return false;
  return row.wins + row.losses > 0 || row.ppg > 0;
}

/**
 * チーム詳細プレビュー。
 * ベースは 0 / 空。W–L / 順位は live overlay が BDL standings で上書き。
 * ROSTER / PAYROLL / 試合ログ（form・H2H）/ injuries は各 API overlay。
 */
export function getNbaTeamDetailPreview(
  teamId?: string,
  bundle: NbaLeagueTeamStatsBundle = { season: [], last10: [], asOfLabel: "" }
): NbaTeamDetailPreview {
  const resolvedId =
    teamId ||
    defaultTeamDetailPreviewTeamId(
      bundle.season.length > 0 ? bundle : { season: [], last10: [], asOfLabel: "" }
    ) ||
    "nba-lakers";

  const resolved = resolveTeamDetailBundle(resolvedId, bundle);
  if (!resolved || !nbaSeasonStatsReady()) {
    const minimal = buildMinimalTeamDetailPreview(resolvedId);
    return zeroTeamDetailSeasonStats(minimal);
  }

  const { working, seasonRow } = resolved;
  const seasonMetrics = buildMetrics(working.season, resolvedId);
  const lean = resolveLean(seasonMetrics.length ? seasonMetrics : zeroMetricDefs(resolvedId));
  const [cityEn, nickEn] = splitTeamNameByLeague("nba", seasonRow.teamName);
  const divisionId: NbaDivisionId =
    NBA_TEAM_US_GEO[resolvedId]?.division ?? "pacific";
  const divLabel = NBA_DIVISION_LABEL[divisionId];

  const confRank = conferenceRankAmong(
    working.season,
    resolvedId,
    seasonRow.conference
  );
  const teamName = NBA_TEAM_NAME_BY_ID[resolvedId] ?? seasonRow.teamName;
  const last10Row = working.last10.find((r) => r.teamId === resolvedId);
  const last10Metrics = last10RowHasData(last10Row)
    ? buildMetrics(working.last10, resolvedId)
    : zeroMetricDefs(resolvedId);

  return {
    teamId: resolvedId,
    teamName,
    teamAbbr: TEAM_SHORT[resolvedId] ?? resolvedId,
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
    // 試合ログ / form / splits / last10 勝敗は overlay が games から埋める（無ければ 0）
    last10Record: { wins: 0, losses: 0 },
    streak: { kind: "W", count: 0 },
    ...lean,
    metrics: {
      season: seasonMetrics.length ? seasonMetrics : zeroMetricDefs(resolvedId),
      last10: last10Metrics.length ? last10Metrics : zeroMetricDefs(resolvedId),
    },
    recentGames: [],
    upcomingGames: [],
    // injury は live overlay が上書き（無ければ no-data UI）
    injuries: [],
    opponentStats: buildOpponentStats(resolvedId, working),
    conferenceSplit: emptyConferenceSplit(),
    homeAwaySplit: emptyHomeAwaySplit(),
    strengthSplit: emptyStrengthSplit(),
    headToHead: [],
    rosterBlock: emptyRosterBlock(resolvedId, teamName),
    payroll: emptyPayroll(),
    asOfLabel: working.asOfLabel,
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
  isTwoWay?: boolean;
  option?: "PO" | "TO" | "MO" | null;
};

/**
 * ペイロール積み上げバー / リスト用スライス。
 * `topN` 省略時は全員表示（OTHER なし）。数値を渡すと上位 N + OTHER。
 */
export function payrollDisplaySlices(
  lines: NbaTeamPayrollLine[],
  accent: string,
  topN?: number
): NbaTeamPayrollSlice[] {
  const colorAt = (i: number) =>
    i === 0
      ? accent
      : PAYROLL_SEG_FALLBACK[(i - 1) % PAYROLL_SEG_FALLBACK.length]!;

  // 契約がある選手（給与 > 0）または 2-Way 選手のみをペイロール内訳に表示
  const activeLines = lines.filter((l) => l.salary > 0 || l.isTwoWay === true);

  if (topN == null || topN >= activeLines.length) {
    return activeLines.map((l, i) => ({
      key: l.playerId,
      label: l.name,
      salary: l.salary,
      share: l.share,
      color: colorAt(i),
      isTwoWay: l.isTwoWay === true,
      option: l.option ?? null,
    }));
  }

  const top = activeLines.slice(0, topN);
  const rest = activeLines.slice(topN);
  const otherSalary = rest.reduce((s, l) => s + l.salary, 0);
  const otherShare = rest.reduce((s, l) => s + l.share, 0);
  const slices: NbaTeamPayrollSlice[] = top.map((l, i) => ({
    key: l.playerId,
    label: l.name,
    salary: l.salary,
    share: l.share,
    color: colorAt(i),
    isTwoWay: l.isTwoWay === true,
    option: l.option ?? null,
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
