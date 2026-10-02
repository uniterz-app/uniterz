// synced from lib/reports/buildMonthlyOutlookSummary.ts — run npm run sync:monthly-report-builders
// 月次レポート「今月のサマリー」— テンプレ生成。
// docs/pro-subscription-plan.md §7
// 数字優先: パーセンタイル（上位%）→ 前月比 → 順位
// functions/src/reports/buildMonthlyOutlookSummary.ts と同期すること。

import { L, resolveLocalizedLang, type LocalizedLang } from "./localize";
import type {
  MonthlyReportOutlook,
  MonthlyReportRadar,
  MonthlyReportRadarAxisKey,
} from "./monthlyReportTypes";
import { MONTHLY_RADAR_AXIS_ORDER } from "./monthlyRadarJudge";

export type MonthlyOutlookMetricFacts = {
  /** 0–1 */
  winRate: number;
  posts: number;
  scorerHits: number;
  upsetPoints: number;
  /** 0–1 */
  activityRate: number;
  /** 軸に対応する前月比（あれば）。勝率は %pt 差でも絶対差でも可 */
  prevDelta?: Partial<
    Record<"win" | "scorer" | "upset" | "activity" | "points", number | null>
  >;
};

export type BuildMonthlyOutlookSummaryInput = {
  sampleEligible: boolean;
  strengths: MonthlyReportRadarAxisKey[];
  radar: MonthlyReportRadar;
  facts: MonthlyOutlookMetricFacts;
  lang?: LocalizedLang | string;
};

/** 軸名はブランド語。全言語共通 */
const AXIS_LABEL: Record<MonthlyReportRadarAxisKey, string> = {
  win: "WIN",
  scorer: "SCORER",
  upset: "UPSET",
  activity: "ACTIVITY",
  consistency: "CONSISTENCY",
};

/** パーセンタイル → 「上位 N%」（最低1） */
export function percentileToTopPercentLabel(p: number): number {
  const top = Math.round(100 - p);
  return Math.max(1, Math.min(99, top));
}

function pickStrengthAxis(
  strengths: MonthlyReportRadarAxisKey[],
  radar: MonthlyReportRadar
): MonthlyReportRadarAxisKey {
  const pool =
    strengths.length > 0 ? strengths : [...MONTHLY_RADAR_AXIS_ORDER];
  let best = pool[0]!;
  for (const a of pool) {
    if ((radar[a] ?? 0) > (radar[best] ?? 0)) best = a;
  }
  return best;
}

function pickImproveAxis(
  strengthAxis: MonthlyReportRadarAxisKey,
  radar: MonthlyReportRadar,
  activityRate: number
): MonthlyReportRadarAxisKey {
  if (activityRate < 0.5) return "activity";
  let worst: MonthlyReportRadarAxisKey | null = null;
  for (const a of MONTHLY_RADAR_AXIS_ORDER) {
    if (a === strengthAxis) continue;
    if (worst == null || (radar[a] ?? 0) < (radar[worst] ?? 0)) worst = a;
  }
  return worst ?? "scorer";
}

function strengthFact(
  axis: MonthlyReportRadarAxisKey,
  p: number,
  facts: MonthlyOutlookMetricFacts,
  lang: LocalizedLang
): string {
  const top = percentileToTopPercentLabel(p);
  const name = AXIS_LABEL[axis];
  const base = L(lang, {
    ja: `${name} は上位 ${top}% 帯`,
    en: `${name} landed in the top ${top}%`,
    ko: `${name}은 상위 ${top}% 구간`,
    zh: `${name} 处于前 ${top}% 区间`,
    es: `${name} quedó en el top ${top}%`,
    pt: `${name} ficou no top ${top}%`,
    fr: `${name} s'est classé dans le top ${top}%`,
  });

  const deltaKey =
    axis === "win"
      ? "win"
      : axis === "scorer"
        ? "scorer"
        : axis === "upset"
          ? "upset"
          : axis === "activity"
            ? "activity"
            : null;
  const d = deltaKey ? facts.prevDelta?.[deltaKey] : null;
  if (d != null && Number.isFinite(d) && d !== 0) {
    const sign = d > 0 ? "+" : "−";
    const abs = Math.abs(Math.round(d * 10) / 10);
    return L(lang, {
      ja: `${base}で、前月比 ${sign}${abs}`,
      en: `${base}, MoM ${sign}${abs}`,
      ko: `${base}, 전월 대비 ${sign}${abs}`,
      zh: `${base}，环比 ${sign}${abs}`,
      es: `${base}, MoM ${sign}${abs}`,
      pt: `${base}, MoM ${sign}${abs}`,
      fr: `${base}, ${sign}${abs} sur un mois`,
    });
  }
  return base;
}

