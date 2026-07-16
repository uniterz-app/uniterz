/**
 * /dev/predict-timing-preview — Team Stats mock
 * Season + Last 10。後で BallDontLie team averages / 自前 L10 集計に差し替え。
 */

export type NbaTeamStatSide = {
  teamId: string;
  teamName: string;
  ppg: number;
  papg: number;
  diff: number;
  ortg: number;
  drtg: number;
  netrtg: number;
  pace: number;
  homeW: number;
  homeL: number;
  awayW: number;
  awayL: number;
  /** Last10 時の直近成績（あれば FORM 行に使う） */
  formW?: number;
  formL?: number;
  /** 直近結果の並び（古い→新しい）。L10 の W/L マス表示用 */
  formResults?: Array<"W" | "L">;
  /** リーグ順位（表示用 #n）— Season 向け。L10 は省略可 */
  ranks?: {
    ppg?: number;
    papg?: number;
    diff?: number;
    ortg?: number;
    drtg?: number;
    netrtg?: number;
    pace?: number;
  };
};

export type NbaTeamStatsCompare = {
  home: NbaTeamStatSide;
  away: NbaTeamStatSide;
};

/** Free 切替用の2窓 */
export type NbaTeamStatsBundle = {
  season: NbaTeamStatsCompare;
  last10: NbaTeamStatsCompare;
};

function buildFormResults(wins: number, losses: number): Array<"W" | "L"> {
  const n = Math.max(0, wins + losses);
  if (n === 0) return [];
  // 疑似的な並び: 負けを前寄り、勝ちを後ろに寄せつつ散らす
  const out: Array<"W" | "L"> = [];
  let w = wins;
  let l = losses;
  for (let i = 0; i < n; i += 1) {
    const remain = n - i;
    if (l > 0 && (w === 0 || (i % 3 === 0 && l >= w) || l > remain - w)) {
      out.push("L");
      l -= 1;
    } else if (w > 0) {
      out.push("W");
      w -= 1;
    } else {
      out.push("L");
      l -= 1;
    }
  }
  // 末尾を最新にする（勝ちが多いほど終盤に W）
  return out;
}

function last10FromSeason(
  side: NbaTeamStatSide,
  shift: {
    ppg: number;
    papg: number;
    ortg: number;
    drtg: number;
    pace: number;
    formW: number;
    formL: number;
    /** Last10 窓のリーグ順位（NET 中心。Pro TOP/BOT バッジ用） */
    ranks?: NbaTeamStatSide["ranks"];
    formResults?: Array<"W" | "L">;
  }
): NbaTeamStatSide {
  const ppg = +(side.ppg + shift.ppg).toFixed(1);
  const papg = +(side.papg + shift.papg).toFixed(1);
  const ortg = +(side.ortg + shift.ortg).toFixed(1);
  const drtg = +(side.drtg + shift.drtg).toFixed(1);
  const diff = +(ppg - papg).toFixed(1);
  const netrtg = +(ortg - drtg).toFixed(1);
  return {
    teamId: side.teamId,
    teamName: side.teamName,
    ppg,
    papg,
    diff,
    ortg,
    drtg,
    netrtg,
    pace: +(side.pace + shift.pace).toFixed(1),
    homeW: side.homeW,
    homeL: side.homeL,
    awayW: side.awayW,
    awayL: side.awayL,
    formW: shift.formW,
    formL: shift.formL,
    formResults:
      shift.formResults ?? buildFormResults(shift.formW, shift.formL),
    ranks: shift.ranks,
  };
}

function bundle(
  season: NbaTeamStatsCompare,
  homeShift: Parameters<typeof last10FromSeason>[1],
  awayShift: Parameters<typeof last10FromSeason>[1]
): NbaTeamStatsBundle {
  return {
    season,
    last10: {
      home: last10FromSeason(season.home, homeShift),
      away: last10FromSeason(season.away, awayShift),
    },
  };
}

