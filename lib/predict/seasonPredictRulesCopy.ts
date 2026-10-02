/**
 * シーズン予想ルールモーダル用コピー（順位 / アワード）。
 */
import { L, resolveLocalizedLang, type LocalizedLang } from "@/lib/i18n/localize";
import { SEASON_PREDICT_SUBMIT_DEADLINE_WHEN } from "@/lib/predict/seasonPredictDeadline";
import {
  SEASON_AWARDS_COUNT,
  SEASON_AWARDS_SCORE,
  SEASON_STANDINGS_SCORE,
} from "@/lib/predict/seasonPredictScoring";
import {
  SEASON_PREDICT_UNIT_MAX_RANK,
  SEASON_PREDICT_UNITS_BY_RANK,
} from "@/lib/units/seasonPredictUnitRewards";

export type SeasonPredictRulesKind = "standings" | "awards";
export type SeasonPredictRulesLang = LocalizedLang;
export const resolveSeasonPredictRulesLang = resolveLocalizedLang;

export type SeasonPredictRulesSection = {
  title: string;
  bullets: readonly string[];
};

function unitRankLine(
  lang: SeasonPredictRulesLang,
  from: number,
  to: number,
  amounts: string
): string {
  if (lang === "ja") return `${from}–${to}位  ${amounts}`;
  if (lang === "ko") return `${from}–${to}위  ${amounts}`;
  if (lang === "zh") return `第${from}–${to}名  ${amounts}`;
  if (lang === "es") return `#${from}–#${to}  ${amounts}`;
  if (lang === "pt") return `#${from}–#${to}  ${amounts}`;
  if (lang === "fr") return `#${from}–#${to}  ${amounts}`;
  return `#${from}–#${to}  ${amounts}`;
}

function unitEarnLines(lang: SeasonPredictRulesLang): string[] {
  const chunks: string[] = [];
  for (let i = 0; i < SEASON_PREDICT_UNITS_BY_RANK.length; i += 5) {
    const slice = SEASON_PREDICT_UNITS_BY_RANK.slice(i, i + 5);
    const from = i + 1;
    const to = i + slice.length;
    chunks.push(unitRankLine(lang, from, to, slice.join(" / ")));
  }
  return [
    L(lang, {
      ja: `上位 ${SEASON_PREDICT_UNIT_MAX_RANK} 人`,
      en: `Top ${SEASON_PREDICT_UNIT_MAX_RANK}`,
      ko: `상위 ${SEASON_PREDICT_UNIT_MAX_RANK}명`,
      zh: `前 ${SEASON_PREDICT_UNIT_MAX_RANK} 名`,
      es: `Top ${SEASON_PREDICT_UNIT_MAX_RANK}`,
      pt: `Top ${SEASON_PREDICT_UNIT_MAX_RANK}`,
      fr: `Top ${SEASON_PREDICT_UNIT_MAX_RANK}`,
    }),
    ...chunks,
  ];
}

function deadlineSection(
  lang: SeasonPredictRulesLang
): SeasonPredictRulesSection {
  return {
    title: L(lang, {
      ja: "締切",
      en: "Deadline",
      ko: "마감",
      zh: "截止",
      es: "Plazo",
      pt: "Prazo",
      fr: "Date limite",
    }),
    bullets: [
      L(lang, {
        ja: `${SEASON_PREDICT_SUBMIT_DEADLINE_WHEN} まで`,
        en: `Until ${SEASON_PREDICT_SUBMIT_DEADLINE_WHEN}`,
        ko: `${SEASON_PREDICT_SUBMIT_DEADLINE_WHEN} 까지`,
        zh: `至 ${SEASON_PREDICT_SUBMIT_DEADLINE_WHEN}`,
        es: `Hasta ${SEASON_PREDICT_SUBMIT_DEADLINE_WHEN}`,
        pt: `Até ${SEASON_PREDICT_SUBMIT_DEADLINE_WHEN}`,
        fr: `Jusqu’au ${SEASON_PREDICT_SUBMIT_DEADLINE_WHEN}`,
      }),
    ],
  };
}

function scoringSection(
  kind: SeasonPredictRulesKind,
  lang: SeasonPredictRulesLang
): SeasonPredictRulesSection {
  if (kind === "standings") {
    const s = SEASON_STANDINGS_SCORE;
    return {
      title: L(lang, {
        ja: "採点",
        en: "Scoring",
        ko: "채점",
        zh: "计分",
        es: "Puntuación",
        pt: "Pontuação",
        fr: "Score",
      }),
      bullets: [
        L(lang, {
          ja: `公式最終順位との差。一致 +${s.exact} / ±1 +${s.within1} / ±2 +${s.within2} / それ以外 0。`,
          en: `Vs official standings: exact +${s.exact} / ±1 +${s.within1} / ±2 +${s.within2} / else 0.`,
          ko: `공식 최종 순위와의 차이. 일치 +${s.exact} / ±1 +${s.within1} / ±2 +${s.within2} / 그 외 0.`,
          zh: `与官方最终排名对比：完全一致 +${s.exact} / ±1 +${s.within1} / ±2 +${s.within2} / 其他 0。`,
          es: `Vs clasificación oficial: exacto +${s.exact} / ±1 +${s.within1} / ±2 +${s.within2} / resto 0.`,
          pt: `Vs classificação oficial: exato +${s.exact} / ±1 +${s.within1} / ±2 +${s.within2} / resto 0.`,
          fr: `Vs classement officiel : exact +${s.exact} / ±1 +${s.within1} / ±2 +${s.within2} / sinon 0.`,
        }),
      ],
    };
  }
  const a = SEASON_AWARDS_SCORE;
  return {
    title: L(lang, {
      ja: "採点",
      en: "Scoring",
      ko: "채점",
      zh: "计分",
      es: "Puntuación",
      pt: "Pontuação",
      fr: "Score",
    }),
    bullets: [
      L(lang, {
        ja: `公式受賞者と一致で +${a.exact}、外れ 0（${SEASON_AWARDS_COUNT} 種）。`,
        en: `Vs official winners: hit +${a.exact} / miss 0 (${SEASON_AWARDS_COUNT} awards).`,
        ko: `공식 수상자 일치 +${a.exact}, 불일치 0 (${SEASON_AWARDS_COUNT}개).`,
        zh: `与官方获奖者一致 +${a.exact}，未中 0（${SEASON_AWARDS_COUNT} 项）。`,
        es: `Vs ganadores oficiales: acierto +${a.exact} / fallo 0 (${SEASON_AWARDS_COUNT} premios).`,
        pt: `Vs vencedores oficiais: acerto +${a.exact} / erro 0 (${SEASON_AWARDS_COUNT} prêmios).`,
        fr: `Vs lauréats officiels : bon +${a.exact} / raté 0 (${SEASON_AWARDS_COUNT} trophées).`,
      }),
    ],
  };
}

function unitsSection(lang: SeasonPredictRulesLang): SeasonPredictRulesSection {
  return {
    title: L(lang, {
      ja: "獲得 UNIT",
      en: "Units",
      ko: "획득 UNIT",
      zh: "获得 UNIT",
      es: "Units",
      pt: "Units",
      fr: "Units",
    }),
    bullets: unitEarnLines(lang),
  };
}

export function seasonPredictRulesSections(
  kind: SeasonPredictRulesKind,
  lang: SeasonPredictRulesLang
): readonly SeasonPredictRulesSection[] {
  return [
    deadlineSection(lang),
    scoringSection(kind, lang),
    unitsSection(lang),
  ];
}
