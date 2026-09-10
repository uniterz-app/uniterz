/**
 * チーム詳細「どう点を取って、どう守るか」。
 * リーグ表の左レールと同じ指標を、この1チームの顔として出す。
 */
import type { UiStrings } from "@/lib/i18n/ui";
import {
  HOW_THEY_PLAY_HUSTLE_HINTS,
  HOW_THEY_PLAY_SCORING_LABELS,
  HOW_THEY_PLAY_TRACKING_HINTS,
} from "@/lib/predict/nbaHowTheyPlayHints";
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
  hint: UiStrings;
}[] = [
  {
    id: "fourFactors",
    short: "4FCT",
    hint: {
      ja: "自チーム vs 許した側。eFG・TO・FT・OREB の型。",
      en: "Own vs allowed. Four Factors profile.",
      ko: "자기 팀 vs 허용. eFG·TO·FT·OREB 프로필.",
      zh: "本队与被对手取得的对比。四大要素画像。",
      es: "Propio vs concedido. Perfil de Four Factors.",
      pt: "Próprio vs concedido. Perfil dos Four Factors.",
      fr: "Réalisé vs concédé. Profil Four Factors.",
    },
  },
  {
    id: "scoring",
    short: "SCORING",
    hint: {
      ja: "得点のうち 3P / ペイント / FT / ファストブレイク。割合と1試合平均の得点。",
      en: "Share of points from 3s, paint, FTs, and fast breaks — plus points per game.",
      ko: "득점 중 3점 / 페인트 / 자유투 / 속공 비중과 경기당 득점.",
      zh: "三分、禁区、罚球、快攻的得分占比与场均得分。",
      es: "Cuota de puntos de triple, zona, libres y contragolpe, y puntos por partido.",
      pt: "Fatia de pontos de 3, garrafão, lances livres e contra-ataque, e pontos por jogo.",
      fr: "Part des points à 3 pts, dans la raquette, aux lancers et en contre-attaque, et points par match.",
    },
  },
  {
    id: "playtype",
    short: "PLAYTYPE",
    hint: {
      ja: "PPP は効率、バーは使用率、pts はその型からの1試合平均得点。",
      en: "PPP is efficiency. Bar is frequency. Pts is points per game from that type.",
      ko: "PPP는 효율, 바는 사용 비중, pts는 해당 플레이의 경기당 득점.",
      zh: "PPP 为效率，条形为使用占比，pts 为该战术的场均得分。",
      es: "PPP es eficiencia. La barra es frecuencia. Pts son puntos por partido de ese tipo.",
      pt: "PPP é eficiência. A barra é frequência. Pts são pontos por jogo naquele tipo.",
      fr: "PPP = efficacité. La barre = fréquence. Pts = points par match sur ce type.",
    },
  },
  {
    id: "clutch",
    short: "CLUTCH",
    hint: {
      ja: "僅差・終盤の NET / ORTG / DRTG。",
      en: "Clutch NET / ORTG / DRTG.",
      ko: "클러치 상황의 NET / ORTG / DRTG.",
      zh: "关键时刻的 NET / ORTG / DRTG。",
      es: "NET / ORTG / DRTG en clutch.",
      pt: "NET / ORTG / DRTG no clutch.",
      fr: "NET / ORTG / DRTG en clutch.",
    },
  },
  {
    id: "hustle",
    short: "HUSTLE",
    hint: {
      ja: "ディフレクション・チャージ・ルーズボール。手数と体。",
      en: "Deflections, charges, loose balls. Effort that doesn’t show in the box.",
      ko: "디플렉션·차징·루즈볼. 기록지에 남지 않는 노력.",
      zh: "干扰球、造进攻犯规、争抢球。数据栏之外的努力。",
      es: "Desvíos, cargas, balones sueltos. El esfuerzo que no sale en el box score.",
      pt: "Desvios, faltas de ataque, bolas soltas. Esforço que não aparece no box score.",
      fr: "Déviations, fautes provoquées, ballons perdus. L’effort invisible au box score.",
    },
  },
  {
    id: "tracking",
    short: "TRACK",
    hint: {
      ja: "ドライブ回数とドライブからの得点。C&S / プルアップも成功率と得点。",
      en: "Drive volume and points from drives. Catch-and-shoot / pull-up FG% plus points.",
      ko: "드라이브 횟수와 드라이브 득점. 캐치&슛 / 풀업의 성공률과 득점.",
      zh: "突破次数与突破得分。接球投与急停跳投的命中率和得分。",
      es: "Volumen de penetraciones y sus puntos. FG% y puntos en catch-and-shoot / pull-up.",
      pt: "Volume de drives e seus pontos. FG% e pontos em catch-and-shoot / pull-up.",
      fr: "Volume de pénétrations et points associés. FG% et points en catch-and-shoot / pull-up.",
    },
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
  hint: UiStrings;
  own: TeamHowCell;
  opp: TeamHowCell;
};

export type TeamScoringRow = {
  id: string;
  short: string;
  label: UiStrings;
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
  /** NET / ORTG / DRTG — 言語非依存の略号 */
  label: string;
  short: string;
  cell: TeamHowCell;
};

export type TeamHustleRow = {
  id: string;
  short: string;
  hint: UiStrings;
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

/** 行のコピーは空ボードと実データで共有する */
const FOUR_FACTOR_ROWS: readonly {
  id: string;
  short: string;
  hint: UiStrings;
  own: NbaLeagueTeamStatMetric;
  opp: NbaLeagueTeamStatMetric;
  ownHigherIsBetter: boolean;
}[] = [
  {
    id: "efg",
    short: "eFG",
    hint: {
      ja: "実効 FG%。自分は高いほど点が入る。相手は低いほど止めている。",
      en: "Effective FG%. High own / low allowed.",
      ko: "실질 야투 성공률. 자기 팀은 높을수록, 상대는 낮을수록 좋음.",
      zh: "有效命中率。本队越高越好，对手越低越好。",
      es: "eFG%. Propio alto / concedido bajo.",
      pt: "eFG%. Próprio alto / concedido baixo.",
      fr: "eFG%. Élevé pour soi / bas pour l’adversaire.",
    },
    own: "efgPct",
    opp: "oppEfgPct",
    ownHigherIsBetter: true,
  },
  {
    id: "tov",
    short: "TOV",
    hint: {
      ja: "ターンオーバー率。自分は低いほど安定。相手は高いほど奪えている。",
      en: "Turnover rate. Low own / high forced.",
      ko: "턴오버 비율. 자기 팀은 낮을수록 안정, 상대는 높을수록 잘 빼앗음.",
      zh: "失误率。本队越低越稳，对手越高说明抢断越多。",
      es: "Tasa de pérdidas. Propia baja / forzada alta.",
      pt: "Taxa de turnovers. Própria baixa / forçada alta.",
      fr: "Taux de pertes. Bas pour soi / élevé pour l’adversaire.",
    },
    own: "tovPct",
    opp: "oppTovPct",
    ownHigherIsBetter: false,
  },
  {
    id: "ftr",
    short: "FTr",
    hint: {
      ja: "FTA / FGA。自分は高いほどラインへ。相手は低いほどファウルが少ない。",
      en: "FT rate. High own / low allowed.",
      ko: "자유투 비율. 자기 팀은 높을수록, 상대는 낮을수록 좋음.",
      zh: "罚球率。本队越高说明常上罚球线，对手越低说明犯规越少。",
      es: "Tasa de FT. Propia alta / concedida baja.",
      pt: "Taxa de FT. Própria alta / concedida baixa.",
      fr: "Taux de LF. Élevé pour soi / bas pour l’adversaire.",
    },
    own: "ftaRate",
    opp: "oppFtaRate",
    ownHigherIsBetter: true,
  },
  {
    id: "oreb",
    short: "OREB",
    hint: {
      ja: "OREB%。自分は高いほどセカンドチャンス。相手は低いほど拾わせない。",
      en: "OREB%. High own / low allowed.",
      ko: "공격 리바운드 비율. 자기 팀은 높을수록 세컨드 찬스, 상대는 낮을수록 좋음.",
      zh: "进攻篮板率。本队越高越有二次机会，对手越低越好。",
      es: "OREB%. Propio alto / concedido bajo.",
      pt: "OREB%. Próprio alto / concedido baixo.",
      fr: "OREB%. Élevé pour soi / bas pour l’adversaire.",
    },
    own: "orebPct",
    opp: "oppOrebPct",
    ownHigherIsBetter: true,
  },
];

const SCORING_ROWS: readonly {
  id: string;
  short: string;
  label: UiStrings;
  metric: NbaLeagueTeamStatMetric;
}[] = [
  {
    id: "3",
    short: "3PT",
    label: HOW_THEY_PLAY_SCORING_LABELS.threes,
    metric: "pctPts3",
  },
  {
    id: "paint",
    short: "PAINT",
    label: HOW_THEY_PLAY_SCORING_LABELS.paint,
    metric: "pctPtsPaint",
  },
  {
    id: "ft",
    short: "FT",
    label: HOW_THEY_PLAY_SCORING_LABELS.freeThrows,
    metric: "pctPtsFt",
  },
  {
    id: "fb",
    short: "FB",
    label: HOW_THEY_PLAY_SCORING_LABELS.fastBreak,
    metric: "pctPtsFb",
  },
];

const PLAYTYPE_ROWS: readonly {
  id: string;
  short: string;
  ppp: NbaLeagueTeamStatMetric;
  freq: NbaLeagueTeamStatMetric;
}[] = [
  { id: "iso", short: "ISO", ppp: "isoPpp", freq: "isoFreq" },
  { id: "pnrB", short: "PnR-B", ppp: "pnrBhPpp", freq: "pnrBhFreq" },
  { id: "pnrR", short: "PnR-R", ppp: "pnrRollPpp", freq: "pnrRollFreq" },
  { id: "spot", short: "SPOT", ppp: "spotupPpp", freq: "spotupFreq" },
  { id: "tran", short: "TRAN", ppp: "transPpp", freq: "transFreq" },
  { id: "cut", short: "CUT", ppp: "cutPpp", freq: "cutFreq" },
  { id: "post", short: "POST", ppp: "postPpp", freq: "postFreq" },
];

const CLUTCH_ROWS: readonly {
  id: string;
  short: string;
  label: string;
  metric: NbaLeagueTeamStatMetric;
  higherIsBetter: boolean;
}[] = [
  {
    id: "net",
    short: "NET",
    label: "NET",
    metric: "clutchNet",
    higherIsBetter: true,
  },
  {
    id: "ortg",
    short: "ORTG",
    label: "ORTG",
    metric: "clutchOrtg",
    higherIsBetter: true,
  },
  {
    id: "drtg",
    short: "DRTG",
    label: "DRTG",
    metric: "clutchDrtg",
    higherIsBetter: false,
  },
];

const HUSTLE_ROWS: readonly {
  id: string;
  short: string;
  hint: UiStrings;
  metric: NbaLeagueTeamStatMetric;
}[] = [
  {
    id: "deflections",
    short: "DEFL",
    hint: HOW_THEY_PLAY_HUSTLE_HINTS.deflections,
    metric: "deflections",
  },
  {
    id: "charges",
    short: "CHG",
    hint: HOW_THEY_PLAY_HUSTLE_HINTS.charges,
    metric: "charges",
  },
  {
    id: "looseBalls",
    short: "LOOSE",
    hint: HOW_THEY_PLAY_HUSTLE_HINTS.looseBalls,
    metric: "looseBalls",
  },
  {
    id: "screenAst",
    short: "SCRN",
    hint: HOW_THEY_PLAY_HUSTLE_HINTS.screenAst,
    metric: "screenAst",
  },
  {
    id: "contestedShots",
    short: "CONT",
    hint: HOW_THEY_PLAY_HUSTLE_HINTS.contestedShots,
    metric: "contestedShots",
  },
];

const TRACKING_ROWS: readonly {
  id: string;
  short: string;
  hint: UiStrings;
  metric: NbaLeagueTeamStatMetric;
  hasPts: boolean;
}[] = [
  {
    id: "drives",
    short: "DRIVE",
    hint: HOW_THEY_PLAY_TRACKING_HINTS.drives,
    metric: "drives",
    hasPts: true,
  },
  {
    id: "cnsFgPct",
    short: "C&S",
    hint: HOW_THEY_PLAY_TRACKING_HINTS.catchAndShoot,
    metric: "cnsFgPct",
    hasPts: true,
  },
  {
    id: "pullupFgPct",
    short: "PULL",
    hint: HOW_THEY_PLAY_TRACKING_HINTS.pullUp,
    metric: "pullupFgPct",
    hasPts: true,
  },
  {
    id: "passes",
    short: "PASS",
    hint: HOW_THEY_PLAY_TRACKING_HINTS.passes,
    metric: "passes",
    hasPts: false,
  },
  {
    id: "speed",
    short: "SPD",
    hint: HOW_THEY_PLAY_TRACKING_HINTS.speed,
    metric: "speed",
    hasPts: false,
  },
  {
    id: "paintTouches",
    short: "PAINT",
    hint: HOW_THEY_PLAY_TRACKING_HINTS.paintTouches,
    metric: "paintTouches",
    hasPts: true,
  },
];

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
    fourFactors: FOUR_FACTOR_ROWS.map((row) => ({
      id: row.id,
      short: row.short,
      hint: row.hint,
      own: zeroHowCell(row.own),
      opp: zeroHowCell(row.opp),
    })),
    scoring: SCORING_ROWS.map((row) => ({
      id: row.id,
      short: row.short,
      label: row.label,
      cell: zeroHowCell(row.metric),
      pts: zPts,
    })),
    playtype: PLAYTYPE_ROWS.map((row) => ({
      id: row.id,
      short: row.short,
      ppp: zeroHowCell(row.ppp),
      freq: zeroHowCell(row.freq),
      pts: zPts,
    })),
    clutch: CLUTCH_ROWS.map((row) => ({
      id: row.id,
      short: row.short,
      label: row.label,
      cell: zeroHowCell(row.metric),
    })),
    hustle: HUSTLE_ROWS.map((row) => ({
      id: row.id,
      short: row.short,
      hint: row.hint,
      cell: zeroHowCell(row.metric),
    })),
    tracking: TRACKING_ROWS.map((row) => ({
      id: row.id,
      short: row.short,
      hint: row.hint,
      cell: zeroHowCell(row.metric),
      ...(row.hasPts ? { pts: zPts } : {}),
    })),
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

  const fourFactors: TeamFourFactorRow[] = FOUR_FACTOR_ROWS.map((row) => ({
    id: row.id,
    short: row.short,
    hint: row.hint,
    own: cell(rows, team, row.own, row.ownHigherIsBetter),
    opp: cell(rows, team, row.opp, !row.ownHigherIsBetter),
  }));

  const scoring: TeamScoringRow[] = SCORING_ROWS.map((row) => {
    const share = cell(rows, team, row.metric, true);
    return {
      id: row.id,
      short: row.short,
      label: row.label,
      cell: share,
      pts: howPtsCell(ptsFromShare(team.ppg, share.value)),
    };
  });

  const playtype: TeamPlaytypeRow[] = PLAYTYPE_ROWS.map((row) => {
    const ppp = cell(rows, team, row.ppp, true);
    const freq = cell(rows, team, row.freq, true);
    return {
      id: row.id,
      short: row.short,
      ppp,
      freq,
      pts: howPtsCell(ppp.value * team.pace * freq.value),
    };
  }).sort((a, b) => b.freq.value - a.freq.value);

  const clutch: TeamClutchRow[] = CLUTCH_ROWS.map((row) => ({
    id: row.id,
    short: row.short,
    label: row.label,
    cell: cell(rows, team, row.metric, row.higherIsBetter),
  }));

  const hustle: TeamHustleRow[] = HUSTLE_ROWS.map((row) => ({
    id: row.id,
    short: row.short,
    hint: row.hint,
    cell: cell(rows, team, row.metric, true),
  }));

  const trackingPts: Record<string, HowPts | undefined> = {
    drives: howPtsCell(team.drives * (0.4 + team.pctPtsPaint * 0.28)),
    cnsFgPct: howPtsCell(ptsFromShare(team.ppg, team.spotupFreq * 0.85)),
    pullupFgPct: howPtsCell(
      ptsFromShare(team.ppg, team.isoFreq * 0.7 + team.pnrBhFreq * 0.22)
    ),
    paintTouches: howPtsCell(team.paintTouchPts),
  };

  const tracking: TeamHustleRow[] = TRACKING_ROWS.map((row) => {
    const pts = row.hasPts ? trackingPts[row.id] : undefined;
    return {
      id: row.id,
      short: row.short,
      hint: row.hint,
      cell: cell(rows, team, row.metric, true),
      ...(pts ? { pts } : {}),
    };
  });

  return { fourFactors, scoring, playtype, clutch, hustle, tracking };
}
