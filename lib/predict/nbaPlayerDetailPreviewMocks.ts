import { TEAM_SHORT } from "@/lib/team-short";
import { NBA_TEAM_NAME_BY_ID } from "@/lib/nba-team-names";
import {
  NBA_EAST_TEAM_IDS,
  type NbaConferenceId,
} from "@/lib/nba/nbaConferenceTeams";
import { lookupTeamDetailRosterPlayer } from "@/lib/predict/nbaTeamDetailPreviewMocks";
import { nbaSeasonStatsReady } from "@/lib/predict/nbaSeasonStatsReady";
import type { NbaRosterPlayer } from "@/lib/predict/nbaRoster";
import type { NbaPlayerLeaderMetricId } from "@/lib/predict/nbaPlayerStatLeadersMocks";
import type { NbaPlayerSeasonMetricCell } from "@/lib/nba/playerSeasonMetrics/playerSeasonMetricsTypes";

/**
 * Player Detail 叩き台モック。
 * BDL: players / season_averages / stats / contracts/players(+aggregate)
 */

export type NbaPlayerSeasonMetricId =
  | "pts"
  | "reb"
  | "ast"
  | "stl"
  | "blk"
  | "tov"
  | "min"
  | "fg_pct"
  | "fga"
  | "fg3_pct"
  | "fg3m"
  | "fg3a"
  | "ft_pct"
  | "plus_minus";

/** 詳細のシーズン平均グリッドに出す順（リーグ BASIC の試投を含む） */
export const NBA_PLAYER_DETAIL_SEASON_SHOWN: readonly NbaPlayerSeasonMetricId[] =
  [
    "pts",
    "reb",
    "ast",
    "stl",
    "blk",
    "tov",
    "min",
    "plus_minus",
    "fg_pct",
    "fga",
    "fg3_pct",
    "fg3m",
    "fg3a",
    "ft_pct",
  ];

export type NbaPlayerSeasonMetric = {
  id: NbaPlayerSeasonMetricId;
  short: string;
  value: number;
  display: string;
  leagueRank: number;
  higherIsBetter: boolean;
};

export type NbaPlayerGameLog = {
  gameId: string;
  dateLabel: string;
  oppTeamId: string;
  oppAbbr: string;
  home: boolean;
  result: "W" | "L";
  min: number;
  pts: number;
  reb: number;
  ast: number;
  stl: number;
  blk: number;
  tov: number;
  fgm: number;
  fga: number;
  fg3m: number;
  fg3a: number;
  ftm: number;
  fta: number;
  plusMinus: number;
};

/** キャリアのシーズン平均 1 行（BRef Per Game 相当・プレビュー） */
export type NbaPlayerCareerSeasonRow = {
  /** シーズン開始年（例: 2024 → 2024-25） */
  seasonStart: number;
  age: number;
  teamId: string;
  teamAbbr: string;
  position: string;
  games: number;
  /** null = BDL から確定できない（UI は "—"） */
  gamesStarted: number | null;
  min: number;
  fgm: number;
  fga: number;
  fgPct: number;
  fg3m: number;
  fg3a: number;
  fg3Pct: number;
  ftm: number;
  fta: number;
  ftPct: number;
  reb: number;
  ast: number;
  stl: number;
  blk: number;
  tov: number;
  pts: number;
};

export type NbaPlayerCareerSeasonBoard = "regular" | "playoffs";

/** 2018 → "2018-19" */
export function formatCareerSeasonLabel(seasonStart: number): string {
  const end = String(seasonStart + 1).slice(-2);
  return `${seasonStart}-${end}`;
}

export type NbaPlayerContractSeason = {
  /** シーズン開始年（例: 2027 → 27-28） */
  season: number;
  baseSalary: number;
  capHit: number;
  salaryRank: number;
  teamId: string;
  teamAbbr: string;
  /** Player / Team option など */
  option?: "PO" | "TO" | null;
};

export type NbaPlayerContractSummary = {
  contractType: string;
  contractStatus: string;
  /** 契約全長（参考） */
  contractYears: number;
  /** 今季を含む残年数 */
  yearsRemaining: number;
  /** FA になる年（最終シーズン翌年） */
  freeAgencyYear: number;
  freeAgencyType: "UFA" | "RFA" | null;
  averageSalary: number;
  totalValue: number;
  /** 残契約の保証額合計（概算） */
  remainingGuaranteed: number;
  notes: string[];
  draftRound?: number | null;
  draftYear?: number | null;
  /** 残シーズン（昇順） */
  seasons: NbaPlayerContractSeason[];
};

/** 2027 → "27-28" */
export function formatContractSeasonLabel(seasonStart: number): string {
  const a = String(seasonStart).slice(-2);
  const b = String(seasonStart + 1).slice(-2);
  return `${a}-${b}`;
}

/** BDL shooting by_zone 相当の簡易ゾーン */
export type NbaPlayerShotZoneId =
  | "restricted"
  | "paint"
  | "mid"
  | "left_corner_3"
  | "right_corner_3"
  | "above_break_3";

export type NbaPlayerShotZone = {
  id: NbaPlayerShotZoneId;
  short: string;
  label: string;
  fgPct: number;
  fga: number;
};

export type NbaPlayerAdvancedMetricId = "per" | "ts_pct" | "usg";

export type NbaPlayerAdvancedMetric = {
  id: NbaPlayerAdvancedMetricId;
  short: string;
  value: number;
  display: string;
  leagueRank: number;
  hintJa: string;
  hintEn: string;
};

export type NbaPlayerDetailPreview = {
  playerId: string;
  /** 表示用 UID（例: 8829-X） */
  uidLabel: string;
  firstName: string;
  lastName: string;
  jerseyNumber: string;
  position: string;
  /** 経験年数（ドラフトからの概算） */
  experienceYears: number;
  height: string;
  weight: string;
  college: string | null;
  country: string | null;
  draftYear: number | null;
  draftRound: number | null;
  draftNumber: number | null;
  teamId: string;
  teamAbbr: string;
  teamName: string;
  conference: NbaConferenceId;
  season: {
    gamesPlayed: number;
    min: number;
    pts: number;
    reb: number;
    ast: number;
    stl: number;
    blk: number;
    tov: number;
    fgPct: number;
    fg3Pct: number;
    ftPct: number;
    plusMinus: number;
    fga: number;
    fg3m: number;
    fg3a: number;
  };
  /** PTS / REB / AST ハイライト用（リーグ順位つき） */
  headlineMetrics: NbaPlayerSeasonMetric[];
  /** シーズン平均グリッド */
  seasonMetrics: NbaPlayerSeasonMetric[];
  /** PER / TS% / USG */
  advancedMetrics: NbaPlayerAdvancedMetric[];
  /** キャリア・シーズン平均（Regular / Playoffs） */
  careerSeasons: {
    regular: NbaPlayerCareerSeasonRow[];
    playoffs: NbaPlayerCareerSeasonRow[];
  };
  /** ゾーン別 FG%（簡易ヒート） */
  shotZones: NbaPlayerShotZone[];
  gameLogs: NbaPlayerGameLog[];
  contract: NbaPlayerContractSummary | null;
  /** キャリアアワード（回数付き） */
  awards: NbaPlayerAward[];
  /** 出場状況（Active 以外のとき UI 表示） */
  availability: NbaPlayerAvailability;
  /** ISO 日付 `YYYY-MM-DD` */
  birthDate: string | null;
  /** 所属履歴（古い順。現所属を含む） */
  teamHistory: NbaPlayerTeamStint[];
  /** ホーム / アウェイ別（今季出場試合の平均） */
  venueSplits: NbaPlayerVenueSplit[];
  /** 対戦相手別（今季出場試合の平均） */
  vsOpponentSamples: NbaPlayerVsOpponentSample[];
  /**
   * 今季メトリクス（value + リーグ順位）。リーグ表 Top30 と別スナップショット。
   * How They Play / 詳細順位の正。無いときは leaders Top30 にフォールバック。
   */
  leaderMetrics: Partial<
    Record<NbaPlayerLeaderMetricId, NbaPlayerSeasonMetricCell>
  >;
  asOfLabel: string;
};

