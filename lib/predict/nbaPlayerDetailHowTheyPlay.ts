/**
 * プレイヤー詳細「どう点を取って、どう守るか」。
 * リーグ表の Advanced と同じ指標を、この1人の顔として出す。
 */
import { nbaSeasonStatsReady } from "@/lib/predict/nbaSeasonStatsReady";
import { getNbaPlayerDetailPreview } from "@/lib/predict/nbaPlayerDetailPreviewMocks";
import type { NbaPlayerDetailPreview } from "@/lib/predict/nbaPlayerDetailPreviewMocks";
import {
  howPtsCell,
  ptsFromShare,
  type HowPts,
} from "@/lib/predict/nbaHowTheyPlayPts";
import {
  formatPlayerAdvancedLeaderValue,
  playerAdvancedMetricDef,
  type NbaPlayerAdvancedLeaderMetric,
} from "@/lib/predict/nbaPlayerStatLeadersAdvanced";
import {
  type NbaPlayerStatLeadersBundle,
} from "@/lib/predict/nbaPlayerStatLeadersMocks";
import {
  type NbaLeagueTeamStatsBundle,
} from "@/lib/predict/nbaLeagueTeamStatsMocks";


function emptyLeadersBundle(): NbaPlayerStatLeadersBundle {
  return { season: {} as NbaPlayerStatLeadersBundle["season"], last10: {} as NbaPlayerStatLeadersBundle["last10"], asOfLabel: "UNAVAILABLE" };
}

function emptyTeamBundle(): NbaLeagueTeamStatsBundle {
  return { season: [], last10: [], asOfLabel: "UNAVAILABLE" };
}

/**
 * スタッツ詳細のリーグ順位は、選手メトリクスに載っているならそのまま出す。
 * （以前は Top30 ボードのみだった）
 */
export const PLAYER_DETAIL_RANK_MAX = 999;

export function isPlayerDetailRankShown(rank: number): boolean {
  return Number.isFinite(rank) && rank >= 1 && rank <= PLAYER_DETAIL_RANK_MAX;
}

/**
 * 年俸リーグ順位（BDL contracts `rank`）。
 * Top30 制限はしない（#31 以降も表示。無い/0 だけ隠す）。
 */
