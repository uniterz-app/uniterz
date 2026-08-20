/**
 * チーム詳細「どう点を取って、どう守るか」。
 * リーグ表の左レールと同じ指標を、この1チームの顔として出す。
 */
import {
  howPtsCell,
  ptsFromShare,
  type HowPts,
} from "@/lib/predict/nbaHowTheyPlayPts";
import {
  formatMetricValue,
  getNbaLeagueTeamStatsMock,
  metricValue,
  type NbaLeagueTeamStatMetric,
  type NbaLeagueTeamStatRow,
  type NbaLeagueTeamStatsBundle,
} from "@/lib/predict/nbaLeagueTeamStatsMocks";

export type TeamHowTheyPlayTab =
  | "fourFactors"
  | "scoring"
  | "playtype"
  | "shooting"
  | "clutch"
  | "hustle"
  | "tracking";

export const TEAM_HOW_THEY_PLAY_TABS: readonly {
  id: TeamHowTheyPlayTab;
  short: string;
  hintJa: string;
  hintEn: string;
}[] = [
  {
    id: "fourFactors",
    short: "4FCT",
    hintJa: "自チーム vs 許した側。eFG・TO・FT・OREB の型。",
    hintEn: "Own vs allowed. Four Factors profile.",
  },
  {
    id: "scoring",
    short: "SCORING",
    hintJa: "得点のうち 3P / ペイント / FT / ファストブレイク。割合と1試合平均の得点。",
    hintEn: "Share of points from 3s, paint, FTs, and fast breaks — plus points per game.",
  },
  {
    id: "playtype",
    short: "PLAYTYPE",
    hintJa: "PPP は効率、バーは使用率、pts はその型からの1試合平均得点。",
    hintEn: "PPP is efficiency. Bar is frequency. Pts is points per game from that type.",
  },
  {
    id: "shooting",
    short: "SHOT",
    hintJa: "restricted FG% とコーナー3%。成功率と、その場所からの1試合平均得点。",
    hintEn: "Restricted-area FG% and corner 3% — plus points per game from that spot.",
  },
  {
    id: "clutch",
    short: "CLUTCH",
    hintJa: "僅差・終盤の NET / ORTG / DRTG。",
    hintEn: "Clutch NET / ORTG / DRTG.",
  },
  {
    id: "hustle",
    short: "HUSTLE",
    hintJa: "ディフレクション・チャージ・ルーズボール。手数と体。",
    hintEn: "Deflections, charges, loose balls. Effort that doesn’t show in the box.",
  },
  {
    id: "tracking",
    short: "TRACK",
    hintJa: "ドライブ回数とドライブからの得点。C&S / プルアップも成功率と得点。",
    hintEn: "Drive volume and points from drives. Catch-and-shoot / pull-up FG% plus points.",
  },
];

export type TeamHowCell = {
  display: string;
  rank: number;
  value: number;
};

export type TeamFourFactorRow = {
  id: string;
  short: string;
  hintJa: string;
  hintEn: string;
  own: TeamHowCell;
  opp: TeamHowCell;
};

export type TeamScoringRow = {
  id: string;
  short: string;
  labelJa: string;
  labelEn: string;
  cell: TeamHowCell;
  pts: HowPts;
};

export type TeamPlaytypeRow = {
  id: string;
  short: string;
  ppp: TeamHowCell;
  freq: TeamHowCell;
  pts: HowPts;
};

export type TeamShotRow = {
  id: string;
  short: string;
  labelJa: string;
  labelEn: string;
  cell: TeamHowCell;
  pts: HowPts;
};

export type TeamClutchRow = {
  id: string;
  short: string;
  labelJa: string;
  labelEn: string;
  cell: TeamHowCell;
};

export type TeamHustleRow = {
  id: string;
  short: string;
  hintJa: string;
  hintEn: string;
  cell: TeamHowCell;
  pts?: HowPts;
};

export type TeamHowTheyPlay = {
  fourFactors: TeamFourFactorRow[];
  scoring: TeamScoringRow[];
  playtype: TeamPlaytypeRow[];
  shooting: TeamShotRow[];
  clutch: TeamClutchRow[];
  hustle: TeamHustleRow[];
  tracking: TeamHustleRow[];
};

function leagueRank(
  rows: NbaLeagueTeamStatRow[],
  metric: NbaLeagueTeamStatMetric,
  teamId: string,
  higherIsBetter: boolean
): number {
  const sorted = [...rows].sort((a, b) => {
    const va = metricValue(a, metric);
    const vb = metricValue(b, metric);
    if (va === vb) return a.teamId.localeCompare(b.teamId);
    return higherIsBetter ? vb - va : va - vb;
  });
  return (sorted.findIndex((r) => r.teamId === teamId) ?? 29) + 1;
}

