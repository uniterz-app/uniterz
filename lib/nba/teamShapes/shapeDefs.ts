/**
 * チーム「得意形／苦手形」— V1 + 効率系 V1.5。
 * liveStats.box 合計 + 最終スコア（+ 必要ならシーズン平均）で評価。
 */
export const TEAM_SHAPE_V1_IDS = [
  // —— box / スコア（V1）——
  "reb_margin_plus5",
  "fg3m_15",
  "fta_25",
  "tov_le_10",
  "opp_tov_ge_15",
  "ast_28",
  "pts_ge_120",
  "opp_pts_le_110",
  "margin_abs_le_5",
  "total_pts_lt_220",
  // —— 効率系（V1.5）——
  "ortg_ge_118",
  "ortg_vs_self_plus5",
  "pts_vs_opp_papg_plus8",
  "opp_ortg_le_110",
  "opp_ortg_vs_opp_minus5",
  "opp_efg_le_52",
  "opp_ortg_le_110_dreb_high",
] as const;

export type TeamShapeId = (typeof TEAM_SHAPE_V1_IDS)[number];

export type TeamShapeDef = {
  id: TeamShapeId;
  /** box 合計が必要（スコアだけでは不可） */
  needsBox: boolean;
  /**
   * 相対条件にシーズン平均（自/相手 ORtg・PAPG）が必要。
   * 無いときは発火しない。
   */
  needsSeasonCtx?: boolean;
  /**
   * チーム詳細 EDGE に載せるか。
   * false = 勝敗と同義／一夜相対で EDGE 向きでない。
   */
  edgeEligible: boolean;
  /**
   * Pro Insight CONTEXT に載せるか（edge と独立）。
   * 相対・一夜の話はこっち。
   */
  contextEligible: boolean;
  labelJa: string;
  labelEn: string;
  /** Insight / API 用の短い条件文 */
  conditionEn: string;
  conditionJa: string;
};

/** V1.5 閾値（コード正） */
export const TEAM_SHAPE_THRESHOLDS = {
  ortgFire: 118,
  ortgSelfPlus: 5,
  ptsVsOppPapg: 8,
  oppOrtgHold: 110,
  oppOrtgSuppress: 5,
  oppEfgMax: 0.52,
  /** 守備完結: DREB% = DREB / (DREB + opp OREB) */
  drebPctHigh: 0.76,
  /** 推定 poss がこれ未満なら効率系は発火しない */
  minPoss: 60,
} as const;

