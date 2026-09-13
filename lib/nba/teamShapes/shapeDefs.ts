/**
 * チーム「得意形／苦手形」— V1 + 効率系 V1.5。
 * liveStats.box 合計 + 最終スコア（+ 必要ならシーズン平均）で評価。
 */
import type { UiStrings } from "@/lib/i18n/ui";
import { L, type LocalizedLang } from "@/lib/i18n/localize";

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
  label: UiStrings;
  /** Insight / API / UI 用の短い条件文 */
  condition: UiStrings;
};

/** @deprecated 互換 — `def.label.ja` */
export function teamShapeLabelJa(def: TeamShapeDef): string {
  return def.label.ja;
}
/** @deprecated 互換 — `def.label.en` */
export function teamShapeLabelEn(def: TeamShapeDef): string {
  return def.label.en;
}
/** @deprecated 互換 — `def.condition.ja` */
export function teamShapeConditionJa(def: TeamShapeDef): string {
  return def.condition.ja;
}
/** @deprecated 互換 — `def.condition.en` */
export function teamShapeConditionEn(def: TeamShapeDef): string {
  return def.condition.en;
}

export const TEAM_SHAPE_EDGE_KIND_LABELS = {
  strength: {
    ja: "得意",
    en: "STRENGTH",
    ko: "강점",
    zh: "擅长",
    es: "FUERTE",
    pt: "FORTE",
    fr: "FORCE",
  },
  weakness: {
    ja: "苦手",
    en: "WEAKNESS",
    ko: "약점",
    zh: "苦手",
    es: "DÉBIL",
    pt: "FRACO",
    fr: "FAIBLE",
  },
} as const satisfies Record<"strength" | "weakness", UiStrings>;

export function resolveTeamShapeEdgeKindLabel(
  kind: "strength" | "weakness",
  lang: LocalizedLang
): string {
  return L(lang, TEAM_SHAPE_EDGE_KIND_LABELS[kind]);
}

export function resolveTeamShapeLabel(
  shapeId: string,
  lang: LocalizedLang,
  fallback?: { ja?: string; en?: string }
): string {
  const def = TEAM_SHAPE_DEF_BY_ID.get(shapeId as TeamShapeId);
  if (def) return L(lang, def.label);
  return L(lang, {
    ja: fallback?.ja ?? shapeId,
    en: fallback?.en ?? shapeId,
  });
}

