/**
 * Pro 分析レーダーチャート UI — 7言語
 */
import { L, resolveLocalizedLang } from "@/lib/i18n/localize";
import type { RadarAxisKey } from "@/app/component/pro/analysis/radarLevelUtils";

export type RadarChartCopy = ReturnType<typeof radarChartCopy>;

const AXIS_LABELS: Record<
  RadarAxisKey,
  { ja: string; en: string; ko: string; zh: string; es: string; pt: string; fr: string }
> = {
  winRate: {
    ja: "勝率",
    en: "Win rate",
    ko: "승률",
    zh: "胜率",
    es: "Win rate",
    pt: "Win rate",
    fr: "Win rate",
  },
  volume: {
    ja: "投稿量",
    en: "Volume",
    ko: "게시량",
    zh: "发帖量",
    es: "Volume",
    pt: "Volume",
    fr: "Volume",
  },
  upset: {
    ja: "Upset",
    en: "Upset",
    ko: "Upset",
    zh: "Upset",
    es: "Upset",
    pt: "Upset",
    fr: "Upset",
  },
  streak: {
    ja: "耐性",
    en: "Stamina",
    ko: "내성",
    zh: "耐力",
    es: "Stamina",
    pt: "Stamina",
    fr: "Stamina",
  },
};

export function radarAxisLabel(
  language: string | null | undefined,
  key: RadarAxisKey
): string {
  const lang = resolveLocalizedLang(language);
  return L(lang, AXIS_LABELS[key]);
}

