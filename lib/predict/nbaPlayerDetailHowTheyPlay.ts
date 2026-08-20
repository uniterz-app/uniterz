/**
 * プレイヤー詳細「どう点を取って、どう守るか」。
 * リーグ表の Advanced と同じ指標を、この1人の顔として出す。
 */
import { getNbaPlayerDetailPreview } from "@/lib/predict/nbaPlayerDetailPreviewMocks";
import type { NbaPlayerDetailPreview } from "@/lib/predict/nbaPlayerDetailPreviewMocks";
import {
  howPtsCell,
  ptsFromShare,
  type HowPts,
} from "@/lib/predict/nbaHowTheyPlayPts";
import {
  buildPlayerAdvancedMetricValue,
  formatPlayerAdvancedLeaderValue,
  playerAdvancedMetricDef,
  type NbaPlayerAdvancedLeaderMetric,
} from "@/lib/predict/nbaPlayerStatLeadersAdvanced";
import {
  getNbaPlayerStatLeadersMock,
  type NbaPlayerStatLeadersBundle,
} from "@/lib/predict/nbaPlayerStatLeadersMocks";
import {
  getNbaLeagueTeamStatsMock,
  type NbaLeagueTeamStatsBundle,
} from "@/lib/predict/nbaLeagueTeamStatsMocks";

/** 詳細の順位は Top 30 だけ出す */
export const PLAYER_DETAIL_RANK_MAX = 30;

export function isPlayerDetailRankShown(rank: number): boolean {
  return Number.isFinite(rank) && rank >= 1 && rank <= PLAYER_DETAIL_RANK_MAX;
}

export type PlayerHowTheyPlayTab =
  | "fourFactors"
  | "scoring"
  | "playtype"
  | "shooting"
  | "clutch"
  | "defense"
  | "hustle"
  | "tracking";