export type NbaPlayerVenueSplit = {
  venue: "home" | "away";
  games: number;
  min: number;
  pts: number;
  reb: number;
  ast: number;
  plusMinus: number;
};

export type NbaPlayerVsOpponentSample = {
  oppTeamId: string;
  oppAbbr: string;
  games: number;
  pts: number;
  reb: number;
  ast: number;
  plusMinus: number;
};

export type NbaPlayerAward = {
  id: string;
  label: string;
  count: number;
};

/** 予想向けの簡易出場ステータス */
export type NbaPlayerAvailabilityStatus = "active" | "out" | "gtd";

export type NbaPlayerAvailability = {
  status: NbaPlayerAvailabilityStatus;
  /** 怪我・欠場理由（例: Ankle sprain） */
  reason: string | null;
  /** 復帰見込み（例: Day-to-day / 2 weeks） */
  returnEstimate: string | null;
};

export type NbaPlayerTeamStint = {
  teamId: string;
  teamAbbr: string;
  /** シーズン開始年（例: 2018 → 18-19） */
  fromSeason: number;
  /** 最終シーズン開始年。null は現所属 */
  toSeason: number | null;
};

const METRIC_DEFS: Array<{
  id: NbaPlayerSeasonMetricId;
  short: string;
  higherIsBetter: boolean;
  kind: "perGame" | "pct" | "minutes" | "plusMinus";
}> = [
  { id: "pts", short: "PTS", higherIsBetter: true, kind: "perGame" },
  { id: "reb", short: "REB", higherIsBetter: true, kind: "perGame" },
  { id: "ast", short: "AST", higherIsBetter: true, kind: "perGame" },
  { id: "stl", short: "STL", higherIsBetter: true, kind: "perGame" },
  { id: "blk", short: "BLK", higherIsBetter: true, kind: "perGame" },
  { id: "tov", short: "TOV", higherIsBetter: false, kind: "perGame" },
  { id: "min", short: "MIN", higherIsBetter: true, kind: "minutes" },
  {
    id: "plus_minus",
    short: "+/-",
    higherIsBetter: true,
    kind: "plusMinus",
  },
  { id: "fg_pct", short: "FG%", higherIsBetter: true, kind: "pct" },
  { id: "fga", short: "FGA", higherIsBetter: true, kind: "perGame" },
  { id: "fg3_pct", short: "3P%", higherIsBetter: true, kind: "pct" },
  { id: "fg3m", short: "3PM", higherIsBetter: true, kind: "perGame" },
  { id: "fg3a", short: "3PA", higherIsBetter: true, kind: "perGame" },
  { id: "ft_pct", short: "FT%", higherIsBetter: true, kind: "pct" },
];

type SeedProfile = {
  playerId: string;
  firstName: string;
  lastName: string;
  jerseyNumber: string;
  position: string;
  experienceYears: number;
  height: string;
  weight: string;
  college: string | null;
  country: string;
  draftYear: number;
  draftRound: number;
  draftNumber: number;
  teamId: string;
  season: NbaPlayerDetailPreview["season"];
  ranks: Partial<Record<NbaPlayerSeasonMetricId, number>>;
  advanced?: Partial<
    Record<NbaPlayerAdvancedMetricId, { value: number; rank: number }>
  >;
  shotZones?: NbaPlayerShotZone[];
  contract: NbaPlayerContractSummary;
  awards: NbaPlayerAward[];
  availability: NbaPlayerAvailability;
  birthDate: string;
  teamHistory: NbaPlayerTeamStint[];
};

const LUKA: SeedProfile = {
  playerId: "132",
  firstName: "Luka",
  lastName: "Dončić",
  jerseyNumber: "77",
  position: "G-F",
  experienceYears: 6,
  height: "6-7",
  weight: "230",
  college: null,
  country: "Slovenia",
  draftYear: 2018,
  draftRound: 1,
  draftNumber: 3,
  teamId: "nba-lakers",
  season: {
    gamesPlayed: 50,
    min: 37.2,
    pts: 28.4,
    reb: 8.1,
    ast: 8.6,
    stl: 1.3,
    blk: 0.4,
    tov: 3.9,
    fgPct: 0.462,
    fg3Pct: 0.348,
    ftPct: 0.782,
    plusMinus: 4.1,
    fga: 22.4,
    fg3m: 3.4,
    fg3a: 9.8,
  },
  ranks: {
    pts: 4,
    reb: 28,
    ast: 6,
    stl: 22,
    blk: 140,
    tov: 8,
    min: 3,
    fg_pct: 72,
    fga: 4,
    fg3_pct: 95,
    fg3m: 18,
    fg3a: 12,
    ft_pct: 110,
    plus_minus: 35,
  },
  advanced: {
    per: { value: 27.8, rank: 5 },
    ts_pct: { value: 0.568, rank: 48 },
    usg: { value: 0.342, rank: 6 },
  },
  shotZones: [
    { id: "restricted", short: "RA", label: "Restricted Area", fgPct: 0.72, fga: 210 },
    { id: "paint", short: "PAINT", label: "In Paint (Non-RA)", fgPct: 0.52, fga: 180 },
    { id: "mid", short: "MID", label: "Mid-Range", fgPct: 0.38, fga: 160 },
    { id: "left_corner_3", short: "LC3", label: "Left Corner 3", fgPct: 0.28, fga: 45 },
    { id: "right_corner_3", short: "RC3", label: "Right Corner 3", fgPct: 0.30, fga: 40 },
    { id: "above_break_3", short: "AB3", label: "Above the Break 3", fgPct: 0.33, fga: 320 },
  ],
  contract: {
    contractType: "Rookie Max Extension",
    contractStatus: "ACTIVE",
    contractYears: 5,
    yearsRemaining: 5,
    freeAgencyYear: 2030,
    freeAgencyType: "UFA",
    averageSalary: 43_000_000,
    totalValue: 215_000_000,
    remainingGuaranteed: 215_000_000,
    notes: ["Supermax eligibility path"],
    seasons: [
      {
        season: 2025,
        baseSalary: 48_967_020,
        capHit: 48_967_020,
        salaryRank: 12,
        teamId: "nba-lakers",
        teamAbbr: "LAL",
      },
      {
        season: 2026,
        baseSalary: 52_800_000,
        capHit: 52_800_000,
        salaryRank: 10,
        teamId: "nba-lakers",
        teamAbbr: "LAL",
      },
      {
        season: 2027,
        baseSalary: 56_700_000,
        capHit: 56_700_000,
        salaryRank: 8,
        teamId: "nba-lakers",
        teamAbbr: "LAL",
      },
      {
        season: 2028,
        baseSalary: 60_600_000,
        capHit: 60_600_000,
        salaryRank: 7,
        teamId: "nba-lakers",
        teamAbbr: "LAL",
        option: "PO",
      },
      {
        season: 2029,
        baseSalary: 64_500_000,
        capHit: 64_500_000,
        salaryRank: 6,
        teamId: "nba-lakers",
        teamAbbr: "LAL",
      },
    ],
  },
  awards: [
    { id: "mvp", label: "MVP", count: 2 },
    { id: "fmvp", label: "Finals MVP", count: 1 },
    { id: "all_star", label: "All-Star", count: 8 },
    { id: "all_nba_1st", label: "All-NBA First Team", count: 4 },
    { id: "all_def", label: "All-Defensive", count: 5 },
    { id: "dpoy", label: "DPOY", count: 1 },
    { id: "roy", label: "ROY", count: 1 },
  ],
  birthDate: "1999-02-28",
  availability: {
    status: "gtd",
    reason: "Left ankle sprain",
    returnEstimate: "Day-to-day",
  },
  teamHistory: [
    {
      teamId: "nba-mavericks",
      teamAbbr: "DAL",
      fromSeason: 2018,
      toSeason: 2024,
    },
    {
      teamId: "nba-lakers",
      teamAbbr: "LAL",
      fromSeason: 2025,
      toSeason: null,
    },
  ],
};