function cell(
  rows: NbaLeagueTeamStatRow[],
  team: NbaLeagueTeamStatRow,
  metric: NbaLeagueTeamStatMetric,
  higherIsBetter: boolean
): TeamHowCell {
  const value = metricValue(team, metric);
  return {
    value,
    display: formatMetricValue(metric, value),
    rank: leagueRank(rows, metric, team.teamId, higherIsBetter),
  };
}

export function getTeamHowTheyPlay(
  teamId: string,
  bundle: NbaLeagueTeamStatsBundle = getNbaLeagueTeamStatsMock()
): TeamHowTheyPlay | null {
  const rows = bundle.season;
  const team = rows.find((r) => r.teamId === teamId);
  if (!team) return null;

  const fourFactors: TeamFourFactorRow[] = [
    {
      id: "efg",
      short: "eFG",
      hintJa: "実効 FG%。自分は高いほど点が入る。相手は低いほど止めている。",
      hintEn: "Effective FG%. High own / low allowed.",
      own: cell(rows, team, "efgPct", true),
      opp: cell(rows, team, "oppEfgPct", false),
    },
    {
      id: "tov",
      short: "TOV",
      hintJa: "ターンオーバー率。自分は低いほど安定。相手は高いほど奪えている。",
      hintEn: "Turnover rate. Low own / high forced.",
      own: cell(rows, team, "tovPct", false),
      opp: cell(rows, team, "oppTovPct", true),
    },
    {
      id: "ftr",
      short: "FTr",
      hintJa: "FTA / FGA。自分は高いほどラインへ。相手は低いほどファウルが少ない。",
      hintEn: "FT rate. High own / low allowed.",
      own: cell(rows, team, "ftaRate", true),
      opp: cell(rows, team, "oppFtaRate", false),
    },
    {
      id: "oreb",
      short: "OREB",
      hintJa: "OREB%。自分は高いほどセカンドチャンス。相手は低いほど拾わせない。",
      hintEn: "OREB%. High own / low allowed.",
      own: cell(rows, team, "orebPct", true),
      opp: cell(rows, team, "oppOrebPct", false),
    },
  ];

  const scoringShare = (
    id: string,
    short: string,
    labelJa: string,
    labelEn: string,
    metric: NbaLeagueTeamStatMetric
  ): TeamScoringRow => {
    const share = cell(rows, team, metric, true);
    return {
      id,
      short,
      labelJa,
      labelEn,
      cell: share,
      pts: howPtsCell(ptsFromShare(team.ppg, share.value)),
    };
  };

  const scoring: TeamScoringRow[] = [
    scoringShare("3", "3PT", "3P", "Threes", "pctPts3"),
    scoringShare("paint", "PAINT", "ペイント", "Paint", "pctPtsPaint"),
    scoringShare("ft", "FT", "FT", "Free throws", "pctPtsFt"),
    scoringShare("fb", "FB", "ファストブレイク", "Fast break", "pctPtsFb"),
  ];

  const playtypeRow = (
    id: string,
    short: string,
    pppMetric: NbaLeagueTeamStatMetric,
    freqMetric: NbaLeagueTeamStatMetric
  ): TeamPlaytypeRow => {
    const ppp = cell(rows, team, pppMetric, true);
    const freq = cell(rows, team, freqMetric, true);
    return {
      id,
      short,
      ppp,
      freq,
      pts: howPtsCell(ppp.value * team.pace * freq.value),
    };
  };

  const playtype: TeamPlaytypeRow[] = [
    playtypeRow("iso", "ISO", "isoPpp", "isoFreq"),
    playtypeRow("pnrB", "PnR-B", "pnrBhPpp", "pnrBhFreq"),
    playtypeRow("pnrR", "PnR-R", "pnrRollPpp", "pnrRollFreq"),
    playtypeRow("spot", "SPOT", "spotupPpp", "spotupFreq"),
    playtypeRow("tran", "TRAN", "transPpp", "transFreq"),
    playtypeRow("cut", "CUT", "cutPpp", "cutFreq"),
    playtypeRow("post", "POST", "postPpp", "postFreq"),
  ].sort((a, b) => b.freq.value - a.freq.value);

  const paintPts = ptsFromShare(team.ppg, team.pctPtsPaint);
  const shooting: TeamShotRow[] = [
    {
      id: "rim",
      short: "RIM",
      labelJa: "RESTRICTED FG%",
      labelEn: "RESTRICTED FG%",
      cell: cell(rows, team, "rimFgPct", true),
      pts: howPtsCell(paintPts * 0.78),
    },
    {
      id: "c3",
      short: "C3",
      labelJa: "CORNER 3%",
      labelEn: "CORNER 3%",
      cell: cell(rows, team, "corner3Pct", true),
      pts: howPtsCell(team.fg3a * 0.24 * team.corner3Pct * 3),
    },
  ];

  const clutch: TeamClutchRow[] = [
    {
      id: "net",
      short: "NET",
      labelJa: "NET",
      labelEn: "NET",
      cell: cell(rows, team, "clutchNet", true),
    },
    {
      id: "ortg",
      short: "ORTG",
      labelJa: "ORTG",
      labelEn: "ORTG",
      cell: cell(rows, team, "clutchOrtg", true),
    },
    {
      id: "drtg",
      short: "DRTG",
      labelJa: "DRTG",
      labelEn: "DRTG",
      cell: cell(rows, team, "clutchDrtg", false),
    },
  ];

  const hustle: TeamHustleRow[] = [
    {
      id: "deflections",
      short: "DEFL",
      hintJa: "パスを触って崩す回数。スティールの手前。",
      hintEn: "Deflections. The step before a steal.",
      cell: cell(rows, team, "deflections", true),
    },
    {
      id: "charges",
      short: "CHG",
      hintJa: "チャージングを誘った回数。体を張った守備。",
      hintEn: "Charges drawn. Taking a hit to stop the drive.",
      cell: cell(rows, team, "charges", true),
    },
    {
      id: "looseBalls",
      short: "LOOSE",
      hintJa: "ルーズボール。拾えば攻撃、拾われれば失点。",
      hintEn: "Loose balls recovered. Extra possessions, fewer giveaways.",
      cell: cell(rows, team, "looseBalls", true),
    },
    {
      id: "screenAst",
      short: "SCRN",
      hintJa: "スクリーンから味方が決めた数。オフボールの仕事。",
      hintEn: "Screen assists. Off-ball work that creates a make.",
      cell: cell(rows, team, "screenAst", true),
    },
    {
      id: "contestedShots",
      short: "CONT",
      hintJa: "相手シュートに手を出した数。クローズアウト。",
      hintEn: "Contested shots. Closeouts that bother the shooter.",
      cell: cell(rows, team, "contestedShots", true),
    },
  ];

  const tracking: TeamHustleRow[] = [
    {
      id: "drives",
      short: "DRIVE",
      hintJa: "ゴールへ仕掛ける回数と、ドライブからの1試合平均得点。",
      hintEn: "Drives per game, and points per game from those drives.",
      cell: cell(rows, team, "drives", true),
      pts: howPtsCell(team.drives * (0.4 + team.pctPtsPaint * 0.28)),
    },
    {
      id: "cnsFgPct",
      short: "C&S",
      hintJa: "止まって受けるシュート。成功率と、そこからの1試合平均得点。",
      hintEn: "Catch-and-shoot FG%, and points per game from those looks.",
      cell: cell(rows, team, "cnsFgPct", true),
      pts: howPtsCell(ptsFromShare(team.ppg, team.spotupFreq * 0.85)),
    },
    {
      id: "pullupFgPct",
      short: "PULL",
      hintJa: "ドリブルから自分で打つ精度と、そこからの1試合平均得点。",
      hintEn: "Pull-up FG%, and points per game created off the dribble.",
      cell: cell(rows, team, "pullupFgPct", true),
      pts: howPtsCell(
        ptsFromShare(team.ppg, team.isoFreq * 0.7 + team.pnrBhFreq * 0.22)
      ),
    },
    {
      id: "passes",
      short: "PASS",
      hintJa: "ボールを動かす手数。",
      hintEn: "Passes per game. How much the ball moves.",
      cell: cell(rows, team, "passes", true),
    },
    {
      id: "speed",
      short: "SPD",
      hintJa: "コート上の平均スピード。",
      hintEn: "Average speed on the floor.",
      cell: cell(rows, team, "speed", true),
    },
    {
      id: "paintTouches",
      short: "PAINT",
      hintJa: "ペイントに触れた回数と、ペイントタッチからの1試合平均得点。",
      hintEn: "Paint touches, and points per game from those touches.",
      cell: cell(rows, team, "paintTouches", true),
      pts: howPtsCell(team.paintTouches * (0.26 + team.rimFgPct * 0.22)),
    },
  ];

  return { fourFactors, scoring, playtype, shooting, clutch, hustle, tracking };
}