function improveLine(
  axis: MonthlyReportRadarAxisKey,
  p: number,
  lang: LocalizedLang
): string {
  const name = AXIS_LABEL[axis];
  const pr = Math.round(p);
  if (axis === "activity") {
    return L(lang, {
      ja: `${name} は p${pr} と参加が薄く、量の土台が課題`,
      en: `${name} lagged (p${pr}) — pickup volume is still thin`,
      ko: `${name}은 p${pr}로 참여가 얇아 양의 토대가 과제`,
      zh: `${name} 仅 p${pr}，参与偏少，量的基础是课题`,
      es: `${name} se quedó atrás (p${pr}): el volumen de participación sigue siendo escaso`,
      pt: `${name} ficou atrás (p${pr}): o volume de participação ainda é baixo`,
      fr: `${name} est en retard (p${pr}) : le volume de participation reste faible`,
    });
  }
  if (p < 40) {
    return L(lang, {
      ja: `${name} は p${pr} とチャート低帯で穴になっている`,
      en: `${name} sat in the low band (p${pr}) and is a hole in the chart`,
      ko: `${name}은 p${pr}로 차트 하단에 머물러 빈틈이 되고 있다`,
      zh: `${name} 位于 p${pr} 的低带，成了图上的短板`,
      es: `${name} está en la banda baja (p${pr}) y es un hueco en el gráfico`,
      pt: `${name} está na faixa baixa (p${pr}) e é um furo no gráfico`,
      fr: `${name} reste dans la zone basse (p${pr}) et constitue un trou dans le graphique`,
    });
  }
  return L(lang, {
    ja: `${name} が相対的に弱く（p${pr}）、伸ばししろがある`,
    en: `${name} was the softest axis (p${pr})`,
    ko: `${name}이 상대적으로 약해(p${pr}) 성장 여력이 있다`,
    zh: `${name} 相对偏弱（p${pr}），仍有提升空间`,
    es: `${name} fue el eje más flojo (p${pr}) y tiene margen de mejora`,
    pt: `${name} foi o eixo mais fraco (p${pr}) e tem margem de melhora`,
    fr: `${name} a été l'axe le plus faible (p${pr}) et garde une marge de progression`,
  });
}

function goalLine(
  axis: MonthlyReportRadarAxisKey,
  lang: LocalizedLang
): string {
  switch (axis) {
    case "win":
      return L(lang, {
        ja: "勝率を中央値以上に戻す",
        en: "get win rate back above the cohort median",
        ko: "승률을 중앙값 이상으로 되돌리기",
        zh: "把胜率拉回中位数以上",
        es: "recuperar un win rate por encima de la mediana de la cohorte",
        pt: "recuperar uma taxa de acerto acima da mediana da coorte",
        fr: "ramener le taux de victoire au-dessus de la médiane",
      });
    case "scorer":
      return L(lang, {
        ja: "得点者予想に 10 試合以上入る",
        en: "enter scorer picks in at least 10 games",
        ko: "득점자 예상을 10경기 이상 하기",
        zh: "在至少 10 场比赛做得分者预测",
        es: "hacer picks de anotador en al menos 10 partidos",
        pt: "fazer palpites de cestinha em pelo menos 10 jogos",
        fr: "faire des picks de marqueur sur au moins 10 matchs",
      });
    case "upset":
      return L(lang, {
        ja: "週あたり UPSET 候補を意識して入れる",
        en: "slot in a couple of upset candidates each week",
        ko: "주마다 UPSET 후보를 의식적으로 넣기",
        zh: "每周有意识地放入 UPSET 候选",
        es: "meter un par de candidatos a upset cada semana",
        pt: "incluir alguns candidatos a upset por semana",
        fr: "glisser quelques candidats à l'upset chaque semaine",
      });
    case "activity":
      return L(lang, {
        ja: "ピックアップの半分以上に参加する",
        en: "hit at least half of the pickup slate",
        ko: "픽업의 절반 이상에 참여하기",
        zh: "参与至少一半的精选场次",
        es: "participar en al menos la mitad de los partidos destacados",
        pt: "participar de pelo menos metade dos jogos em destaque",
        fr: "jouer au moins la moitié des matchs sélectionnés",
      });
    case "consistency":
      return L(lang, {
        ja: "連敗の傷を抑えて週の安定を上げる",
        en: "cut losing runs and keep the week-to-week floor higher",
        ko: "연패의 상처를 줄여 주간 안정성을 높이기",
        zh: "控制连败损伤，提升每周的稳定性",
        es: "cortar las malas rachas y elevar el suelo semanal",
        pt: "cortar as sequências ruins e elevar o piso semanal",
        fr: "limiter les séries de défaites et relever le plancher hebdomadaire",
      });
  }
}