export function isPlayerDetailSalaryRankShown(rank: number): boolean {
  return Number.isFinite(rank) && rank >= 1;
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

/** リーダー表に居ない / ボード空 → 順位は出さない */
const RANK_UNAVAILABLE = 999;

import type { NbaPlayerSeasonMetricCell } from "@/lib/nba/playerSeasonMetrics/playerSeasonMetricsTypes";
import type { NbaPlayerLeaderMetricId } from "@/lib/predict/nbaPlayerStatLeadersMocks";

function cell(
  playerId: string,
  metric: NbaPlayerAdvancedLeaderMetric,
  leaders: NbaPlayerStatLeadersBundle,
  seasonMetrics?: Partial<
    Record<NbaPlayerLeaderMetricId, NbaPlayerSeasonMetricCell>
  >,
  _preset?: { value: number; rank: number }
): PlayerHowCell {
  const fromSnap = seasonMetrics?.[metric];
  if (fromSnap) {
    return {
      value: fromSnap.value,
      display: formatPlayerAdvancedLeaderValue(metric, fromSnap.value),
      rank: fromSnap.rank,
    };
  }
  const rows = leaders.season[metric] ?? [];
  const idx = rows.findIndex((r) => r.playerId === playerId);
  if (idx >= 0) {
    const value = rows[idx]!.value;
    return {
      value,
      display: formatPlayerAdvancedLeaderValue(metric, value),
      rank: idx + 1,
    };
  }
  // 実データ無しの指標はプレースホルダ（偽の #1 を出さない）
  return {
    value: Number.NaN,
    display: "—",
    rank: RANK_UNAVAILABLE,
  };
}

function rowFromMetric(
  playerId: string,
  metric: NbaPlayerAdvancedLeaderMetric,
  leaders: NbaPlayerStatLeadersBundle,
  seasonMetrics?: Partial<
    Record<NbaPlayerLeaderMetricId, NbaPlayerSeasonMetricCell>
  >,
  preset?: { value: number; rank: number }
): PlayerHowRow {
  const def = playerAdvancedMetricDef(metric);
  return {
    id: metric,
    short: def.short,
    hintJa: def.hintJa,
    hintEn: def.hintEn,
    cell: cell(playerId, metric, leaders, seasonMetrics, preset),
  };
}

function playtypeFreqs(
  playerId: string,
  leaders: NbaPlayerStatLeadersBundle,
  onCourtPoss: number,
  seasonMetrics?: Partial<
    Record<NbaPlayerLeaderMetricId, NbaPlayerSeasonMetricCell>
  >
): Record<string, PlayerHowCell> {
  const rows: Array<{
    id: string;
    freq: NbaPlayerAdvancedLeaderMetric;
    ppp: NbaPlayerAdvancedLeaderMetric;
    pts: NbaPlayerAdvancedLeaderMetric;
  }> = [
    { id: "iso", freq: "iso_freq", ppp: "iso_ppp", pts: "iso_pts" },
    { id: "pnrB", freq: "pnr_bh_freq", ppp: "pnr_bh_ppp", pts: "pnr_bh_pts" },
    { id: "pnrR", freq: "pnr_roll_freq", ppp: "pnr_roll_ppp", pts: "pnr_roll_pts" },
    { id: "spot", freq: "spotup_freq", ppp: "spotup_ppp", pts: "spotup_pts" },
    { id: "tran", freq: "trans_freq", ppp: "trans_ppp", pts: "trans_pts" },
    { id: "cut", freq: "cut_freq", ppp: "cut_ppp", pts: "cut_pts" },
    { id: "post", freq: "post_freq", ppp: "post_ppp", pts: "post_pts" },
    { id: "hnd", freq: "handoff_freq", ppp: "handoff_ppp", pts: "handoff_pts" },
    { id: "offs", freq: "offscreen_freq", ppp: "offscreen_ppp", pts: "offscreen_pts" },
    { id: "putb", freq: "oreb_freq", ppp: "oreb_ppp", pts: "oreb_pts" },
  ];
  const out: Record<string, PlayerHowCell> = {};
  for (const row of rows) {
    const fromLeader = cell(playerId, row.freq, leaders, seasonMetrics);
    if (Number.isFinite(fromLeader.value)) {
      out[row.id] = fromLeader;
      continue;
    }
    // ingest 前でも PPP×PTS が載っていれば頻度を推定（バー用）
    const ppp = cell(playerId, row.ppp, leaders, seasonMetrics);
    const pts = cell(playerId, row.pts, leaders, seasonMetrics);
    if (
      Number.isFinite(ppp.value) &&
      ppp.value > 0 &&
      Number.isFinite(pts.value) &&
      onCourtPoss > 0
    ) {
      const value = Math.max(
        0,
        Math.min(1, pts.value / (ppp.value * onCourtPoss))
      );
      out[row.id] = {
        value,
        display: `${(value * 100).toFixed(1)}%`,
        rank: RANK_UNAVAILABLE,
      };
      continue;
    }
    out[row.id] = {
      value: 0,
      display: "—",
      rank: RANK_UNAVAILABLE,
    };
  }
  return out;
}

export type PlayerHowTheyPlayInput = {
  leaders?: NbaPlayerStatLeadersBundle;
  teamStats?: NbaLeagueTeamStatsBundle;
  detail?: NbaPlayerDetailPreview;
};


export function emptyPlayerHowTheyPlay(): PlayerHowTheyPlay {
  return {
    ratings: [],
    fourFactors: [],
    scoring: [],
    playtype: [],
    shooting: [],
    clutch: [],
    defense: [],
    hustle: [],
    tracking: [],
  };
}

export function getPlayerHowTheyPlay(
  playerId: string,
  input: PlayerHowTheyPlayInput = {}
): PlayerHowTheyPlay {
  if (!nbaSeasonStatsReady()) return emptyPlayerHowTheyPlay();
  const leaders = input.leaders ?? emptyLeadersBundle();
  const teamStats = input.teamStats ?? emptyTeamBundle();
  const detail = input.detail ?? getNbaPlayerDetailPreview(playerId);
  const seasonMetrics = detail.leaderMetrics;
  const m = (
    metric: NbaPlayerAdvancedLeaderMetric,
    preset?: { value: number; rank: number }
  ) => rowFromMetric(playerId, metric, leaders, seasonMetrics, preset);
  const c = (metric: NbaPlayerAdvancedLeaderMetric) =>
    cell(playerId, metric, leaders, seasonMetrics);
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

  const teamPace =
    teamStats.season.find((t) => t.teamId === detail.teamId)?.pace ?? 100;
  const onCourtPoss = (detail.season.min / 48) * teamPace;
  const freq = playtypeFreqs(playerId, leaders, onCourtPoss, seasonMetrics);
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
