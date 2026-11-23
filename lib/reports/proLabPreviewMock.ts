/** Native DEV — 提案の表を全部載せた仮データ。 */

export type ProLabHit = { you: number; league: number; topPercent: number };
export type ProLabCmp = { key: string; label: string; you: number; league: number; top10: number; unit: "%" | "pt"; invert?: boolean };
export type ProLabTrendPoint = { t: number; rate: number };
export type ProLabTeamBar = {
  abbr: string;
  teamId: string;
  games: number;
  rate: number;
  avgPts: number;
};
export type ProLabSide = { you: number; league: number };
export type ProLabSit = { key: string; label: string; rate: number; n: number };
export type ProLabDow = { label: string; rate: number; n: number };
export type ProLabHour = { label: string; rate: number; n: number };

export type ProLabSplit = {
  key: string;
  label: string;
  win: number;
  league: number;
  n: number;
};

export type ProLabVsPick = {
  games: number;
  winner: { you: number; pro: number };
  scorer: { you: number; pro: number };
  mae: { you: number; pro: number };
  h2h: { you: number; pro: number; same: number };
  note: string;
};

export type ProLabPreview = {
  season: string;
  games: number;
  win: ProLabHit;
  scorer: ProLabHit;
  upset: ProLabHit;
  perfect: { n: number; pts: number; topPercent: number };
  streak: { longest: number; now: number; pts: number };
  avgPts: { you: number; league: number };
  mae: { you: number; league: number };
  trend: { n10: ProLabTrendPoint[]; n30: ProLabTrendPoint[]; n100: ProLabTrendPoint[] };
  compare: ProLabCmp[];
  breakdown: { label: string; share: number; pts: number }[];
  vsPick: ProLabVsPick;
  splits: ProLabSplit[];
  habits: {
    homePick: ProLabSide;
    chalkPick: ProLabSide;
    upsetPick: ProLabSide;
    note: string;
  };
  situations: ProLabSit[];
  teams: ProLabTeamBar[];
  weekday: ProLabDow[];
  hours: ProLabHour[];
  revise: { first: number; last: number; n: number; note: string };
};

const TEAM_SEED: Array<[string, string, number, number, number]> = [
  ["nba-thunder", "OKC", 17, 0.82, 8.4],
  ["nba-celtics", "BOS", 19, 0.74, 7.9],
  ["nba-knicks", "NYK", 18, 0.71, 8.1],
  ["nba-nuggets", "DEN", 15, 0.69, 7.4],
  ["nba-cavaliers", "CLE", 12, 0.67, 7.1],
  ["nba-rockets", "HOU", 11, 0.64, 6.8],
  ["nba-lakers", "LAL", 23, 0.61, 6.4],
  ["nba-heat", "MIA", 12, 0.58, 6.2],
  ["nba-bucks", "MIL", 14, 0.57, 6.0],
  ["nba-timberwolves", "MIN", 11, 0.55, 5.9],
  ["nba-76ers", "PHI", 10, 0.6, 6.5],
  ["nba-pacers", "IND", 9, 0.56, 5.8],
  ["nba-magic", "ORL", 10, 0.5, 5.4],
  ["nba-pistons", "DET", 8, 0.5, 5.2],
  ["nba-hawks", "ATL", 9, 0.44, 4.9],
  ["nba-bulls", "CHI", 10, 0.5, 5.1],
  ["nba-nets", "BKN", 7, 0.43, 4.6],
  ["nba-hornets", "CHA", 6, 0.5, 4.8],
  ["nba-raptors", "TOR", 8, 0.38, 4.2],
  ["nba-wizards", "WAS", 5, 0.4, 3.9],
  ["nba-mavericks", "DAL", 13, 0.54, 5.7],
  ["nba-warriors", "GSW", 14, 0.43, 4.7],
  ["nba-clippers", "LAC", 12, 0.5, 5.5],
  ["nba-suns", "PHX", 11, 0.45, 5.0],
  ["nba-kings", "SAC", 10, 0.4, 4.4],
  ["nba-spurs", "SAS", 9, 0.56, 6.1],
  ["nba-grizzlies", "MEM", 10, 0.5, 5.3],
  ["nba-pelicans", "NOP", 8, 0.38, 4.1],
  ["nba-blazers", "POR", 7, 0.43, 4.5],
  ["nba-jazz", "UTA", 6, 0.33, 3.6],
];