const CURRY: SeedProfile = {
  playerId: "115",
  firstName: "Stephen",
  lastName: "Curry",
  jerseyNumber: "30",
  position: "G",
  experienceYears: 15,
  height: "6-2",
  weight: "185",
  college: "Davidson",
  country: "USA",
  draftYear: 2009,
  draftRound: 1,
  draftNumber: 7,
  teamId: "nba-warriors",
  season: {
    gamesPlayed: 62,
    min: 32.4,
    pts: 24.8,
    reb: 4.5,
    ast: 6.1,
    stl: 0.9,
    blk: 0.3,
    tov: 2.8,
    fgPct: 0.453,
    fg3Pct: 0.411,
    ftPct: 0.923,
    plusMinus: 5.2,
    fga: 19.2,
    fg3m: 4.6,
    fg3a: 11.2,
  },
  ranks: {
    pts: 8,
    reb: 92,
    ast: 18,
    stl: 74,
    blk: 180,
    tov: 40,
    min: 45,
    fg_pct: 88,
    fga: 12,
    fg3_pct: 12,
    fg3m: 2,
    fg3a: 3,
    ft_pct: 3,
    plus_minus: 22,
  },
  advanced: {
    per: { value: 21.4, rank: 22 },
    ts_pct: { value: 0.621, rank: 12 },
    usg: { value: 0.298, rank: 28 },
  },
  contract: {
    contractType: "Veteran Extension",
    contractStatus: "ACTIVE",
    contractYears: 4,
    yearsRemaining: 2,
    freeAgencyYear: 2027,
    freeAgencyType: "UFA",
    averageSalary: 55_761_217,
    totalValue: 223_044_868,
    remainingGuaranteed: 115_000_000,
    notes: ["Player Option remaining on final year"],
    seasons: [
      {
        season: 2025,
        baseSalary: 59_606_817,
        capHit: 59_606_817,
        salaryRank: 6,
        teamId: "nba-warriors",
        teamAbbr: "GSW",
      },
      {
        season: 2026,
        baseSalary: 62_606_817,
        capHit: 62_606_817,
        salaryRank: 5,
        teamId: "nba-warriors",
        teamAbbr: "GSW",
        option: "PO",
      },
    ],
  },
  awards: [
    { id: "mvp", label: "MVP", count: 2 },
    { id: "fmvp", label: "Finals MVP", count: 1 },
    { id: "all_star", label: "All-Star", count: 11 },
    { id: "all_nba_1st", label: "All-NBA First Team", count: 4 },
    { id: "roy", label: "ROY", count: 0 },
  ].filter((a) => a.count > 0),
  birthDate: "1988-03-14",
  availability: {
    status: "active",
    reason: null,
    returnEstimate: null,
  },
  teamHistory: [
    {
      teamId: "nba-warriors",
      teamAbbr: "GSW",
      fromSeason: 2009,
      toSeason: null,
    },
  ],
};

const JOKIC: SeedProfile = {
  playerId: "246",
  firstName: "Nikola",
  lastName: "Jokic",
  jerseyNumber: "15",
  position: "C",
  experienceYears: 9,
  height: "6-11",
  weight: "284",
  college: null,
  country: "Serbia",
  draftYear: 2014,
  draftRound: 2,
  draftNumber: 41,
  teamId: "nba-nuggets",
  season: {
    gamesPlayed: 58,
    min: 36.1,
    pts: 29.2,
    reb: 12.8,
    ast: 10.1,
    stl: 1.5,
    blk: 0.8,
    tov: 3.4,
    fgPct: 0.576,
    fg3Pct: 0.418,
    ftPct: 0.817,
    plusMinus: 9.4,
    fga: 18.1,
    fg3m: 1.8,
    fg3a: 4.3,
  },
  ranks: {
    pts: 3,
    reb: 2,
    ast: 2,
    stl: 12,
    blk: 55,
    tov: 18,
    min: 8,
    fg_pct: 6,
    fga: 16,
    fg3_pct: 28,
    fg3m: 84,
    fg3a: 90,
    ft_pct: 95,
    plus_minus: 4,
  },
  advanced: {
    per: { value: 32.1, rank: 1 },
    ts_pct: { value: 0.648, rank: 4 },
    usg: { value: 0.312, rank: 18 },
  },
  contract: {
    contractType: "Supermax Extension",
    contractStatus: "ACTIVE",
    contractYears: 5,
    yearsRemaining: 3,
    freeAgencyYear: 2028,
    freeAgencyType: "UFA",
    averageSalary: 62_000_000,
    totalValue: 310_000_000,
    remainingGuaranteed: 175_000_000,
    notes: ["Designated Supermax"],
    seasons: [
      {
        season: 2025,
        baseSalary: 55_445_026,
        capHit: 55_445_026,
        salaryRank: 9,
        teamId: "nba-nuggets",
        teamAbbr: "DEN",
      },
      {
        season: 2026,
        baseSalary: 59_769_000,
        capHit: 59_769_000,
        salaryRank: 8,
        teamId: "nba-nuggets",
        teamAbbr: "DEN",
      },
      {
        season: 2027,
        baseSalary: 64_100_000,
        capHit: 64_100_000,
        salaryRank: 7,
        teamId: "nba-nuggets",
        teamAbbr: "DEN",
      },
    ],
  },
  awards: [
    { id: "mvp", label: "MVP", count: 3 },
    { id: "fmvp", label: "Finals MVP", count: 1 },
    { id: "all_star", label: "All-Star", count: 7 },
    { id: "all_nba_1st", label: "All-NBA First Team", count: 4 },
  ],
  birthDate: "1995-02-19",
  availability: {
    status: "out",
    reason: "Right knee hyperextension",
    returnEstimate: "1–2 weeks",
  },
  teamHistory: [
    {
      teamId: "nba-nuggets",
      teamAbbr: "DEN",
      fromSeason: 2015,
      toSeason: null,
    },
  ],
};

const SEEDS: Record<string, SeedProfile> = {
  [LUKA.playerId]: LUKA,
  [CURRY.playerId]: CURRY,
  [JOKIC.playerId]: JOKIC,
};

