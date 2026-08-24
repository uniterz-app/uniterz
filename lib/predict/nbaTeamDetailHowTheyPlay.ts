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
  metricValue,
  type NbaLeagueTeamStatMetric,
  type NbaLeagueTeamStatRow,
  type NbaLeagueTeamStatsBundle,
} from "@/lib/predict/nbaLeagueTeamStatsMocks";
import { nbaSeasonStatsReady } from "@/lib/predict/nbaSeasonStatsReady";

export type TeamHowTheyPlayTab =
  | "fourFactors"
  | "scoring"
  | "playtype"
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

function zeroHowCell(metric: NbaLeagueTeamStatMetric): TeamHowCell {
  return {
    value: 0,
    display: formatMetricValue(metric, 0),
    rank: 30,
  };
}

/** 開幕前・データ無しでも UI を 0 で埋める */
export function emptyTeamHowTheyPlay(): TeamHowTheyPlay {
  const zPts = howPtsCell(0);
  return {
    fourFactors: [
      {
        id: "efg",
        short: "eFG",
        hintJa: "実効 FG%。自分は高いほど点が入る。相手は低いほど止めている。",
        hintEn: "Effective FG%. High own / low allowed.",
        own: zeroHowCell("efgPct"),
        opp: zeroHowCell("oppEfgPct"),
      },
      {
        id: "tov",
        short: "TOV",
        hintJa: "ターンオーバー率。自分は低いほど安定。相手は高いほど奪えている。",
        hintEn: "Turnover rate. Low own / high forced.",
        own: zeroHowCell("tovPct"),
        opp: zeroHowCell("oppTovPct"),
      },
      {
        id: "ftr",
        short: "FTr",
        hintJa: "FTA / FGA。自分は高いほどラインへ。相手は低いほどファウルが少ない。",
        hintEn: "FT rate. High own / low allowed.",
        own: zeroHowCell("ftaRate"),
        opp: zeroHowCell("oppFtaRate"),
      },
      {
        id: "oreb",
        short: "OREB",
        hintJa: "OREB%。自分は高いほどセカンドチャンス。相手は低いほど拾わせない。",
        hintEn: "OREB%. High own / low allowed.",
        own: zeroHowCell("orebPct"),
        opp: zeroHowCell("oppOrebPct"),
      },
    ],
    scoring: [
      {
        id: "3",
        short: "3PT",
        labelJa: "3P",
        labelEn: "Threes",
        cell: zeroHowCell("pctPts3"),
        pts: zPts,
      },
      {
        id: "paint",
        short: "PAINT",
        labelJa: "ペイント",
        labelEn: "Paint",
        cell: zeroHowCell("pctPtsPaint"),
        pts: zPts,
      },
      {
        id: "ft",
        short: "FT",
        labelJa: "FT",
        labelEn: "Free throws",
        cell: zeroHowCell("pctPtsFt"),
        pts: zPts,
      },
      {
        id: "fb",
        short: "FB",
        labelJa: "ファストブレイク",
        labelEn: "Fast break",
        cell: zeroHowCell("pctPtsFb"),
        pts: zPts,
      },
    ],
    playtype: [
      {
        id: "iso",
        short: "ISO",
        ppp: zeroHowCell("isoPpp"),
        freq: zeroHowCell("isoFreq"),
        pts: zPts,
      },
      {
        id: "pnrB",
        short: "PnR-B",
        ppp: zeroHowCell("pnrBhPpp"),
        freq: zeroHowCell("pnrBhFreq"),
        pts: zPts,
      },
      {
        id: "pnrR",
        short: "PnR-R",
        ppp: zeroHowCell("pnrRollPpp"),
        freq: zeroHowCell("pnrRollFreq"),
        pts: zPts,
      },
      {
        id: "spot",
        short: "SPOT",
        ppp: zeroHowCell("spotupPpp"),
        freq: zeroHowCell("spotupFreq"),
        pts: zPts,
      },
      {
        id: "tran",
        short: "TRAN",
        ppp: zeroHowCell("transPpp"),
        freq: zeroHowCell("transFreq"),
        pts: zPts,
      },
      {
        id: "cut",
        short: "CUT",
        ppp: zeroHowCell("cutPpp"),
        freq: zeroHowCell("cutFreq"),
        pts: zPts,
      },
      {
        id: "post",
        short: "POST",
        ppp: zeroHowCell("postPpp"),
        freq: zeroHowCell("postFreq"),
        pts: zPts,
      },
    ],
    clutch: [
      {
        id: "net",
        short: "NET",
        labelJa: "NET",
        labelEn: "NET",
        cell: zeroHowCell("clutchNet"),
      },
      {
        id: "ortg",
        short: "ORTG",
        labelJa: "ORTG",
        labelEn: "ORTG",
        cell: zeroHowCell("clutchOrtg"),
      },
      {
        id: "drtg",
        short: "DRTG",
        labelJa: "DRTG",
        labelEn: "DRTG",
        cell: zeroHowCell("clutchDrtg"),
      },
    ],
    hustle: [
      {
        id: "deflections",
        short: "DEFL",
        hintJa: "パスを触って崩す回数。スティールの手前。",
        hintEn: "Deflections. The step before a steal.",
        cell: zeroHowCell("deflections"),
      },
      {
        id: "charges",
        short: "CHG",
        hintJa: "チャージングを誘った回数。体を張った守備。",
        hintEn: "Charges drawn. Taking a hit to stop the drive.",
        cell: zeroHowCell("charges"),
      },
      {
        id: "looseBalls",
        short: "LOOSE",
        hintJa: "ルーズボール。拾えば攻撃、拾われれば失点。",
        hintEn: "Loose balls recovered. Extra possessions, fewer giveaways.",
        cell: zeroHowCell("looseBalls"),
      },
      {
        id: "screenAst",
        short: "SCRN",
        hintJa: "スクリーンから味方が決めた数。オフボールの仕事。",
        hintEn: "Screen assists. Off-ball work that creates a make.",
        cell: zeroHowCell("screenAst"),
      },
      {
        id: "contestedShots",
        short: "CONT",
        hintJa: "相手シュートに手を出した数。クローズアウト。",
        hintEn: "Contested shots. Closeouts that bother the shooter.",
        cell: zeroHowCell("contestedShots"),
      },
    ],
    tracking: [
      {
        id: "drives",
        short: "DRIVE",
        hintJa: "ゴールへ仕掛ける回数と、ドライブからの1試合平均得点。",
        hintEn: "Drives per game, and points per game from those drives.",
        cell: zeroHowCell("drives"),
        pts: zPts,
      },
      {
        id: "cnsFgPct",
        short: "C&S",
        hintJa: "止まって受けるシュート。成功率と、そこからの1試合平均得点。",
        hintEn: "Catch-and-shoot FG%, and points per game from those looks.",
        cell: zeroHowCell("cnsFgPct"),
        pts: zPts,
      },
      {
        id: "pullupFgPct",
        short: "PULL",
        hintJa: "ドリブルから自分で打つ精度と、そこからの1試合平均得点。",
        hintEn: "Pull-up FG%, and points per game created off the dribble.",
        cell: zeroHowCell("pullupFgPct"),
        pts: zPts,
      },
      {
        id: "passes",
        short: "PASS",
        hintJa: "ボールを動かす手数。",
        hintEn: "Passes per game. How much the ball moves.",
        cell: zeroHowCell("passes"),
      },
      {
        id: "speed",
        short: "SPD",
        hintJa: "コート上の平均スピード。",
        hintEn: "Average speed on the floor.",
        cell: zeroHowCell("speed"),
      },
      {
        id: "paintTouches",
        short: "PAINT",
        hintJa: "ペイントに触れた回数と、ペイントタッチからの1試合平均得点。",
        hintEn: "Paint touches, and points per game from those touches.",
        cell: zeroHowCell("paintTouches"),
        pts: zPts,
      },
    ],
  };
}

export function getTeamHowTheyPlay(
  teamId: string,
  bundle: NbaLeagueTeamStatsBundle
): TeamHowTheyPlay {
  if (!nbaSeasonStatsReady()) return emptyTeamHowTheyPlay();

  const rows = bundle.season;
  const team = rows.find((r) => r.teamId === teamId);
  if (!team) return emptyTeamHowTheyPlay();

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
      pts: howPtsCell(team.paintTouchPts),
    },
  ];

  return { fourFactors, scoring, playtype, clutch, hustle, tracking };
}