function series(end: number, n: number, start: number): ProLabTrendPoint[] {
  return Array.from({ length: n }, (_, i) => {
    const u = n === 1 ? 1 : i / (n - 1);
    const wobble = Math.sin(i * 1.3) * 0.025;
    return { t: i, rate: Math.min(0.9, Math.max(0.4, start + (end - start) * u + wobble)) };
  });
}

export function proLabPreviewMock(): ProLabPreview {
  return {
    season: "2026-27",
    games: 142,
    win: { you: 0.684, league: 0.61, topPercent: 12 },
    scorer: { you: 0.414, league: 0.27, topPercent: 18 },
    upset: { you: 0.9, league: 1.4, topPercent: 41 },
    perfect: { n: 8, pts: 32, topPercent: 14 },
    streak: { longest: 8, now: 3, pts: 86 },
    avgPts: { you: 7.2, league: 5.8 },
    mae: { you: 8.6, league: 10.4 },
    trend: {
      n10: series(0.72, 10, 0.58),
      n30: series(0.684, 30, 0.54),
      n100: series(0.66, 40, 0.5),
    },
    compare: [
      { key: "win", label: "勝敗的中", you: 68.4, league: 61.0, top10: 74.2, unit: "%" },
      { key: "scorer", label: "得点王的中", you: 41.4, league: 27.0, top10: 48.0, unit: "%" },
      { key: "upset", label: "アップセット点", you: 0.9, league: 1.4, top10: 2.8, unit: "pt" },
      { key: "pts", label: "平均獲得点", you: 7.2, league: 5.8, top10: 8.9, unit: "pt" },
      { key: "mae", label: "スコア誤差", you: 8.6, league: 10.4, top10: 6.9, unit: "pt", invert: true },
    ],
    breakdown: [
      { label: "基礎点", share: 0.626, pts: 640 },
      { label: "アップセット", share: 0.125, pts: 128 },
      { label: "連勝", share: 0.084, pts: 86 },
      { label: "得点王", share: 0.113, pts: 116 },
      { label: "パーフェクト", share: 0.051, pts: 52 },
    ],
    vsPick: {
      games: 128,
      winner: { you: 0.68, pro: 0.662 },
      scorer: { you: 0.414, pro: 0.394 },
      mae: { you: 8.6, pro: 11.2 },
      h2h: { you: 38, pro: 29, same: 61 },
      note: "勝敗が分かれた 67 試合では自分が上。点差も自分の方が近い。得点王はまだ互角。",
    },
    splits: [
      { key: "home", label: "ホーム", win: 0.71, league: 0.63, n: 78 },
      { key: "away", label: "アウェイ", win: 0.64, league: 0.59, n: 64 },
      { key: "chalk", label: "順当", win: 0.73, league: 0.66, n: 101 },
      { key: "dog", label: "逆張り", win: 0.48, league: 0.44, n: 41 },
    ],
    habits: {
      homePick: { you: 0.76, league: 0.58 },
      chalkPick: { you: 0.71, league: 0.62 },
      upsetPick: { you: 0.12, league: 0.21 },
      note: "ホームの本命に寄りやすい。アップセットは全体より少ない。接戦の勝敗はまだ伸びしろ。",
    },
    situations: [
      { key: "close", label: "接戦（6点差以内）", rate: 0.53, n: 48 },
      { key: "blow", label: "大差（15点以上）", rate: 0.74, n: 61 },
      { key: "upset", label: "アップセット", rate: 0.31, n: 33 },
    ],
    teams: TEAM_SEED.map(([teamId, abbr, games, rate, avgPts]) => ({
      teamId,
      abbr,
      games,
      rate,
      avgPts,
    })),
    weekday: [
      { label: "月", rate: 0.61, n: 14 },
      { label: "火", rate: 0.66, n: 22 },
      { label: "水", rate: 0.7, n: 21 },
      { label: "木", rate: 0.64, n: 18 },
      { label: "金", rate: 0.72, n: 24 },
      { label: "土", rate: 0.69, n: 26 },
      { label: "日", rate: 0.63, n: 17 },
    ],
    hours: [
      { label: "午前", rate: 0.58, n: 11 },
      { label: "午後", rate: 0.65, n: 38 },
      { label: "夜", rate: 0.71, n: 74 },
      { label: "深夜", rate: 0.62, n: 19 },
    ],
    revise: {
      first: 0.61,
      last: 0.684,
      n: 47,
      note: "締め直前に直した 47 試合は、最初の予想より当たっている。",
    },
  };
}
