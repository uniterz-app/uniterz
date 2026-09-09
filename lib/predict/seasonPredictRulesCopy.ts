/**
 * シーズン予想ルールモーダル用コピー（順位 / アワード）。
 * 締切・採点・獲得 UNIT のみ。採点・Unit 表の正は scoring / unitRewards 定数。
 */
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
export type SeasonPredictRulesLang = "ja" | "en";

export type SeasonPredictRulesSection = {
  title: string;
  bullets: readonly string[];
};

function unitEarnLines(lang: SeasonPredictRulesLang): string[] {
  const chunks: string[] = [];
  for (let i = 0; i < SEASON_PREDICT_UNITS_BY_RANK.length; i += 5) {
    const slice = SEASON_PREDICT_UNITS_BY_RANK.slice(i, i + 5);
    const from = i + 1;
    const to = i + slice.length;
    const amounts = slice.join(" / ");
    chunks.push(
      lang === "ja"
        ? `${from}–${to}位  ${amounts}`
        : `#${from}–#${to}  ${amounts}`
    );
  }
  return [
    lang === "ja"
      ? `上位 ${SEASON_PREDICT_UNIT_MAX_RANK} 人`
      : `Top ${SEASON_PREDICT_UNIT_MAX_RANK}`,
    ...chunks,
  ];
}

function deadlineSection(
  lang: SeasonPredictRulesLang
): SeasonPredictRulesSection {
  const ja = lang === "ja";
  return {
    title: ja ? "締切" : "Deadline",
    bullets: ja
      ? [`${SEASON_PREDICT_SUBMIT_DEADLINE_WHEN} まで`]
      : [`Until ${SEASON_PREDICT_SUBMIT_DEADLINE_WHEN}`],
  };
}

function scoringSection(
  kind: SeasonPredictRulesKind,
  lang: SeasonPredictRulesLang
): SeasonPredictRulesSection {
  const ja = lang === "ja";
  if (kind === "standings") {
    const s = SEASON_STANDINGS_SCORE;
    return {
      title: ja ? "採点" : "Scoring",
      bullets: ja
        ? [
            `公式最終順位との差。一致 +${s.exact} / ±1 +${s.within1} / ±2 +${s.within2} / それ以外 0。`,
          ]
        : [
            `Vs official standings: exact +${s.exact} / ±1 +${s.within1} / ±2 +${s.within2} / else 0.`,
          ],
    };
  }
  const a = SEASON_AWARDS_SCORE;
  return {
    title: ja ? "採点" : "Scoring",
    bullets: ja
      ? [
          `公式受賞者と一致で +${a.exact}、外れ 0（${SEASON_AWARDS_COUNT} 種）。`,
        ]
      : [
          `Vs official winners: hit +${a.exact} / miss 0 (${SEASON_AWARDS_COUNT} awards).`,
        ],
  };
}

function unitsSection(lang: SeasonPredictRulesLang): SeasonPredictRulesSection {
  const ja = lang === "ja";
  return {
    title: ja ? "獲得 UNIT" : "Units",
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