const SEASON_BY_PRESET: Record<string, NbaTeamStatsCompare> = {
  "both-teams-rich": {
    home: {
      teamId: "nba-lakers",
      teamName: "Lakers",
      ppg: 116.2,
      papg: 112.4,
      diff: 3.8,
      ortg: 116.8,
      drtg: 112.9,
      netrtg: 3.9,
      pace: 101.4,
      homeW: 28,
      homeL: 8,
      awayW: 20,
      awayL: 16,
      ranks: { ppg: 6, papg: 14, diff: 8, ortg: 5, drtg: 12, netrtg: 7, pace: 11 },
    },
    away: {
      teamId: "nba-celtics",
      teamName: "Celtics",
      ppg: 118.9,
      papg: 108.1,
      diff: 10.8,
      ortg: 119.4,
      drtg: 109.6,
      netrtg: 9.8,
      pace: 98.6,
      homeW: 30,
      homeL: 6,
      awayW: 22,
      awayL: 14,
      ranks: { ppg: 3, papg: 4, diff: 2, ortg: 2, drtg: 5, netrtg: 2, pace: 22 },
    },
  },
  "strong-vs-neutral": {
    home: {
      teamId: "nba-lakers",
      teamName: "Lakers",
      ppg: 116.2,
      papg: 112.4,
      diff: 3.8,
      ortg: 116.8,
      drtg: 112.9,
      netrtg: 3.9,
      pace: 101.4,
      homeW: 28,
      homeL: 8,
      awayW: 20,
      awayL: 16,
      ranks: { ppg: 6, papg: 14, diff: 8, ortg: 5, drtg: 12, netrtg: 7, pace: 11 },
    },
    away: {
      teamId: "nba-knicks",
      teamName: "Knicks",
      ppg: 114.1,
      papg: 109.8,
      diff: 4.3,
      ortg: 115.2,
      drtg: 110.4,
      netrtg: 4.8,
      pace: 97.2,
      homeW: 26,
      homeL: 10,
      awayW: 19,
      awayL: 17,
      ranks: { ppg: 11, papg: 8, diff: 9, ortg: 10, drtg: 9, netrtg: 9, pace: 26 },
    },
  },
  "giant-killer-context": {
    home: {
      teamId: "nba-pistons",
      teamName: "Pistons",
      ppg: 112.6,
      papg: 113.8,
      diff: -1.2,
      ortg: 112.0,
      drtg: 113.5,
      netrtg: -1.5,
      pace: 100.8,
      homeW: 22,
      homeL: 14,
      awayW: 16,
      awayL: 20,
      ranks: { ppg: 18, papg: 20, diff: 19, ortg: 19, drtg: 18, netrtg: 19, pace: 14 },
    },
    away: {
      teamId: "nba-thunder",
      teamName: "Thunder",
      ppg: 121.4,
      papg: 106.2,
      diff: 15.2,
      ortg: 120.8,
      drtg: 105.9,
      netrtg: 14.9,
      pace: 102.1,
      homeW: 32,
      homeL: 4,
      awayW: 26,
      awayL: 10,
      ranks: { ppg: 1, papg: 1, diff: 1, ortg: 1, drtg: 1, netrtg: 1, pace: 8 },
    },
  },
  "underdog-pattern": {
    home: {
      teamId: "nba-warriors",
      teamName: "Warriors",
      ppg: 115.0,
      papg: 114.2,
      diff: 0.8,
      ortg: 114.6,
      drtg: 113.9,
      netrtg: 0.7,
      pace: 103.5,
      homeW: 24,
      homeL: 12,
      awayW: 17,
      awayL: 19,
      ranks: { ppg: 9, papg: 22, diff: 15, ortg: 12, drtg: 20, netrtg: 14, pace: 4 },
    },
    away: {
      teamId: "nba-nuggets",
      teamName: "Nuggets",
      ppg: 117.8,
      papg: 111.0,
      diff: 6.8,
      ortg: 118.1,
      drtg: 110.8,
      netrtg: 7.3,
      pace: 99.4,
      homeW: 27,
      homeL: 9,
      awayW: 19,
      awayL: 17,
      ranks: { ppg: 5, papg: 10, diff: 5, ortg: 4, drtg: 8, netrtg: 5, pace: 18 },
    },
  },
  sparse: {
    home: {
      teamId: "nba-spurs",
      teamName: "Spurs",
      ppg: 111.3,
      papg: 115.0,
      diff: -3.7,
      ortg: 110.8,
      drtg: 114.6,
      netrtg: -3.8,
      pace: 100.2,
      homeW: 18,
      homeL: 18,
      awayW: 14,
      awayL: 22,
      ranks: { ppg: 22, papg: 24, diff: 24, ortg: 23, drtg: 22, netrtg: 24, pace: 16 },
    },
    away: {
      teamId: "nba-magic",
      teamName: "Magic",
      ppg: 109.8,
      papg: 106.9,
      diff: 2.9,
      ortg: 111.4,
      drtg: 108.2,
      netrtg: 3.2,
      pace: 96.8,
      homeW: 25,
      homeL: 11,
      awayW: 18,
      awayL: 18,
      ranks: { ppg: 25, papg: 3, diff: 12, ortg: 21, drtg: 3, netrtg: 11, pace: 28 },
    },
  },
};