export function listNbaPlayerDetailPreviewSeeds(): Array<{
  playerId: string;
  firstName: string;
  lastName: string;
  teamId: string;
}> {
  return Object.values(SEEDS).map((s) => ({
    playerId: s.playerId,
    firstName: s.firstName,
    lastName: s.lastName,
    teamId: s.teamId,
  }));
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

export function formatMetricDisplay(
  id: NbaPlayerSeasonMetricId,
  value: number
): string {
  if (id === "fg_pct" || id === "fg3_pct" || id === "ft_pct") {
    return `${(value * 100).toFixed(1)}%`;
  }
  if (id === "plus_minus") {
    const sign = value > 0 ? "+" : "";
    return `${sign}${value.toFixed(1)}`;
  }
  if (id === "min") return value.toFixed(1);
  return value.toFixed(1);
}

export function formatSalaryUsd(amount: number): string {
  const sign = amount < 0 ? "-" : "";
  const abs = Math.abs(amount);
  if (abs >= 1_000_000) {
    return `${sign}$${(abs / 1_000_000).toFixed(1)}M`;
  }
  if (abs >= 1_000) {
    return `${sign}$${Math.round(abs / 1_000)}K`;
  }
  return `${sign}$${abs}`;
}

export function formatFgLine(made: number, att: number): string {
  return `${made}-${att}`;
}

/** `6-7` + `230` → `201 cm / 104 kg`（ft-in / lb → メートル法） */
export function formatPhysique(height: string, weight: string): string {
  const m = height.match(/^(\d+)-(\d+)$/);
  let cmLabel = height;
  if (m) {
    const inches = Number(m[1]) * 12 + Number(m[2]);
    const cm = Math.round(inches * 2.54);
    cmLabel = `${cm} cm`;
  }
  const lbs = Number(weight);
  const kgLabel = Number.isFinite(lbs)
    ? `${Math.round(lbs / 2.2046226218)} kg`
    : weight;
  return `${cmLabel} / ${kgLabel}`;
}

export function formatAvailabilityStatus(
  status: NbaPlayerAvailabilityStatus
): string {
  if (status === "active") return "ACTIVE";
  if (status === "out") return "OUT";
  return "GAME-TIME DECISION";
}

export function availabilityStatusColor(
  status: NbaPlayerAvailabilityStatus
): string {
  if (status === "active") return "#2DFF6E";
  if (status === "out") return "#FF2D78";
  return "#F5C518";
}

/** ISO `YYYY-MM-DD` → 満年齢 */
export function ageFromBirthDate(
  birthDate: string | null | undefined,
  asOf: Date = new Date()
): number | null {
  if (!birthDate) return null;
  const m = birthDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  let age = asOf.getFullYear() - y;
  const beforeBirthday =
    asOf.getMonth() + 1 < mo ||
    (asOf.getMonth() + 1 === mo && asOf.getDate() < d);
  if (beforeBirthday) age -= 1;
  return age >= 0 && age < 80 ? age : null;
}

/**
 * 表示用年齢。BDL に生年月日は無いので:
 * 1) シード birthDate
 * 2) キャリア行の age（最新シーズン基準。古い行しか無いときは差分で繰り上げ）
 *
 * 注意: regular は ingest で新しい順。末尾から拾うとルーキー年になる。
 */
export function resolvePlayerDisplayAge(detail: {
  birthDate?: string | null;
  careerSeasons?: {
    regular: Array<{ age?: number | null; seasonStart?: number | null }>;
  };
}): number | null {
  const fromBirth = ageFromBirthDate(detail.birthDate);
  if (fromBirth != null) return fromBirth;

  const regular = detail.careerSeasons?.regular ?? [];
  let latestSeasonStart = Number.NEGATIVE_INFINITY;
  let best: { seasonStart: number; age: number } | null = null;

  for (const row of regular) {
    const seasonStart = Number(row.seasonStart);
    if (Number.isFinite(seasonStart) && seasonStart > latestSeasonStart) {
      latestSeasonStart = seasonStart;
    }
    const age = row.age;
    if (age == null || !Number.isFinite(age) || age <= 0) continue;
    if (
      !Number.isFinite(seasonStart) ||
      seasonStart <= 0 ||
      (best != null && seasonStart <= best.seasonStart)
    ) {
      continue;
    }
    best = { seasonStart, age: Math.round(age) };
  }

  if (!best) return null;
  if (!Number.isFinite(latestSeasonStart)) return best.age;
  const yearsForward = Math.max(0, latestSeasonStart - best.seasonStart);
  const projected = best.age + yearsForward;
  return projected > 0 && projected < 80 ? projected : best.age;
}

/** `1999-02-28` → `1999.02.28` */
export function formatBirthDateLabel(
  birthDate: string | null | undefined
): string {
  if (!birthDate) return "—";
  const m = birthDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return birthDate;
  return `${m[1]}.${m[2]}.${m[3]}`;
}

/** `DAL 18–25 · LAL 25–` */
export function formatTeamHistory(
  history: NbaPlayerTeamStint[] | null | undefined
): string {
  if (!history || history.length === 0) return "—";
  return history
    .map((s) => {
      const from = String(s.fromSeason).slice(-2);
      if (s.toSeason == null) return `${s.teamAbbr} ${from}–`;
      const to = String(s.toSeason).slice(-2);
      return `${s.teamAbbr} ${from}–${to}`;
    })
    .join(" · ");
}

/**
 * BDL / モックの国名 → ISO2（国旗用）。
 * "USA" / "United States" / "Slovenia" など。
 */
const NBA_COUNTRY_ALIASES: Record<string, string> = {
  usa: "US",
  us: "US",
  "united states": "US",
  "united states of america": "US",
  america: "US",
  uk: "GB",
  "united kingdom": "GB",
  england: "GB",
  "czech republic": "CZ",
  czechia: "CZ",
  "dr congo": "CD",
  congo: "CG",
  "ivory coast": "CI",
  "cote d'ivoire": "CI",
  "côte d'ivoire": "CI",
  turkey: "TR",
  türkiye: "TR",
  turkiye: "TR",
};

export function nbaCountryNameToIso2(
  country: string | null | undefined
): string | null {
  if (!country) return null;
  const raw = country.trim();
  if (!raw) return null;
  if (/^[A-Za-z]{2}$/.test(raw)) return raw.toUpperCase();

  const key = raw.toLowerCase();
  const aliased = NBA_COUNTRY_ALIASES[key];
  if (aliased) return aliased;

  // 遅延 import を避け、よく使う NBA 出身国を直マップ（COUNTRY_OPTIONS と一致）
  const common: Record<string, string> = {
    slovenia: "SI",
    serbia: "RS",
    canada: "CA",
    france: "FR",
    germany: "DE",
    australia: "AU",
    spain: "ES",
    greece: "GR",
    lithuania: "LT",
    latvia: "LV",
    croatia: "HR",
    brazil: "BR",
    argentina: "AR",
    nigeria: "NG",
    cameroon: "CM",
    senegal: "SN",
    italy: "IT",
    poland: "PL",
    turkey: "TR",
    japan: "JP",
    "south sudan": "SS",
    "new zealand": "NZ",
    "dominican republic": "DO",
    "puerto rico": "PR",
    bahamas: "BS",
    jamaica: "JM",
    georgia: "GE",
    ukraine: "UA",
    russia: "RU",
    montenegro: "ME",
    bosnia: "BA",
    "bosnia and herzegovina": "BA",
    angola: "AO",
    mali: "ML",
    egypt: "EG",
    sudan: "SD",
    finland: "FI",
    sweden: "SE",
    switzerland: "CH",
    austria: "AT",
    israel: "IL",
    china: "CN",
    "south korea": "KR",
    korea: "KR",
  };
  return common[key] ?? null;
}

export function formatPlayerUid(playerId: string): string {
  const digits = playerId.replace(/\D/g, "") || "0000";
  const padded = digits.padStart(4, "0").slice(-4);
  const suffix = String.fromCharCode(65 + (hashSeed(playerId) % 26));
  return `${padded}-${suffix}`;
}

/** ゾーン FG% → 寒色〜暖色（簡易ヒート） */
export function shotZoneHeatColor(fgPct: number): string {
  const t = Math.max(0, Math.min(1, (fgPct - 0.28) / 0.42));
  if (t < 0.33) {
    const u = t / 0.33;
    return lerpHex("#1B4F8A", "#3D7AB5", u);
  }
  if (t < 0.66) {
    const u = (t - 0.33) / 0.33;
    return lerpHex("#C9A227", "#E8C84A", u);
  }
  const u = (t - 0.66) / 0.34;
  return lerpHex("#E85A2A", "#FF3B4A", u);
}

function lerpHex(a: string, b: string, t: number): string {
  const pa = hexToRgb(a);
  const pb = hexToRgb(b);
  const r = Math.round(pa.r + (pb.r - pa.r) * t);
  const g = Math.round(pa.g + (pb.g - pa.g) * t);
  const bl = Math.round(pa.b + (pb.b - pa.b) * t);
  return `rgb(${r},${g},${bl})`;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace("#", "");
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

function buildShotZones(
  playerId: string,
  preset?: NbaPlayerShotZone[]
): NbaPlayerShotZone[] {
  if (preset && preset.length > 0) return preset;
  const rnd = mulberry32(hashSeed(`${playerId}:zones:v1`));
  const mk = (
    id: NbaPlayerShotZoneId,
    short: string,
    label: string,
    base: number,
    fgaBase: number
  ): NbaPlayerShotZone => ({
    id,
    short,
    label,
    fgPct: Math.round((base + (rnd() - 0.5) * 0.12) * 1000) / 1000,
    fga: Math.round(fgaBase * (0.7 + rnd() * 0.6)),
  });
  return [
    mk("restricted", "RA", "Restricted Area", 0.64, 180),
    mk("paint", "PAINT", "In Paint (Non-RA)", 0.46, 140),
    mk("mid", "MID", "Mid-Range", 0.4, 120),
    mk("left_corner_3", "LC3", "Left Corner 3", 0.38, 50),
    mk("right_corner_3", "RC3", "Right Corner 3", 0.37, 48),
    mk("above_break_3", "AB3", "Above the Break 3", 0.35, 250),
  ];
}

const ADVANCED_METRIC_DEFS: Array<{
  id: NbaPlayerAdvancedMetricId;
  short: string;
  hintJa: string;
  hintEn: string;
  kind: "per" | "pct";
  fallbackValue: number;
}> = [
  {
    id: "per",
    short: "PER",
    hintJa:
      "得点・リバ・パス等を1分あたりの貢献度にまとめた指標。平均≈15。高いほど個人の影響力は大きいが、勝ち負けだけを示す数値ではない。",
    hintEn:
      "Per-minute box-score impact (pts, reb, ast…). Avg ≈15. Higher = bigger individual impact, not wins alone.",
    kind: "per",
    fallbackValue: 18,
  },
  {
    id: "ts_pct",
    short: "TS%",
    hintJa:
      "2P・3P・FTをまとめたシュート成功率。高いほど、投げた1本あたりの得点が増える。",
    hintEn:
      "Shooting efficiency across 2P, 3P, and FT. Higher = more points per shot taken.",
    kind: "pct",
    fallbackValue: 0.56,
  },
  {
    id: "usg",
    short: "USG",
    hintJa:
      "出場中に攻撃をどれだけ使ったか。高い＝エース役・ボール使用が多い。",
    hintEn:
      "Share of offense while on court. Higher = star role, more touches.",
    kind: "pct",
    fallbackValue: 0.24,
  },
];

function buildAdvancedMetrics(
  playerId: string,
  preset?: SeedProfile["advanced"]
): NbaPlayerAdvancedMetric[] {
  const rnd = mulberry32(hashSeed(`${playerId}:advanced:v1`));
  return ADVANCED_METRIC_DEFS.map((def) => {
    const hit = preset?.[def.id];
    const value =
      hit?.value ??
      (def.kind === "pct"
        ? Math.round((def.fallbackValue + (rnd() - 0.5) * 0.08) * 1000) / 1000
        : Math.round((def.fallbackValue + (rnd() - 0.5) * 8) * 10) / 10);
    const leagueRank = hit?.rank ?? Math.max(1, Math.round(1 + rnd() * 120));
    return {
      id: def.id,
      short: def.short,
      value,
      display:
        def.kind === "pct"
          ? `${(value * 100).toFixed(1)}%`
          : value.toFixed(1),
      leagueRank,
      hintJa: def.hintJa,
      hintEn: def.hintEn,
    };
  });
}

function seasonValue(
  season: NbaPlayerDetailPreview["season"],
  id: NbaPlayerSeasonMetricId
): number {
  switch (id) {
    case "pts":
      return season.pts;
    case "reb":
      return season.reb;
    case "ast":
      return season.ast;
    case "stl":
      return season.stl;
    case "blk":
      return season.blk;
    case "tov":
      return season.tov;
    case "min":
      return season.min;
    case "fg_pct":
      return season.fgPct;
    case "fga":
      return season.fga;
    case "fg3_pct":
      return season.fg3Pct;
    case "fg3m":
      return season.fg3m;
    case "fg3a":
      return season.fg3a;
    case "ft_pct":
      return season.ftPct;
    case "plus_minus":
      return season.plusMinus;
  }
}

function buildMetrics(
  season: NbaPlayerDetailPreview["season"],
  ranks: Partial<Record<NbaPlayerSeasonMetricId, number>>,
  rnd: () => number
): NbaPlayerSeasonMetric[] {
  return METRIC_DEFS.map((def) => {
    const value = seasonValue(season, def.id);
    const leagueRank =
      ranks[def.id] ?? Math.max(1, Math.round(1 + rnd() * 199));
    return {
      id: def.id,
      short: def.short,
      value,
      display: formatMetricDisplay(def.id, value),
      leagueRank,
      higherIsBetter: def.higherIsBetter,
    };
  });
}

function teamForSeason(
  history: NbaPlayerTeamStint[],
  seasonStart: number,
  fallback: { teamId: string; teamAbbr: string }
): { teamId: string; teamAbbr: string } {
  for (let i = history.length - 1; i >= 0; i -= 1) {
    const stint = history[i]!;
    const to = stint.toSeason ?? 9999;
    if (seasonStart >= stint.fromSeason && seasonStart <= to) {
      return { teamId: stint.teamId, teamAbbr: stint.teamAbbr };
    }
  }
  return fallback;
}

function ageInSeason(birthDate: string, seasonStart: number): number {
  const birthYear = Number(birthDate.slice(0, 4));
  if (!Number.isFinite(birthYear)) return 0;
  return Math.max(18, seasonStart - birthYear);
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function deriveShotVolume(
  pts: number,
  fg3Pct: number,
  rnd: () => number
): { fga: number; fg3m: number; fg3a: number } {
  const fga = round1(Math.max(3.5, pts * 0.7 + rnd() * 3.5));
  const fg3a = round1(Math.max(0.3, fga * (0.22 + rnd() * 0.38)));
  const fg3m = round1(fg3a * Math.max(0.2, fg3Pct));
  return { fga, fg3m, fg3a };
}

function round3(n: number): number {
  return Math.round(n * 1000) / 1000;
}

/** ドラフト年〜今季のシーズン平均行を生成（プレビュー用） */
function buildCareerSeasons(
  seed: SeedProfile,
  currentSeasonStart = 2025
): NbaPlayerDetailPreview["careerSeasons"] {
  const start = seed.draftYear;
  const years = Math.max(1, currentSeasonStart - start + 1);
  const rnd = mulberry32(hashSeed(`${seed.playerId}:career:v2`));
  const base = seed.season;
  const regular: NbaPlayerCareerSeasonRow[] = [];
  const playoffs: NbaPlayerCareerSeasonRow[] = [];

  for (let i = 0; i < years; i += 1) {
    const seasonStart = start + i;
    const isCurrent = seasonStart === currentSeasonStart;
    const progress = years <= 1 ? 1 : i / (years - 1);
    /** 若手→ピーク→わずかに落ち、今季は seed.season に寄せる */
    const curve = isCurrent
      ? 1
      : 0.72 + progress * 0.38 + (rnd() - 0.5) * 0.08;
    const team = teamForSeason(seed.teamHistory, seasonStart, {
      teamId: seed.teamId,
      teamAbbr: TEAM_SHORT[seed.teamId] ?? "NBA",
    });
    const pts = isCurrent ? base.pts : round1(base.pts * curve);
    const reb = isCurrent ? base.reb : round1(base.reb * (0.9 + curve * 0.12));
    const ast = isCurrent ? base.ast : round1(base.ast * (0.88 + curve * 0.14));
    const min = isCurrent ? base.min : round1(Math.min(38, base.min * (0.85 + curve * 0.18)));
    const stl = isCurrent ? base.stl : round1(base.stl * (0.9 + rnd() * 0.2));
    const blk = isCurrent ? base.blk : round1(base.blk * (0.85 + rnd() * 0.3));
    const tov = isCurrent ? base.tov : round1(base.tov * (1.15 - curve * 0.2));
    const fgPct = isCurrent
      ? base.fgPct
      : round3(Math.min(0.58, Math.max(0.38, base.fgPct * (0.92 + curve * 0.1))));
    const fg3Pct = isCurrent
      ? base.fg3Pct
      : round3(Math.min(0.45, Math.max(0.28, base.fg3Pct * (0.9 + curve * 0.12))));
    const ftPct = isCurrent
      ? base.ftPct
      : round3(Math.min(0.94, Math.max(0.65, base.ftPct * (0.96 + rnd() * 0.06))));
    const fga = round1(Math.max(6, pts / Math.max(0.35, fgPct * 1.05)));
    const fgm = round1(fga * fgPct);
    const fg3a = round1(fga * (0.28 + rnd() * 0.22));
    const fg3m = round1(fg3a * fg3Pct);
    const fta = round1(2 + pts * 0.22 + rnd() * 2);
    const ftm = round1(fta * ftPct);
    const games = isCurrent
      ? base.gamesPlayed
      : Math.round(55 + rnd() * 27);
    const gamesStarted = Math.min(games, Math.round(games * (0.75 + rnd() * 0.25)));

    const row: NbaPlayerCareerSeasonRow = {
      seasonStart,
      age: ageInSeason(seed.birthDate, seasonStart),
      teamId: team.teamId,
      teamAbbr: team.teamAbbr,
      position: seed.position.split("-")[0] ?? seed.position,
      games,
      gamesStarted,
      min,
      fgm,
      fga,
      fgPct,
      fg3m,
      fg3a,
      fg3Pct,
      ftm,
      fta,
      ftPct,
      reb,
      ast,
      stl,
      blk,
      tov,
      pts,
    };
    regular.push(row);

    /** プレーオフは出場しない年もあり */
    if (rnd() > 0.22 || isCurrent) {
      const poScale = 0.92 + rnd() * 0.12;
      playoffs.push({
        ...row,
        games: Math.round(4 + rnd() * 16),
        gamesStarted: Math.round(4 + rnd() * 16),
        min: round1(Math.min(42, row.min * 1.05)),
        pts: round1(row.pts * poScale),
        reb: round1(row.reb * poScale),
        ast: round1(row.ast * poScale),
        stl: round1(row.stl * poScale),
        blk: round1(row.blk * poScale),
        tov: round1(row.tov * (1.05 + rnd() * 0.1)),
        fgm: round1(row.fgm * poScale),
        fga: round1(row.fga * poScale),
        fg3m: round1(row.fg3m * poScale),
        fg3a: round1(row.fg3a * poScale),
        ftm: round1(row.ftm * poScale),
        fta: round1(row.fta * poScale),
      });
    }
  }

  return { regular, playoffs };
}

function buildVenueSplits(
  playerId: string,
  season: NbaPlayerDetailPreview["season"]
): NbaPlayerVenueSplit[] {
  const rnd = mulberry32(hashSeed(`${playerId}:venue:v1`));
  const homeScale = 1.04 + rnd() * 0.06;
  const awayScale = 0.94 + rnd() * 0.06;
  const mk = (venue: "home" | "away", scale: number, games: number): NbaPlayerVenueSplit => ({
    venue,
    games,
    min: round1(season.min * (0.97 + rnd() * 0.06)),
    pts: round1(season.pts * scale),
    reb: round1(season.reb * scale),
    ast: round1(season.ast * scale),
    plusMinus: round1(season.plusMinus * scale + (rnd() - 0.5) * 2),
  });
  const homeGames = Math.round(season.gamesPlayed * (0.48 + rnd() * 0.04));
  return [
    mk("home", homeScale, homeGames),
    mk("away", awayScale, Math.max(1, season.gamesPlayed - homeGames)),
  ];
}

function buildVsOpponentSamples(
  playerId: string,
  teamId: string,
  season: NbaPlayerDetailPreview["season"]
): NbaPlayerVsOpponentSample[] {
  const rnd = mulberry32(hashSeed(`${playerId}:vsopp:v1`));
  const pool = Object.keys(NBA_TEAM_NAME_BY_ID)
    .filter((id) => id !== teamId)
    .sort(() => rnd() - 0.5)
    .slice(0, 3);
  return pool.map((oppTeamId, i) => {
    const scale = 0.85 + rnd() * 0.35;
    return {
      oppTeamId,
      oppAbbr: TEAM_SHORT[oppTeamId] ?? "OPP",
      games: 2 + Math.floor(rnd() * 3),
      pts: round1(season.pts * scale),
      reb: round1(season.reb * scale),
      ast: round1(season.ast * scale),
      plusMinus: round1(season.plusMinus * scale + (i - 1) * 1.2),
    };
  });
}

function buildGameLogs(
  playerId: string,
  teamId: string,
  season: NbaPlayerDetailPreview["season"]
): NbaPlayerGameLog[] {
  const rnd = mulberry32(hashSeed(`${playerId}:logs:v1`));
  const oppPool = Object.keys(NBA_TEAM_NAME_BY_ID).filter((id) => id !== teamId);
  const logs: NbaPlayerGameLog[] = [];
  for (let i = 0; i < 10; i += 1) {
    const oppTeamId = oppPool[Math.floor(rnd() * oppPool.length)]!;
    const home = rnd() > 0.45;
    const win = rnd() > 0.4;
    const scale = 0.75 + rnd() * 0.55;
    const fga = Math.max(6, Math.round(season.pts * 0.85 * scale));
    const fgm = Math.min(fga, Math.round(fga * (0.35 + rnd() * 0.25)));
    const fg3a = Math.max(1, Math.round(fga * (0.35 + rnd() * 0.25)));
    const fg3m = Math.min(fg3a, Math.round(fg3a * (0.28 + rnd() * 0.25)));
    const fta = Math.max(0, Math.round(2 + rnd() * 8));
    const ftm = Math.min(fta, Math.round(fta * (0.7 + rnd() * 0.28)));
    const month = 10 + Math.floor(i / 4);
    const day = 3 + i * 3;
    logs.push({
      gameId: `${playerId}-g${i + 1}`,
      dateLabel: `${month}/${day}`,
      oppTeamId,
      oppAbbr: TEAM_SHORT[oppTeamId] ?? oppTeamId.replace(/^nba-/, "").slice(0, 3).toUpperCase(),
      home,
      result: win ? "W" : "L",
      min: Math.round((season.min * (0.85 + rnd() * 0.25)) * 10) / 10,
      pts: Math.round(season.pts * scale + (rnd() - 0.5) * 8),
      reb: Math.max(0, Math.round(season.reb * scale + (rnd() - 0.5) * 3)),
      ast: Math.max(0, Math.round(season.ast * scale + (rnd() - 0.5) * 3)),
      stl: Math.max(0, Math.round(rnd() * 3)),
      blk: Math.max(0, Math.round(rnd() * 2)),
      tov: Math.max(0, Math.round(season.tov * (0.6 + rnd() * 0.8))),
      fgm,
      fga,
      fg3m,
      fg3a,
      ftm,
      fta,
      plusMinus: Math.round((rnd() - 0.4) * 28),
    });
  }
  return logs;
}

function conferenceForTeam(teamId: string): NbaConferenceId {
  return (NBA_EAST_TEAM_IDS as readonly string[]).includes(teamId)
    ? "east"
    : "west";
}

function seedFromRosterPlayer(
  player: NbaRosterPlayer,
  teamId: string
): SeedProfile {
  const playerId = String(player.id);
  const rnd = mulberry32(hashSeed(`${playerId}:profile:v1`));
  const salary = Math.round(8_000_000 + rnd() * 35_000_000);
  const season = {
    gamesPlayed: player.gp,
    min: player.mpg,
    pts: player.ppg,
    reb: player.rpg ?? 0,
    ast: player.apg ?? 0,
    stl: player.spg ?? 0,
    blk: player.bpg ?? 0,
    tov: player.tpg ?? 0,
    fgPct: player.fgPct ?? 0.45,
    fg3Pct: player.fg3Pct ?? 0.35,
    ftPct: player.ftPct ?? 0.75,
    plusMinus: Math.round(((rnd() - 0.45) * 10) * 10) / 10,
    ...deriveShotVolume(player.ppg, player.fg3Pct ?? 0.35, rnd),
  };
  return {
    playerId,
    firstName: player.firstName,
    lastName: player.lastName,
    jerseyNumber: player.jerseyNumber?.replace(/^#/, "") ?? "—",
    position: player.position,
    experienceYears: Math.round(1 + rnd() * 12),
    height: `${6}-${Math.round(rnd() * 11)}`,
    weight: String(Math.round(185 + rnd() * 80)),
    college: rnd() > 0.35 ? "Kentucky" : null,
    country: rnd() > 0.7 ? "Canada" : "USA",
    draftYear: 2018 + Math.floor(rnd() * 7),
    draftRound: rnd() > 0.7 ? 2 : 1,
    draftNumber: Math.round(1 + rnd() * 45),
    teamId,
    season,
    ranks: {},
    contract: {
      contractType: rnd() > 0.5 ? "Rookie Scale" : "Veteran",
      contractStatus: "ACTIVE",
      contractYears: Math.round(2 + rnd() * 3),
      yearsRemaining: Math.round(1 + rnd() * 3),
      freeAgencyYear: 2026 + Math.round(rnd() * 4),
      freeAgencyType: rnd() > 0.3 ? "UFA" : "RFA",
      averageSalary: salary,
      totalValue: salary * 3,
      remainingGuaranteed: salary * 2,
      notes: [],
      seasons: [
        {
          season: 2025,
          baseSalary: salary,
          capHit: salary,
          salaryRank: Math.round(20 + rnd() * 120),
          teamId,
          teamAbbr: TEAM_SHORT[teamId] ?? "NBA",
        },
      ],
    },
    awards: [
      { id: "all_star", label: "All-Star", count: Math.round(rnd() * 4) },
      {
        id: "all_nba_1st",
        label: "All-NBA First Team",
        count: Math.round(rnd() * 2),
      },
      { id: "roy", label: "ROY", count: rnd() > 0.85 ? 1 : 0 },
    ].filter((a) => a.count > 0),
    birthDate: `19${90 + Math.floor(rnd() * 10)}-${String(1 + Math.floor(rnd() * 12)).padStart(2, "0")}-${String(1 + Math.floor(rnd() * 28)).padStart(2, "0")}`,
    availability: player.dimmed
      ? {
          status: rnd() > 0.5 ? "gtd" : "out",
          reason: rnd() > 0.5 ? "Hamstring strain" : "Knee soreness",
          returnEstimate: rnd() > 0.5 ? "Day-to-day" : "Week-to-week",
        }
      : {
          status: "active",
          reason: null,
          returnEstimate: null,
        },
    teamHistory: [
      {
        teamId,
        teamAbbr: TEAM_SHORT[teamId] ?? "NBA",
        fromSeason: 2018 + Math.floor(rnd() * 7),
        toSeason: null,
      },
    ],
  };
}

function resolveSeed(playerId?: string): SeedProfile {
  if (playerId && SEEDS[playerId]) return SEEDS[playerId]!;
  if (playerId) {
    const roster = lookupTeamDetailRosterPlayer(playerId);
    if (roster) return seedFromRosterPlayer(roster.player, roster.teamId);
  }
  if (playerId) {
    const rnd = mulberry32(hashSeed(`${playerId}:profile:v1`));
    const teamIds = Object.keys(NBA_TEAM_NAME_BY_ID);
    const teamId = teamIds[Math.floor(rnd() * teamIds.length)]!;
    const firstNames = ["Jalen", "Amen", "Scoot", "Chet", "Paolo"];
    const lastNames = ["Williams", "Thompson", "Henderson", "Holmgren", "Banchero"];
    const first = firstNames[Math.floor(rnd() * firstNames.length)]!;
    const last = lastNames[Math.floor(rnd() * lastNames.length)]!;
    const pts = Math.round((12 + rnd() * 18) * 10) / 10;
    const fg3Pct = 0.3 + rnd() * 0.15;
    const season = {
      gamesPlayed: Math.round(40 + rnd() * 30),
      min: Math.round((22 + rnd() * 16) * 10) / 10,
      pts,
      reb: Math.round((3 + rnd() * 9) * 10) / 10,
      ast: Math.round((2 + rnd() * 8) * 10) / 10,
      stl: Math.round((0.4 + rnd() * 1.6) * 10) / 10,
      blk: Math.round((0.2 + rnd() * 1.8) * 10) / 10,
      tov: Math.round((1 + rnd() * 2.5) * 10) / 10,
      fgPct: 0.42 + rnd() * 0.14,
      fg3Pct,
      ftPct: 0.72 + rnd() * 0.22,
      plusMinus: Math.round(((rnd() - 0.45) * 10) * 10) / 10,
      ...deriveShotVolume(pts, fg3Pct, rnd),
    };
    const salary = Math.round(8_000_000 + rnd() * 35_000_000);
    return {
      playerId,
      firstName: first,
      lastName: last,
      jerseyNumber: String(Math.round(1 + rnd() * 44)),
      position: (["G", "F", "C", "G-F", "F-C"] as const)[
        Math.floor(rnd() * 5)
      ]!,
      experienceYears: Math.round(1 + rnd() * 12),
      height: `${6}-${Math.round(rnd() * 11)}`,
      weight: String(Math.round(185 + rnd() * 80)),
      college: rnd() > 0.35 ? "Kentucky" : null,
      country: rnd() > 0.7 ? "Canada" : "USA",
      draftYear: 2018 + Math.floor(rnd() * 7),
      draftRound: rnd() > 0.7 ? 2 : 1,
      draftNumber: Math.round(1 + rnd() * 45),
      teamId,
      season,
      ranks: {},
      contract: {
        contractType: rnd() > 0.5 ? "Rookie Scale" : "Veteran",
        contractStatus: "ACTIVE",
        contractYears: Math.round(2 + rnd() * 3),
        yearsRemaining: Math.round(1 + rnd() * 3),
        freeAgencyYear: 2026 + Math.round(rnd() * 4),
        freeAgencyType: rnd() > 0.3 ? "UFA" : "RFA",
        averageSalary: salary,
        totalValue: salary * 3,
        remainingGuaranteed: salary * 2,
        notes: [],
        seasons: [
          {
            season: 2025,
            baseSalary: salary,
            capHit: salary,
            salaryRank: Math.round(20 + rnd() * 120),
            teamId,
            teamAbbr: TEAM_SHORT[teamId] ?? "NBA",
          },
        ],
      },
      awards: [
        { id: "all_star", label: "All-Star", count: Math.round(rnd() * 4) },
        {
          id: "all_nba_1st",
          label: "All-NBA First Team",
          count: Math.round(rnd() * 2),
        },
        { id: "roy", label: "ROY", count: rnd() > 0.85 ? 1 : 0 },
      ].filter((a) => a.count > 0),
      birthDate: `19${90 + Math.floor(rnd() * 10)}-${String(1 + Math.floor(rnd() * 12)).padStart(2, "0")}-${String(1 + Math.floor(rnd() * 28)).padStart(2, "0")}`,
      availability:
        rnd() > 0.75
          ? {
              status: rnd() > 0.5 ? "gtd" : "out",
              reason: rnd() > 0.5 ? "Hamstring strain" : "Knee soreness",
              returnEstimate: rnd() > 0.5 ? "Day-to-day" : "Week-to-week",
            }
            : {
              status: "active",
              reason: null,
              returnEstimate: null,
            },
      teamHistory: [
        {
          teamId,
          teamAbbr: TEAM_SHORT[teamId] ?? "NBA",
          fromSeason: 2018 + Math.floor(rnd() * 7),
          toSeason: null,
        },
      ],
    };
  }
  return LUKA;
}

/** 既定は Luka。`playerId` で Curry / Jokic 等に切替可 */

const RANK_HIDDEN = 999;

function zeroSeasonBlock(): NbaPlayerDetailPreview["season"] {
  return {
    gamesPlayed: 0,
    min: 0,
    pts: 0,
    reb: 0,
    ast: 0,
    stl: 0,
    blk: 0,
    tov: 0,
    fgPct: 0,
    fg3Pct: 0,
    ftPct: 0,
    plusMinus: 0,
    fga: 0,
    fg3m: 0,
    fg3a: 0,
  };
}

export function metricsFromSeason(
  season: NbaPlayerDetailPreview["season"],
  ranks: Partial<Record<NbaPlayerSeasonMetricId, number>> = {}
): NbaPlayerSeasonMetric[] {
  return METRIC_DEFS.map((def) => {
    const value = seasonValue(season, def.id);
    return {
      id: def.id,
      short: def.short,
      value,
      display: formatMetricDisplay(def.id, value),
      leagueRank: ranks[def.id] ?? RANK_HIDDEN,
      higherIsBetter: def.higherIsBetter,
    };
  });
}

function zeroAdvancedMetrics(): NbaPlayerAdvancedMetric[] {
  return ADVANCED_METRIC_DEFS.map((def) => ({
    id: def.id,
    short: def.short,
    value: 0,
    display: String(def.id).includes("pct") ? "0.0%" : "0.0",
    leagueRank: RANK_HIDDEN,
    hintJa: def.hintJa,
    hintEn: def.hintEn,
  }));
}

function activeAvailability(): NbaPlayerAvailability {
  return { status: "active", reason: null, returnEstimate: null };
}

/** シーズン数値・ログ・スプリットを 0/空に（チーム詳細と同型） */
export function zeroPlayerDetailSeasonStats(
  detail: NbaPlayerDetailPreview
): NbaPlayerDetailPreview {
  const season = zeroSeasonBlock();
  const seasonMetrics = metricsFromSeason(season);
  const headlineIds: NbaPlayerSeasonMetricId[] = ["pts", "reb", "ast"];
  const headlineMetrics = headlineIds
    .map((id) => seasonMetrics.find((m) => m.id === id))
    .filter((m): m is NbaPlayerSeasonMetric => Boolean(m));
  return {
    ...detail,
    season,
    headlineMetrics,
    seasonMetrics,
    advancedMetrics: zeroAdvancedMetrics(),
    careerSeasons: { regular: [], playoffs: [] },
    shotZones: [],
    gameLogs: [],
    contract: null,
    awards: [],
    availability: activeAvailability(),
    venueSplits: [],
    vsOpponentSamples: [],
    leaderMetrics: {},
    asOfLabel: nbaSeasonStatsReady()
      ? detail.asOfLabel || "2026-27"
      : "PRESEASON · 2026-27",
  };
}

function blankPlayerIdentity(playerId?: string): NbaPlayerDetailPreview {
  const id = (playerId ?? "").trim() || "0";
  const season = zeroSeasonBlock();
  const seasonMetrics = metricsFromSeason(season);
  const headlineIds: NbaPlayerSeasonMetricId[] = ["pts", "reb", "ast"];
  const headlineMetrics = headlineIds
    .map((metricId) => seasonMetrics.find((m) => m.id === metricId))
    .filter((m): m is NbaPlayerSeasonMetric => Boolean(m));
  return {
    playerId: id,
    uidLabel: formatPlayerUid(id),
    firstName: "—",
    lastName: "—",
    jerseyNumber: "—",
    position: "—",
    experienceYears: 0,
    height: "—",
    weight: "—",
    college: null,
    country: null,
    draftYear: null,
    draftRound: null,
    draftNumber: null,
    teamId: "",
    teamAbbr: "NBA",
    teamName: "—",
    conference: "west",
    season,
    headlineMetrics,
    seasonMetrics,
    advancedMetrics: zeroAdvancedMetrics(),
    careerSeasons: { regular: [], playoffs: [] },
    shotZones: [],
    gameLogs: [],
    contract: null,
    awards: [],
    availability: activeAvailability(),
    birthDate: null,
    teamHistory: [],
    venueSplits: [],
    vsOpponentSamples: [],
    leaderMetrics: {},
    asOfLabel: nbaSeasonStatsReady() ? "2026-27" : "PRESEASON · 2026-27",
  };
}

export function getNbaPlayerDetailPreview(
  playerId?: string
): NbaPlayerDetailPreview {
  // bio / 名前はシードや乱数にしない。roster overlay が埋めるまで空。
  return zeroPlayerDetailSeasonStats(blankPlayerIdentity(playerId));
}

export type NbaPlayerRecentWindowAvg = {
  window: number;
  games: number;
  pts: number;
  reb: number;
  ast: number;
  fgPct: number;
  fg3Pct: number;
};

/** Game logs 先頭から直近 N 試合の簡易平均 */
export function averageRecentGameLogs(
  logs: NbaPlayerGameLog[],
  window: number
): NbaPlayerRecentWindowAvg | null {
  const slice = logs.slice(0, Math.min(window, logs.length));
  if (!slice.length) return null;
  const n = slice.length;
  const sum = (pick: (g: NbaPlayerGameLog) => number) =>
    slice.reduce((acc, g) => acc + pick(g), 0);
  const fgm = sum((g) => g.fgm);
  const fga = sum((g) => g.fga);
  const fg3m = sum((g) => g.fg3m);
  const fg3a = sum((g) => g.fg3a);
  return {
    window,
    games: n,
    pts: Math.round((sum((g) => g.pts) / n) * 10) / 10,
    reb: Math.round((sum((g) => g.reb) / n) * 10) / 10,
    ast: Math.round((sum((g) => g.ast) / n) * 10) / 10,
    fgPct: fga > 0 ? fgm / fga : 0,
    fg3Pct: fg3a > 0 ? fg3m / fg3a : 0,
  };
}