export const PLAYER_HOW_THEY_PLAY_TABS: readonly {
  id: PlayerHowTheyPlayTab;
  short: string;
  hintJa: string;
  hintEn: string;
}[] = [
  {
    id: "fourFactors",
    short: "4FCT",
    hintJa: "eFG・TO・FT・OREB。個人の攻撃の型。",
    hintEn: "eFG, TO, FT, OREB. Individual four-factor profile.",
  },
  {
    id: "scoring",
    short: "SCORING",
    hintJa: "得点のうち 3P / ペイント / ミッド / FT / ファストブレイク。割合と1試合平均の得点。",
    hintEn: "Share of points from 3s, paint, mid-range, FTs, and fast breaks — plus points per game.",
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
    hintJa: "僅差・終盤の PTS / FG% / USG。",
    hintEn: "Clutch PTS / FG% / usage.",
  },
  {
    id: "defense",
    short: "DEFENSE",
    hintJa: "マッチアップと相手 FG%。低いほど止めている。",
    hintEn: "Matchup and opponent FG%. Lower is better.",
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

export type PlayerHowCell = {
  display: string;
  rank: number;
  value: number;
};

export type PlayerHowRow = {
  id: string;
  short: string;
  hintJa: string;
  hintEn: string;
  cell: PlayerHowCell;
  pts?: HowPts;
};

export type PlayerScoringRow = {
  id: string;
  short: string;
  labelJa: string;
  labelEn: string;
  cell: PlayerHowCell;
  pts: HowPts;
};

export type PlayerPlaytypeRow = {
  id: string;
  short: string;
  ppp: PlayerHowCell;
  freq: PlayerHowCell;
  pts: HowPts;
};

export type PlayerShotRow = {
  id: string;
  short: string;
  labelJa: string;
  labelEn: string;
  cell: PlayerHowCell;
  pts: HowPts;
};

export type PlayerHowTheyPlay = {
  ratings: PlayerHowRow[];
  fourFactors: PlayerHowRow[];
  scoring: PlayerScoringRow[];
  playtype: PlayerPlaytypeRow[];
  shooting: PlayerShotRow[];
  clutch: PlayerHowRow[];
  defense: PlayerHowRow[];
  hustle: PlayerHowRow[];
  tracking: PlayerHowRow[];
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

function pct3(n: number) {
  return Math.round(n * 1000) / 1000;
}

function leagueRank(
  metric: NbaPlayerAdvancedLeaderMetric,
  value: number,
  leaders: NbaPlayerStatLeadersBundle
): number {
  const def = playerAdvancedMetricDef(metric);
  const rows = leaders.season[metric] ?? [];
  const better = rows.filter((r) =>
    def.higherIsBetter ? r.value > value : r.value < value
  ).length;
  return better + 1;
}

function cell(
  playerId: string,
  metric: NbaPlayerAdvancedLeaderMetric,
  leaders: NbaPlayerStatLeadersBundle,
  preset?: { value: number; rank: number }
): PlayerHowCell {
  if (preset) {
    return {
      value: preset.value,
      display: formatPlayerAdvancedLeaderValue(metric, preset.value),
      rank: preset.rank,
    };
  }
  const rnd = mulberry32(hashSeed(`${playerId}:${metric}:how:v1`));
  const value = buildPlayerAdvancedMetricValue(metric, rnd);
  return {
    value,
    display: formatPlayerAdvancedLeaderValue(metric, value),
    rank: leagueRank(metric, value, leaders),
  };
}

function rowFromMetric(
  playerId: string,
  metric: NbaPlayerAdvancedLeaderMetric,
  leaders: NbaPlayerStatLeadersBundle,
  preset?: { value: number; rank: number }
): PlayerHowRow {
  const def = playerAdvancedMetricDef(metric);
  return {
    id: metric,
    short: def.short,
    hintJa: def.hintJa,
    hintEn: def.hintEn,
    cell: cell(playerId, metric, leaders, preset),
  };
}

function playtypeFreqs(playerId: string): Record<string, PlayerHowCell> {
  const rnd = mulberry32(hashSeed(`${playerId}:playtype-freq:v1`));
  const ids = [
    "iso",
    "pnrB",
    "pnrR",
    "spot",
    "tran",
    "cut",
    "post",
    "hnd",
    "offs",
    "putb",
  ] as const;
  const raw = ids.map(() => 0.18 + rnd());
  const sum = raw.reduce((a, b) => a + b, 0);
  const scale = 0.88;
  const out: Record<string, PlayerHowCell> = {};
  ids.forEach((id, i) => {
    const value = pct3((raw[i]! / sum) * scale);
    const rankRnd = mulberry32(hashSeed(`${playerId}:${id}:freq-rank:v1`));
    out[id] = {
      value,
      display: `${(value * 100).toFixed(1)}%`,
      rank: Math.max(1, Math.round(1 + rankRnd() * 119)),
    };
  });
  return out;
}

export type PlayerHowTheyPlayInput = {
  leaders?: NbaPlayerStatLeadersBundle;
  teamStats?: NbaLeagueTeamStatsBundle;
  detail?: NbaPlayerDetailPreview;
};

export function getPlayerHowTheyPlay(
  playerId: string,
  input: PlayerHowTheyPlayInput = {}
): PlayerHowTheyPlay {
  const leaders = input.leaders ?? getNbaPlayerStatLeadersMock();
  const teamStats = input.teamStats ?? getNbaLeagueTeamStatsMock();
  const detail = input.detail ?? getNbaPlayerDetailPreview(playerId);
  const m = (
    metric: NbaPlayerAdvancedLeaderMetric,
    preset?: { value: number; rank: number }
  ) => rowFromMetric(playerId, metric, leaders, preset);
  const c = (metric: NbaPlayerAdvancedLeaderMetric) =>
    cell(playerId, metric, leaders);
  const preset = (id: "per" | "ts_pct" | "usg") => {
    const hit = detail.advancedMetrics.find((x) => x.id === id);
    return hit ? { value: hit.value, rank: hit.leagueRank } : undefined;
  };

  const ratings: PlayerHowRow[] = [
    m("per", preset("per")),
    m("ts_pct", preset("ts_pct")),
    m("usg", preset("usg")),
    m("ortg"),
    m("drtg"),
  ];

  const fourFactors: PlayerHowRow[] = [
    m("efg_pct"),
    m("tov_pct"),
    m("fta_rate"),
    m("oreb_pct"),
  ];

  const ppg = detail.season.pts;
  const scoringShare = (
    id: string,
    short: string,
    labelJa: string,
    labelEn: string,
    metric: NbaPlayerAdvancedLeaderMetric
  ): PlayerScoringRow => {
    const share = c(metric);
    return {
      id,
      short,
      labelJa,
      labelEn,
      cell: share,
      pts: howPtsCell(ptsFromShare(ppg, share.value)),
    };
  };

  const scoring: PlayerScoringRow[] = [
    scoringShare("3", "3PT", "3P", "Threes", "pct_pts_3"),
    scoringShare("paint", "PAINT", "ペイント", "Paint", "pct_pts_paint"),
    scoringShare("mid", "MID", "ミッドレンジ", "Mid-range", "pct_pts_mid"),
    scoringShare("ft", "FT", "FT", "Free throws", "pct_pts_ft"),
    scoringShare("fb", "FB", "ファストブレイク", "Fast break", "pct_pts_fb"),
  ];

  const freq = playtypeFreqs(playerId);
  const teamPace =
    teamStats.season.find((t) => t.teamId === detail.teamId)?.pace ?? 100;
  const onCourtPoss = (detail.season.min / 48) * teamPace;
  const playtypeItem = (
    id: string,
    short: string,
    pppMetric: NbaPlayerAdvancedLeaderMetric,
    freqCell: PlayerHowCell
  ): PlayerPlaytypeRow => {
    const ppp = c(pppMetric);
    return {
      id,
      short,
      ppp,
      freq: freqCell,
      pts: howPtsCell(ppp.value * onCourtPoss * freqCell.value),
    };
  };

  const playtype: PlayerPlaytypeRow[] = [
    playtypeItem("iso", "ISO", "iso_ppp", freq.iso!),
    playtypeItem("pnrB", "PnR-B", "pnr_bh_ppp", freq.pnrB!),
    playtypeItem("pnrR", "PnR-R", "pnr_roll_ppp", freq.pnrR!),
    playtypeItem("spot", "SPOT", "spotup_ppp", freq.spot!),
    playtypeItem("tran", "TRAN", "trans_ppp", freq.tran!),
    playtypeItem("cut", "CUT", "cut_ppp", freq.cut!),
    playtypeItem("post", "POST", "post_ppp", freq.post!),
    playtypeItem("hnd", "HND", "handoff_ppp", freq.hnd!),
    playtypeItem("offs", "OFFS", "offscreen_ppp", freq.offs!),
    playtypeItem("putb", "PUTB", "oreb_ppp", freq.putb!),
  ].sort((a, b) => b.freq.value - a.freq.value);

  const gp = Math.max(1, detail.season.gamesPlayed);
  const zonePts = (ids: Array<(typeof detail.shotZones)[number]["id"]>, ptsPerMake: number) => {
    const total = ids.reduce((acc, id) => {
      const zone = detail.shotZones.find((z) => z.id === id);
      if (!zone) return acc;
      return acc + zone.fgPct * zone.fga * ptsPerMake;
    }, 0);
    return howPtsCell(total / gp);
  };

  const shooting: PlayerShotRow[] = [
    {
      id: "rim",
      short: "RIM",
      labelJa: "RESTRICTED FG%",
      labelEn: "RESTRICTED FG%",
      cell: c("restricted_fg_pct"),
      pts: zonePts(["restricted"], 2),
    },
    {
      id: "c3",
      short: "C3",
      labelJa: "CORNER 3%",
      labelEn: "CORNER 3%",
      cell: c("corner3_pct"),
      pts: zonePts(["left_corner_3", "right_corner_3"], 3),
    },
  ];

  const clutch: PlayerHowRow[] = [
    m("clutch_pts"),
    m("clutch_fg_pct"),
    m("clutch_usg"),
  ];

  const defense: PlayerHowRow[] = [
    m("matchup_fg_pct"),
    m("matchup_3pt_pct"),
    m("opp_2p_pct"),
    m("opp_3p_pct"),
    m("opp_lt6_pct"),
  ];

  const hustle: PlayerHowRow[] = [
    {
      ...m("deflections"),
      hintJa: "パスを触って崩す回数。スティールの手前。",
      hintEn: "Deflections. The step before a steal.",
    },
    {
      ...m("charges"),
      hintJa: "チャージングを誘った回数。体を張った守備。",
      hintEn: "Charges drawn. Taking a hit to stop the drive.",
    },
    {
      ...m("loose_balls"),
      hintJa: "ルーズボール。拾えば攻撃、拾われれば失点。",
      hintEn: "Loose balls recovered. Extra possessions, fewer giveaways.",
    },
    {
      ...m("screen_ast"),
      hintJa: "スクリーンから味方が決めた数。オフボールの仕事。",
      hintEn: "Screen assists. Off-ball work that creates a make.",
    },
    {
      ...m("contested_shots"),
      hintJa: "相手シュートに手を出した数。クローズアウト。",
      hintEn: "Contested shots. Closeouts that bother the shooter.",
    },
  ];

  const drives = c("drives");
  const paintTouches = c("paint_touches");
  const tracking: PlayerHowRow[] = [
    {
      ...m("drives"),
      hintJa: "ゴールへ仕掛ける回数と、ドライブからの1試合平均得点。",
      hintEn: "Drives per game, and points per game from those drives.",
      pts: howPtsCell(drives.value * (0.42 + c("pct_pts_paint").value * 0.35)),
    },
    {
      ...m("cns_fg_pct"),
      hintJa: "止まって受けるシュート。成功率と、そこからの1試合平均得点。",
      hintEn: "Catch-and-shoot FG%, and points per game from those looks.",
      pts: howPtsCell(ptsFromShare(ppg, freq.spot!.value * 0.9)),
    },
    {
      ...m("pullup_fg_pct"),
      hintJa: "ドリブルから自分で打つ精度と、そこからの1試合平均得点。",
      hintEn: "Pull-up FG%, and points per game created off the dribble.",
      pts: howPtsCell(
        ptsFromShare(ppg, freq.iso!.value * 0.75 + freq.pnrB!.value * 0.2)
      ),
    },
    {
      ...m("passes"),
      hintJa: "ボールを動かす手数。",
      hintEn: "Passes per game. How much the ball moves.",
    },
    {
      ...m("speed"),
      hintJa: "コート上の平均スピード。",
      hintEn: "Average speed on the floor.",
    },
    {
      ...m("paint_touches"),
      hintJa: "ペイントに触れた回数と、ペイントタッチからの1試合平均得点。",
      hintEn: "Paint touches, and points per game from those touches.",
      pts: howPtsCell(
        paintTouches.value * (0.28 + c("restricted_fg_pct").value * 0.22)
      ),
    },
  ];

  return {
    ratings,
    fourFactors,
    scoring,
    playtype,
    shooting,
    clutch,
    defense,
    hustle,
    tracking,
  };
}