export const TEAM_SHAPE_DEFS: ReadonlyArray<TeamShapeDef> = [
  {
    id: "reb_margin_plus5",
    needsBox: true,
    edgeEligible: true,
    contextEligible: true,
    labelJa: "リバウンド型",
    labelEn: "Rebound edge",
    conditionEn: "Rebound margin ≥ +5",
    conditionJa: "リバウンド差 +5 以上",
  },
  {
    id: "fg3m_15",
    needsBox: true,
    edgeEligible: true,
    contextEligible: true,
    labelJa: "3P依存型",
    labelEn: "3P volume",
    conditionEn: "3PM ≥ 15",
    conditionJa: "3P成功 15本以上",
  },
  {
    id: "fta_25",
    needsBox: true,
    edgeEligible: true,
    contextEligible: true,
    labelJa: "FT獲得型",
    labelEn: "FT volume",
    conditionEn: "FTA ≥ 25",
    conditionJa: "FT試投 25本以上",
  },
  {
    id: "tov_le_10",
    needsBox: true,
    edgeEligible: true,
    contextEligible: true,
    labelJa: "ターンオーバー抑制型",
    labelEn: "Low TO",
    conditionEn: "TO ≤ 10",
    conditionJa: "TO 10個以下",
  },
  {
    id: "opp_tov_ge_15",
    needsBox: true,
    edgeEligible: true,
    contextEligible: true,
    labelJa: "相手TO誘発型",
    labelEn: "Force TO",
    conditionEn: "Opponent TO ≥ 15",
    conditionJa: "相手TO 15個以上",
  },
  {
    id: "ast_28",
    needsBox: true,
    edgeEligible: true,
    contextEligible: true,
    labelJa: "アシスト型",
    labelEn: "Assist volume",
    conditionEn: "AST ≥ 28",
    conditionJa: "AST 28本以上",
  },
  {
    id: "pts_ge_120",
    needsBox: false,
    edgeEligible: false,
    contextEligible: false,
    labelJa: "ハイスコア型",
    labelEn: "High score",
    conditionEn: "Team points ≥ 120",
    conditionJa: "自得点 120以上",
  },
  {
    id: "opp_pts_le_110",
    needsBox: false,
    edgeEligible: false,
    contextEligible: false,
    labelJa: "守備型",
    labelEn: "Hold under 110",
    conditionEn: "Opponent points ≤ 110",
    conditionJa: "相手 110点以下",
  },
  {
    id: "margin_abs_le_5",
    needsBox: false,
    edgeEligible: true,
    contextEligible: true,
    labelJa: "クラッチ型",
    labelEn: "Close game",
    conditionEn: "Final margin ≤ 5",
    conditionJa: "最終点差 5点以内",
  },
  {
    id: "total_pts_lt_220",
    needsBox: false,
    edgeEligible: true,
    contextEligible: true,
    labelJa: "ロースコア型",
    labelEn: "Low total",
    conditionEn: "Combined points < 220",
    conditionJa: "総得点 220未満",
  },
  // —— V1.5 効率 ——
  {
    id: "ortg_ge_118",
    needsBox: true,
    edgeEligible: true,
    contextEligible: true,
    labelJa: "火力型",
    labelEn: "Scoring punch",
    conditionEn: "Team ORtg ≥ 118",
    conditionJa: "自ORtg ≥ 118",
  },
  {
    id: "ortg_vs_self_plus5",
    needsBox: true,
    needsSeasonCtx: true,
    edgeEligible: false,
    contextEligible: true,
    labelJa: "火力爆発型",
    labelEn: "Offense spike",
    conditionEn: "Team ORtg ≥ season ORtg + 5",
    conditionJa: "自ORtgが自平均 +5以上",
  },
  {
    id: "pts_vs_opp_papg_plus8",
    needsBox: false,
    needsSeasonCtx: true,
    edgeEligible: false,
    contextEligible: true,
    labelJa: "相手守備破壊型",
    labelEn: "Beat their D",
    conditionEn: "Points − opp season PA ≥ +8",
    conditionJa: "自得点 − 相手平均失点 ≥ +8",
  },
  {
    id: "opp_ortg_le_110",
    needsBox: true,
    edgeEligible: false,
    contextEligible: false,
    labelJa: "本物の守備型",
    labelEn: "True hold",
    conditionEn: "Opponent ORtg ≤ 110",
    conditionJa: "相手ORtg ≤ 110",
  },
  {
    id: "opp_ortg_vs_opp_minus5",
    needsBox: true,
    needsSeasonCtx: true,
    edgeEligible: true,
    contextEligible: true,
    labelJa: "守備抑制型",
    labelEn: "Offense suppress",
    conditionEn: "Opp ORtg ≤ opp season ORtg − 5",
    conditionJa: "相手ORtgが相手平均 −5以下",
  },
  {
    id: "opp_efg_le_52",
    needsBox: true,
    edgeEligible: true,
    contextEligible: true,
    labelJa: "相手FG抑制型",
    labelEn: "eFG clamp",
    conditionEn: "Opponent eFG% ≤ 52%",
    conditionJa: "相手eFG% ≤ 52%",
  },
  {
    id: "opp_ortg_le_110_dreb_high",
    needsBox: true,
    edgeEligible: true,
    contextEligible: true,
    labelJa: "守備完結型",
    labelEn: "Lock + glass",
    conditionEn: "Opp ORtg ≤ 110 and DREB% high",
    conditionJa: "相手ORtg ≤ 110 ＋ DREB%高め",
  },
];

export const TEAM_SHAPE_DEF_BY_ID: ReadonlyMap<TeamShapeId, TeamShapeDef> =
  new Map(TEAM_SHAPE_DEFS.map((d) => [d.id, d]));

/** Insight / UI に出す最小試合数 */
export const MIN_TEAM_SHAPE_GAMES = 5;

/** 得意とみなす baseline 差（割合ポイント、0–1） */
export const TEAM_SHAPE_EDGE_DELTA_MIN = 0.08;