/**
 * レーダー・強み・事実値 → 今月のサマリー1本文。
 */
export function buildMonthlyOutlookSummary(
  input: BuildMonthlyOutlookSummaryInput
): MonthlyReportOutlook {
  const lang = resolveLocalizedLang(input.lang ?? "ja");
  const { sampleEligible, strengths, radar, facts } = input;

  if (!sampleEligible) {
    return {
      summary: L(lang, {
        ja: "ピックアップ参加が半分未満で、型より先に量の土台が必要。来月はまず半分以上への参加を目標にしたい。",
        en: "Pickup participation stayed under half, so style matters less than volume right now. Next month, clear the halfway mark on the pickup slate first.",
        ko: "픽업 참여가 절반 미만으로, 스타일보다 먼저 양의 토대가 필요하다. 다음 달에는 우선 절반 이상 참여를 목표로 하자.",
        zh: "精选场次的参与不到一半，比风格更需要先立起量的基础。下个月先把参与率提到一半以上。",
        es: "La participación en los partidos destacados se quedó por debajo de la mitad, así que ahora importa más el volumen que el estilo. El mes que viene, empieza por superar la mitad de la lista.",
        pt: "A participação nos jogos em destaque ficou abaixo da metade, então agora o volume importa mais que o estilo. No mês que vem, comece por passar da metade da lista.",
        fr: "La participation aux matchs sélectionnés est restée sous la moitié : le volume compte plus que le style pour l'instant. Le mois prochain, commencez par dépasser la moitié de la liste.",
      }),
    };
  }

  if (strengths.length >= 5) {
    return {
      summary: L(lang, {
        ja: "5軸すべてが強みラインに乗り、穴はほぼない月だった。来月は新しい尖りより、この水準を落とさない運用がテーマ。",
        en: "All five axes cleared the strength line — almost no hole this month. Next month the theme is holding the floor, not adding a new spike.",
        ko: "5개 축 모두가 강점 라인에 올라 빈틈이 거의 없는 달이었다. 다음 달은 새로운 뾰족함보다 이 수준을 유지하는 운영이 과제다.",
        zh: "五个维度全部达到强项线，本月几乎没有短板。下个月的主题不是再造尖点，而是守住这个水准。",
        es: "Los cinco ejes superaron la línea de fortaleza: casi sin huecos este mes. El tema del mes que viene es sostener el nivel, no añadir un nuevo pico.",
        pt: "Os cinco eixos passaram da linha de força: quase sem furos neste mês. O tema do mês que vem é sustentar o nível, não criar um novo pico.",
        fr: "Les cinq axes ont franchi la ligne de force : quasiment aucun trou ce mois-ci. Le thème du mois prochain est de tenir le niveau, pas d'ajouter un nouveau pic.",
      }),
    };
  }

  const strengthAxis = pickStrengthAxis(strengths, radar);
  const improveAxis = pickImproveAxis(
    strengthAxis,
    radar,
    facts.activityRate
  );
  const sp = radar[strengthAxis] ?? 50;
  const ip = radar[improveAxis] ?? 50;

  const sFact = strengthFact(strengthAxis, sp, facts, lang);
  const iLine = improveLine(improveAxis, ip, lang);
  const gLine = goalLine(improveAxis, lang);

  return {
    summary: L(lang, {
      ja: `${sFact}。一方、${iLine}。来月は${gLine}ことを目標にしたい。`,
      en: `${sFact}. Meanwhile ${iLine}. Next month, ${gLine}.`,
      ko: `${sFact}. 한편 ${iLine}. 다음 달 목표는 ${gLine}.`,
      zh: `${sFact}。另一方面，${iLine}。下个月的目标是${gLine}。`,
      es: `${sFact}. Por otro lado, ${iLine}. El objetivo del mes que viene: ${gLine}.`,
      pt: `${sFact}. Por outro lado, ${iLine}. O objetivo do próximo mês: ${gLine}.`,
      fr: `${sFact}. En revanche, ${iLine}. Objectif du mois prochain : ${gLine}.`,
    }),
  };
}