export function resolveTeamShapeCondition(
  shapeId: string,
  lang: LocalizedLang,
  fallback?: { ja?: string; en?: string }
): string {
  const def = TEAM_SHAPE_DEF_BY_ID.get(shapeId as TeamShapeId);
  if (def) return L(lang, def.condition);
  return L(lang, {
    ja: fallback?.ja ?? shapeId,
    en: fallback?.en ?? shapeId,
  });
}

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
    label: {
      ja: "リバウンド型",
      en: "Rebound edge",
      ko: "리바운드형",
      zh: "篮板型",
      es: "Rebote",
      pt: "Rebote",
      fr: "Rebond",
    },
    condition: {
      ja: "リバウンド差 +5 以上",
      en: "Rebound margin ≥ +5",
      ko: "리바운드 차 +5 이상",
      zh: "篮板差 ≥ +5",
      es: "Margen de rebotes ≥ +5",
      pt: "Margem de rebotes ≥ +5",
      fr: "Marge de rebonds ≥ +5",
    },
  },
  {
    id: "fg3m_15",
    needsBox: true,
    edgeEligible: true,
    contextEligible: true,
    label: {
      ja: "3P依存型",
      en: "3P volume",
      ko: "3점 의존형",
      zh: "三分依赖型",
      es: "Volumen de triples",
      pt: "Volume de 3",
      fr: "Volume à 3 pts",
    },
    condition: {
      ja: "3P成功 15本以上",
      en: "3PM ≥ 15",
      ko: "3점 성공 15개 이상",
      zh: "三分命中 ≥ 15",
      es: "Triples anotados ≥ 15",
      pt: "Cestas de 3 ≥ 15",
      fr: "Paniers à 3 pts ≥ 15",
    },
  },
  {
    id: "fta_25",
    needsBox: true,
    edgeEligible: true,
    contextEligible: true,
    label: {
      ja: "FT獲得型",
      en: "FT volume",
      ko: "자유투 획득형",
      zh: "罚球获取型",
      es: "Volumen de libres",
      pt: "Volume de lances livres",
      fr: "Volume de lancers francs",
    },
    condition: {
      ja: "FT試投 25本以上",
      en: "FTA ≥ 25",
      ko: "자유투 시도 25개 이상",
      zh: "罚球出手 ≥ 25",
      es: "Intentos de libre ≥ 25",
      pt: "Tentativas de LL ≥ 25",
      fr: "Tentatives de LF ≥ 25",
    },
  },
  {
    id: "tov_le_10",
    needsBox: true,
    edgeEligible: true,
    contextEligible: true,
    label: {
      ja: "ターンオーバー抑制型",
      en: "Low TO",
      ko: "턴오버 억제형",
      zh: "低失误型",
      es: "Pocas pérdidas",
      pt: "Poucos turnovers",
      fr: "Peu de pertes",
    },
    condition: {
      ja: "TO 10個以下",
      en: "TO ≤ 10",
      ko: "턴오버 10개 이하",
      zh: "失误 ≤ 10",
      es: "Pérdidas ≤ 10",
      pt: "Turnovers ≤ 10",
      fr: "Pertes ≤ 10",
    },
  },
  {
    id: "opp_tov_ge_15",
    needsBox: true,
    edgeEligible: true,
    contextEligible: true,
    label: {
      ja: "相手TO誘発型",
      en: "Force TO",
      ko: "상대 턴오버 유발형",
      zh: "迫使对手失误型",
      es: "Forzar pérdidas",
      pt: "Forçar turnovers",
      fr: "Forcer les pertes",
    },
    condition: {
      ja: "相手TO 15個以上",
      en: "Opponent TO ≥ 15",
      ko: "상대 턴오버 15개 이상",
      zh: "对手失误 ≥ 15",
      es: "Pérdidas rivales ≥ 15",
      pt: "Turnovers do rival ≥ 15",
      fr: "Pertes adverses ≥ 15",
    },
  },
  {
    id: "ast_28",
    needsBox: true,
    edgeEligible: true,
    contextEligible: true,
    label: {
      ja: "アシスト型",
      en: "Assist volume",
      ko: "어시스트형",
      zh: "助攻型",
      es: "Volumen de asistencias",
      pt: "Volume de assistências",
      fr: "Volume de passes",
    },
    condition: {
      ja: "AST 28本以上",
      en: "AST ≥ 28",
      ko: "어시스트 28개 이상",
      zh: "助攻 ≥ 28",
      es: "Asistencias ≥ 28",
      pt: "Assistências ≥ 28",
      fr: "Passes décisives ≥ 28",
    },
  },
  {
    id: "pts_ge_120",
    needsBox: false,
    edgeEligible: false,
    contextEligible: false,
    label: {
      ja: "ハイスコア型",
      en: "High score",
      ko: "하이스코어형",
      zh: "高得分型",
      es: "Alta anotación",
      pt: "Placar alto",
      fr: "Score élevé",
    },
    condition: {
      ja: "自得点 120以上",
      en: "Team points ≥ 120",
      ko: "득점 120 이상",
      zh: "本队得分 ≥ 120",
      es: "Puntos del equipo ≥ 120",
      pt: "Pontos do time ≥ 120",
      fr: "Points de l’équipe ≥ 120",
    },
  },
  {
    id: "opp_pts_le_110",
    needsBox: false,
    edgeEligible: false,
    contextEligible: false,
    label: {
      ja: "守備型",
      en: "Hold under 110",
      ko: "수비형",
      zh: "防守型",
      es: "Mantener bajo 110",
      pt: "Segurar abaixo de 110",
      fr: "Tenir sous 110",
    },
    condition: {
      ja: "相手 110点以下",
      en: "Opponent points ≤ 110",
      ko: "상대 110점 이하",
      zh: "对手得分 ≤ 110",
      es: "Puntos rivales ≤ 110",
      pt: "Pontos do rival ≤ 110",
      fr: "Points adverses ≤ 110",
    },
  },
  {
    id: "margin_abs_le_5",
    needsBox: false,
    edgeEligible: true,
    contextEligible: true,
    label: {
      ja: "クラッチ型",
      en: "Close game",
      ko: "클러치형",
      zh: "关键时刻型",
      es: "Partido cerrado",
      pt: "Jogo apertado",
      fr: "Match serré",
    },
    condition: {
      ja: "最終点差 5点以内",
      en: "Final margin ≤ 5",
      ko: "최종 점수 차 5점 이내",
      zh: "最终分差 ≤ 5",
      es: "Margen final ≤ 5",
      pt: "Margem final ≤ 5",
      fr: "Écart final ≤ 5",
    },
  },
  {
    id: "total_pts_lt_220",
    needsBox: false,
    edgeEligible: true,
    contextEligible: true,
    label: {
      ja: "ロースコア型",
      en: "Low total",
      ko: "로우스코어형",
      zh: "低总分型",
      es: "Marcador bajo",
      pt: "Placar baixo",
      fr: "Score bas",
    },
    condition: {
      ja: "総得点 220未満",
      en: "Combined points < 220",
      ko: "합계 득점 220 미만",
      zh: "双方总分 < 220",
      es: "Puntos combinados < 220",
      pt: "Pontos combinados < 220",
      fr: "Points combinés < 220",
    },
  },
  // —— V1.5 効率 ——
  {
    id: "ortg_ge_118",
    needsBox: true,
    edgeEligible: true,
    contextEligible: true,
    label: {
      ja: "火力型",
      en: "Scoring punch",
      ko: "화력형",
      zh: "火力型",
      es: "Punche ofensivo",
      pt: "Poder ofensivo",
      fr: "Puissance offensive",
    },
    condition: {
      ja: "自ORtg ≥ 118",
      en: "Team ORtg ≥ 118",
      ko: "팀 ORtg ≥ 118",
      zh: "本队 ORtg ≥ 118",
      es: "ORtg del equipo ≥ 118",
      pt: "ORtg do time ≥ 118",
      fr: "ORtg de l’équipe ≥ 118",
    },
  },
  {
    id: "ortg_vs_self_plus5",
    needsBox: true,
    needsSeasonCtx: true,
    edgeEligible: false,
    contextEligible: true,
    label: {
      ja: "火力爆発型",
      en: "Offense spike",
      ko: "화력 폭발형",
      zh: "火力爆发型",
      es: "Explosión ofensiva",
      pt: "Explosão ofensiva",
      fr: "Explosion offensive",
    },
    condition: {
      ja: "自ORtgが自平均 +5以上",
      en: "Team ORtg ≥ season ORtg + 5",
      ko: "팀 ORtg가 시즌 평균 +5 이상",
      zh: "本队 ORtg ≥ 赛季均值 +5",
      es: "ORtg del equipo ≥ ORtg de temporada + 5",
      pt: "ORtg do time ≥ ORtg da temporada + 5",
      fr: "ORtg de l’équipe ≥ ORtg de saison + 5",
    },
  },
  {
    id: "pts_vs_opp_papg_plus8",
    needsBox: false,
    needsSeasonCtx: true,
    edgeEligible: false,
    contextEligible: true,
    label: {
      ja: "相手守備破壊型",
      en: "Beat their D",
      ko: "상대 수비 파괴형",
      zh: "击破对方防守型",
      es: "Romper su defensa",
      pt: "Quebrar a defesa rival",
      fr: "Casser leur défense",
    },
    condition: {
      ja: "自得点 − 相手平均失点 ≥ +8",
      en: "Points − opp season PA ≥ +8",
      ko: "득점 − 상대 시즌 실점 ≥ +8",
      zh: "得分 − 对手赛季场均失分 ≥ +8",
      es: "Puntos − PA media rival ≥ +8",
      pt: "Pontos − PA média rival ≥ +8",
      fr: "Points − PA moyenne adverse ≥ +8",
    },
  },
  {
    id: "opp_ortg_le_110",
    needsBox: true,
    edgeEligible: false,
    contextEligible: false,
    label: {
      ja: "本物の守備型",
      en: "True hold",
      ko: "진짜 수비형",
      zh: "真正防守型",
      es: "Verdadera contención",
      pt: "Contenção verdadeira",
      fr: "Vraie tenue défensive",
    },
    condition: {
      ja: "相手ORtg ≤ 110",
      en: "Opponent ORtg ≤ 110",
      ko: "상대 ORtg ≤ 110",
      zh: "对手 ORtg ≤ 110",
      es: "ORtg rival ≤ 110",
      pt: "ORtg do rival ≤ 110",
      fr: "ORtg adverse ≤ 110",
    },
  },
  {
    id: "opp_ortg_vs_opp_minus5",
    needsBox: true,
    needsSeasonCtx: true,
    edgeEligible: true,
    contextEligible: true,
    label: {
      ja: "守備抑制型",
      en: "Offense suppress",
      ko: "수비 억제형",
      zh: "压制进攻型",
      es: "Suprimir el ataque",
      pt: "Suprimir o ataque",
      fr: "Étouffer l’attaque",
    },
    condition: {
      ja: "相手ORtgが相手平均 −5以下",
      en: "Opp ORtg ≤ opp season ORtg − 5",
      ko: "상대 ORtg가 상대 시즌 평균 −5 이하",
      zh: "对手 ORtg ≤ 其赛季均值 −5",
      es: "ORtg rival ≤ ORtg media rival − 5",
      pt: "ORtg rival ≤ ORtg média rival − 5",
      fr: "ORtg adverse ≤ ORtg moyenne adverse − 5",
    },
  },
  {
    id: "opp_efg_le_52",
    needsBox: true,
    edgeEligible: true,
    contextEligible: true,
    label: {
      ja: "相手FG抑制型",
      en: "eFG clamp",
      ko: "상대 FG 억제형",
      zh: "压制对手命中率型",
      es: "Frenar eFG rival",
      pt: "Prender eFG rival",
      fr: "Brider l’eFG adverse",
    },
    condition: {
      ja: "相手eFG% ≤ 52%",
      en: "Opponent eFG% ≤ 52%",
      ko: "상대 eFG% ≤ 52%",
      zh: "对手 eFG% ≤ 52%",
      es: "eFG% rival ≤ 52%",
      pt: "eFG% do rival ≤ 52%",
      fr: "eFG% adverse ≤ 52%",
    },
  },
  {
    id: "opp_ortg_le_110_dreb_high",
    needsBox: true,
    edgeEligible: true,
    contextEligible: true,
    label: {
      ja: "守備完結型",
      en: "Lock + glass",
      ko: "수비 완결형",
      zh: "防守闭环型",
      es: "Cierre defensivo",
      pt: "Tranca + rebound",
      fr: "Verrou + rebond",
    },
    condition: {
      ja: "相手ORtg ≤ 110 ＋ DREB%高め",
      en: "Opp ORtg ≤ 110 and DREB% high",
      ko: "상대 ORtg ≤ 110 + DREB% 높음",
      zh: "对手 ORtg ≤ 110 且防守篮板率高",
      es: "ORtg rival ≤ 110 y DREB% alto",
      pt: "ORtg rival ≤ 110 e DREB% alto",
      fr: "ORtg adverse ≤ 110 et DREB% élevé",
    },
  },
];

export const TEAM_SHAPE_DEF_BY_ID: ReadonlyMap<TeamShapeId, TeamShapeDef> =
  new Map(TEAM_SHAPE_DEFS.map((d) => [d.id, d]));

/** Insight / UI に出す最小試合数 */
export const MIN_TEAM_SHAPE_GAMES = 5;

/** 得意とみなす baseline 差（割合ポイント、0–1） */
export const TEAM_SHAPE_EDGE_DELTA_MIN = 0.08;