/** L10 シフト（デモ用）+ Last10 リーグ順位（TOP5/10 · BOT10/5 用） */
const L10_SHIFTS: Record<
  string,
  {
    home: Parameters<typeof last10FromSeason>[1];
    away: Parameters<typeof last10FromSeason>[1];
  }
> = {
  "both-teams-rich": {
    home: {
      ppg: 5.4,
      papg: -2.1,
      ortg: 4.8,
      drtg: -2.4,
      pace: 1.6,
      formW: 8,
      formL: 2,
      formResults: ["W", "W", "L", "W", "W", "W", "W", "L", "W", "W"],
      ranks: { ppg: 2, papg: 8, diff: 3, ortg: 2, drtg: 9, netrtg: 3, pace: 8 },
    },
    away: {
      ppg: -3.2,
      papg: 3.8,
      ortg: -2.9,
      drtg: 3.1,
      pace: -0.8,
      formW: 4,
      formL: 6,
      formResults: ["L", "W", "L", "L", "W", "L", "W", "L", "L", "W"],
      ranks: { ppg: 18, papg: 24, diff: 22, ortg: 17, drtg: 23, netrtg: 22, pace: 25 },
    },
  },
  "strong-vs-neutral": {
    home: {
      ppg: 4.1,
      papg: -1.6,
      ortg: 3.5,
      drtg: -1.8,
      pace: 1.2,
      formW: 7,
      formL: 3,
      formResults: ["W", "L", "W", "W", "W", "L", "W", "W", "L", "W"],
      ranks: { ppg: 5, papg: 10, diff: 7, ortg: 6, drtg: 11, netrtg: 8, pace: 9 },
    },
    away: {
      ppg: 0.8,
      papg: 0.4,
      ortg: 0.6,
      drtg: 0.5,
      pace: -0.3,
      formW: 5,
      formL: 5,
      ranks: { ppg: 14, papg: 12, diff: 13, ortg: 14, drtg: 13, netrtg: 15, pace: 27 },
    },
  },
  "giant-killer-context": {
    home: {
      ppg: 6.2,
      papg: -3.4,
      ortg: 5.5,
      drtg: -3.0,
      pace: 0.9,
      formW: 7,
      formL: 3,
      ranks: { ppg: 4, papg: 7, diff: 4, ortg: 4, drtg: 8, netrtg: 4, pace: 12 },
    },
    away: {
      ppg: -1.1,
      papg: 2.4,
      ortg: -0.8,
      drtg: 2.0,
      pace: 0.4,
      formW: 6,
      formL: 4,
      ranks: { ppg: 3, papg: 5, diff: 2, ortg: 3, drtg: 4, netrtg: 2, pace: 7 },
    },
  },
  "underdog-pattern": {
    home: {
      ppg: -4.5,
      papg: 3.2,
      ortg: -4.0,
      drtg: 2.8,
      pace: -1.1,
      formW: 3,
      formL: 7,
      ranks: { ppg: 27, papg: 28, diff: 28, ortg: 26, drtg: 27, netrtg: 28, pace: 14 },
    },
    away: {
      ppg: 2.6,
      papg: -1.4,
      ortg: 2.2,
      drtg: -1.6,
      pace: 0.5,
      formW: 7,
      formL: 3,
      ranks: { ppg: 7, papg: 9, diff: 6, ortg: 7, drtg: 10, netrtg: 7, pace: 16 },
    },
  },
  sparse: {
    home: {
      ppg: 3.8,
      papg: -2.6,
      ortg: 3.4,
      drtg: -2.2,
      pace: 1.0,
      formW: 6,
      formL: 4,
      ranks: { ppg: 9, papg: 11, diff: 9, ortg: 10, drtg: 12, netrtg: 9, pace: 11 },
    },
    away: {
      ppg: -2.4,
      papg: 1.8,
      ortg: -2.0,
      drtg: 1.6,
      pace: -0.6,
      formW: 4,
      formL: 6,
      ranks: { ppg: 24, papg: 6, diff: 23, ortg: 23, drtg: 8, netrtg: 24, pace: 28 },
    },
  },
};

export const NBA_TEAM_STATS_BY_PRESET: Record<string, NbaTeamStatsBundle> = Object.fromEntries(
  Object.entries(SEASON_BY_PRESET).map(([id, season]) => {
    const shift = L10_SHIFTS[id] ?? L10_SHIFTS["both-teams-rich"]!;
    return [id, bundle(season, shift.home, shift.away)];
  })
);

export function teamStatsForPreset(presetId: string): NbaTeamStatsBundle {
  return (
    NBA_TEAM_STATS_BY_PRESET[presetId] ??
    NBA_TEAM_STATS_BY_PRESET["both-teams-rich"]!
  );
}
