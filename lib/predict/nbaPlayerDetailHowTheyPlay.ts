/**
 * プレイヤー詳細「どう点を取って、どう守るか」。
 * リーグ表の Advanced と同じ指標を、この1人の顔として出す。
 */
import type { UiStrings } from "@/lib/i18n/ui";
import {
  HOW_THEY_PLAY_HUSTLE_HINTS,
  HOW_THEY_PLAY_SCORING_LABELS,
  HOW_THEY_PLAY_TRACKING_HINTS,
} from "@/lib/predict/nbaHowTheyPlayHints";
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
  hint: UiStrings;
}[] = [
  {
    id: "fourFactors",
    short: "4FCT",
    hint: {
      ja: "eFG・TO・FT・OREB。個人の攻撃の型。",
      en: "eFG, TO, FT, OREB. Individual four-factor profile.",
      ko: "eFG·TO·FT·OREB. 개인 공격 프로필.",
      zh: "eFG、失误、罚球、进攻篮板。个人进攻画像。",
      es: "eFG, pérdidas, FT, OREB. Perfil ofensivo individual.",
      pt: "eFG, turnovers, FT, OREB. Perfil ofensivo individual.",
      fr: "eFG, pertes, LF, OREB. Profil offensif individuel.",
    },
  },
  {
    id: "scoring",
    short: "SCORING",
    hint: {
      ja: "得点のうち 3P / ペイント / ミッド / FT / ファストブレイク。割合と1試合平均の得点。",
      en: "Share of points from 3s, paint, mid-range, FTs, and fast breaks — plus points per game.",
      ko: "득점 중 3점 / 페인트 / 미드레인지 / 자유투 / 속공 비중과 경기당 득점.",
      zh: "三分、禁区、中距离、罚球、快攻的得分占比与场均得分。",
      es: "Cuota de puntos de triple, zona, media distancia, libres y contragolpe, y puntos por partido.",
      pt: "Fatia de pontos de 3, garrafão, média distância, lances livres e contra-ataque, e pontos por jogo.",
      fr: "Part des points à 3 pts, raquette, mi-distance, lancers et contre-attaque, et points par match.",
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
    id: "shooting",
    short: "SHOT",
    hint: {
      ja: "restricted FG% とコーナー3%。成功率と、その場所からの1試合平均得点。",
      en: "Restricted-area FG% and corner 3% — plus points per game from that spot.",
      ko: "제한구역 FG%와 코너 3점%. 성공률과 해당 위치의 경기당 득점.",
      zh: "禁区命中率与底角三分命中率，以及该位置的场均得分。",
      es: "FG% en zona restringida y triple de esquina, con los puntos por partido de esa posición.",
      pt: "FG% na área restrita e 3 de canto, com os pontos por jogo daquela posição.",
      fr: "FG% en zone restreinte et 3 pts de coin, avec les points par match depuis ce spot.",
    },
  },
  {
    id: "clutch",
    short: "CLUTCH",
    hint: {
      ja: "僅差・終盤の PTS / FG% / USG。",
      en: "Clutch PTS / FG% / usage.",
      ko: "클러치 상황의 득점 / FG% / 사용 비중.",
      zh: "关键时刻的得分、命中率与使用率。",
      es: "PTS / FG% / usage en clutch.",
      pt: "PTS / FG% / usage no clutch.",
      fr: "PTS / FG% / usage en clutch.",
    },
  },
  {
    id: "defense",
    short: "DEFENSE",
    hint: {
      ja: "マッチアップと相手 FG%。低いほど止めている。",
      en: "Matchup and opponent FG%. Lower is better.",
      ko: "매치업과 상대 FG%. 낮을수록 잘 막고 있음.",
      zh: "对位与对手命中率。越低说明防得越好。",
      es: "Matchup y FG% del rival. Más bajo, mejor.",
      pt: "Matchup e FG% do adversário. Menor é melhor.",
      fr: "Duel et FG% adverse. Plus bas, mieux.",
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

export type PlayerHowCell = {
  display: string;
  rank: number;
  value: number;
};

export type PlayerHowRow = {
  id: string;
  short: string;
  hint: UiStrings;
  cell: PlayerHowCell;
  pts?: HowPts;
};

export type PlayerScoringRow = {
  id: string;
  short: string;
  label: UiStrings;
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
  label: UiStrings;
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
    hint: def.hint,
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
    label: UiStrings,
    metric: NbaPlayerAdvancedLeaderMetric
  ): PlayerScoringRow => {
    const share = c(metric);
    return {
      id,
      short,
      label,
      cell: share,
      pts: howPtsCell(ptsFromShare(ppg, share.value)),
    };
  };

  const scoring: PlayerScoringRow[] = [
    scoringShare("3", "3PT", HOW_THEY_PLAY_SCORING_LABELS.threes, "pct_pts_3"),
    scoringShare(
      "paint",
      "PAINT",
      HOW_THEY_PLAY_SCORING_LABELS.paint,
      "pct_pts_paint"
    ),
    scoringShare(
      "mid",
      "MID",
      HOW_THEY_PLAY_SCORING_LABELS.midRange,
      "pct_pts_mid"
    ),
    scoringShare(
      "ft",
      "FT",
      HOW_THEY_PLAY_SCORING_LABELS.freeThrows,
      "pct_pts_ft"
    ),
    scoringShare(
      "fb",
      "FB",
      HOW_THEY_PLAY_SCORING_LABELS.fastBreak,
      "pct_pts_fb"
    ),
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
      label: {
        ja: "ゴール下 FG%",
        en: "RESTRICTED FG%",
        ko: "제한구역 FG%",
        zh: "禁区命中率",
        es: "FG% ZONA RESTRINGIDA",
        pt: "FG% ÁREA RESTRITA",
        fr: "FG% ZONE RESTREINTE",
      },
      cell: c("restricted_fg_pct"),
      pts: zonePts(["restricted"], 2),
    },
    {
      id: "c3",
      short: "C3",
      label: {
        ja: "コーナー3%",
        en: "CORNER 3%",
        ko: "코너 3점%",
        zh: "底角三分命中率",
        es: "TRIPLE DE ESQUINA %",
        pt: "3 DE CANTO %",
        fr: "3 PTS DE COIN %",
      },
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
    { ...m("deflections"), hint: HOW_THEY_PLAY_HUSTLE_HINTS.deflections },
    { ...m("charges"), hint: HOW_THEY_PLAY_HUSTLE_HINTS.charges },
    { ...m("loose_balls"), hint: HOW_THEY_PLAY_HUSTLE_HINTS.looseBalls },
    { ...m("screen_ast"), hint: HOW_THEY_PLAY_HUSTLE_HINTS.screenAst },
    {
      ...m("contested_shots"),
      hint: HOW_THEY_PLAY_HUSTLE_HINTS.contestedShots,
    },
  ];

  const drives = c("drives");
  const paintTouches = c("paint_touches");
  const tracking: PlayerHowRow[] = [
    {
      ...m("drives"),
      hint: HOW_THEY_PLAY_TRACKING_HINTS.drives,
      pts: howPtsCell(drives.value * (0.42 + c("pct_pts_paint").value * 0.35)),
    },
    {
      ...m("cns_fg_pct"),
      hint: HOW_THEY_PLAY_TRACKING_HINTS.catchAndShoot,
      pts: howPtsCell(ptsFromShare(ppg, freq.spot!.value * 0.9)),
    },
    {
      ...m("pullup_fg_pct"),
      hint: HOW_THEY_PLAY_TRACKING_HINTS.pullUp,
      pts: howPtsCell(
        ptsFromShare(ppg, freq.iso!.value * 0.75 + freq.pnrB!.value * 0.2)
      ),
    },
    { ...m("passes"), hint: HOW_THEY_PLAY_TRACKING_HINTS.passes },
    { ...m("speed"), hint: HOW_THEY_PLAY_TRACKING_HINTS.speed },
    {
      ...m("paint_touches"),
      hint: HOW_THEY_PLAY_TRACKING_HINTS.paintTouches,
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