export function radarChartCopy(language: string | null | undefined) {
  const lang = resolveLocalizedLang(language);
  return {
    lang,
    eyebrow: L(lang, {
      ja: "分析バランス",
      en: "Analysis balance",
      ko: "분석 밸런스",
      zh: "分析平衡",
      es: "Balance de análisis",
      pt: "Equilíbrio da análise",
      fr: "Équilibre d’analyse",
    }),
    title: L(lang, {
      ja: "レーダーチャート",
      en: "Radar chart",
      ko: "레이더 차트",
      zh: "雷达图",
      es: "Gráfico de radar",
      pt: "Gráfico de radar",
      fr: "Graphique radar",
    }),
    openInfo: L(lang, {
      ja: "説明を見る",
      en: "Show info",
      ko: "설명 보기",
      zh: "查看说明",
      es: "Ver info",
      pt: "Ver info",
      fr: "Voir l’info",
    }),
    closeInfo: L(lang, {
      ja: "説明を閉じる",
      en: "Hide info",
      ko: "설명 닫기",
      zh: "关闭说明",
      es: "Ocultar info",
      pt: "Ocultar info",
      fr: "Masquer l’info",
    }),
    ineligibleTitle: L(lang, {
      ja: "レーダーチャート（当月）",
      en: "Radar chart (this month)",
      ko: "레이더 차트(당월)",
      zh: "雷达图（本月）",
      es: "Radar (este mes)",
      pt: "Radar (este mês)",
      fr: "Radar (ce mois)",
    }),
    ineligibleBody: L(lang, {
      ja: "当月の確定投稿が10件以上あると、その月のアクティブユーザー同士の相対位置としてレーダーが表示されます。",
      en: "You need at least 10 settled posts this month to compare on the same basis as other active users.",
      ko: "당월 확정 게시가 10건 이상이면 그달 활성 사용자끼리의 상대 위치로 레이더가 표시됩니다.",
      zh: "本月需至少 10 条已结算帖子，才会按当月活跃用户相对位置显示雷达。",
      es: "Necesitas al menos 10 posts cerrados este mes para comparar con otros usuarios activos.",
      pt: "Você precisa de pelo menos 10 posts fechados neste mês para comparar com outros usuários ativos.",
      fr: "Il faut au moins 10 posts réglés ce mois pour comparer aux autres utilisateurs actifs.",
    }),
    percentileHint: L(lang, {
      ja: "「上位/下位%」は 0–10 スコアからの概算です（10投稿以上コホート）。",
      en: "“Top/Bottom %” is a 10% step estimate from the 0–10 score (10+ post cohort).",
      ko: "「상위/하위%」는 0–10 점수에서 추정한 값입니다(게시 10건 이상 코호트).",
      zh: "「上位/下位%」由 0–10 分数估算（10 帖以上人群）。",
      es: "“Top/Bottom %” es una estimación en pasos de 10% del score 0–10 (cohorte 10+ posts).",
      pt: "“Top/Bottom %” é uma estimativa em passos de 10% do score 0–10 (coorte 10+ posts).",
      fr: "« Top/Bottom % » est une estimation par pas de 10 % du score 0–10 (cohorte 10+ posts).",
    }),
    axisInfo: {
      winRate: L(lang, {
        ja: "当月・確定投稿10件以上のユーザー同士での相対位置です。",
        en: "Relative standing among users with 10+ settled posts this month.",
        ko: "당월·확정 게시 10건 이상 사용자끼리의 상대 위치입니다.",
        zh: "本月已结算帖子达 10 条以上用户之间的相对位置。",
        es: "Posición relativa entre usuarios con 10+ posts cerrados este mes.",
        pt: "Posição relativa entre usuários com 10+ posts fechados neste mês.",
        fr: "Position relative parmi les utilisateurs avec 10+ posts réglés ce mois.",
      }),
      volume: L(lang, {
        ja: "主戦場リーグの投稿数を、そのリーグで投稿した同母集団ユーザーと比較した相対です。",
        en: "Post count in your main league vs others in the cohort who posted in that league.",
        ko: "주 전장 리그 게시 수를 그 리그에 게시한 같은 모집단 사용자와 비교한 상대입니다.",
        zh: "主联赛发帖数相对同联赛同人群用户的位置。",
        es: "Posts en tu liga principal vs otros del cohort en esa liga.",
        pt: "Posts na liga principal vs outros da coorte nessa liga.",
        fr: "Posts dans votre ligue principale vs les autres de la cohorte dans cette ligue.",
      }),
      upset: L(lang, {
        ja: "Upset 得点の合計を、同母集団内で比較した相対です。",
        en: "How you stack up on upset points in that cohort.",
        ko: "Upset 점수 합계를 같은 모집단 안에서 비교한 상대입니다.",
        zh: "冷门积分合计在同人群中的相对位置。",
        es: "Cómo te ubicas en puntos de upset en ese cohort.",
        pt: "Como você se posiciona em pontos de upset nessa coorte.",
        fr: "Où vous vous situez en points d’upset dans cette cohorte.",
      }),
      streak: L(lang, {
        ja: "連勝・連敗のパターンから算出した指標を同母集団内で比較した相対です。",
        en: "Derived from max win/lose streaks; higher means steadier month-to-month rhythm within the cohort.",
        ko: "연승·연패 패턴에서 산출한 지표를 같은 모집단 안에서 비교한 상대입니다.",
        zh: "由连胜/连败模式算出的指标在同人群中的相对位置。",
        es: "Derivado de rachas máx. de W/L; más alto = ritmo más estable en el cohort.",
        pt: "Derivado de sequências máx. de W/L; maior = ritmo mais estável na coorte.",
        fr: "Issu des séries max V/D ; plus haut = rythme plus stable dans la cohorte.",
      }),
    },
    axisInfoLabels: {
      winRate: L(lang, AXIS_LABELS.winRate),
      volume: L(lang, AXIS_LABELS.volume),
      upset: L(lang, AXIS_LABELS.upset),
      streak: L(lang, AXIS_LABELS.streak),
    },
    infoFooter: L(lang, {
      ja: "各軸は 0–10（パーセンタイルを10段階に丸めた値）で、当月10投稿以上のユーザーを母集団としています。外側に広がるほど、その月の中でバランスよく強い位置です。",
      en: "Values are 0–10 percentile buckets (10% steps) within the monthly active cohort. A larger shape means stronger relative balance.",
      ko: "각 축은 0–10(퍼센타일을 10단계로 반올림)이며, 당월 게시 10건 이상 사용자를 모집단으로 합니다. 바깥으로 넓을수록 그달 안에서 균형 있게 강한 위치입니다.",
      zh: "各轴为 0–10（百分位按 10% 分档），以本月发帖 10 条以上用户为人群。形状越大，表示当月相对平衡越强。",
      es: "Valores 0–10 (pasos de 10%) en el cohort activo del mes. Una forma más grande = mejor balance relativo.",
      pt: "Valores 0–10 (passos de 10%) na coorte ativa do mês. Forma maior = equilíbrio relativo mais forte.",
      fr: "Valeurs 0–10 (pas de 10 %) dans la cohorte active du mois. Une forme plus large = meilleur équilibre relatif.",
    }),
    upsetNoisy: L(lang, {
      ja: "Upset は当月の波乱対象試合が5試合未満のため、解釈に注意が必要です。",
      en: "Upset is shown but may be noisy: fewer than 5 upset opportunities this month.",
      ko: "Upset은 당월 파란 대상 경기가 5경기 미만이라 해석에 주의가 필요합니다.",
      zh: "Upset 本月冷门机会不足 5 场，解读时请谨慎。",
      es: "Upset se muestra pero puede ser ruidoso: menos de 5 oportunidades este mes.",
      pt: "Upset aparece, mas pode ser ruidoso: menos de 5 oportunidades neste mês.",
      fr: "Upset est affiché mais peut être bruité : moins de 5 opportunités ce mois.",
    }),
    axisLabel: (key: RadarAxisKey) => radarAxisLabel(lang, key),
  };
}
