/**
 * シーズン予想ルールモーダル用コピー（順位 / アワード）。
 * 採点・Unit 表の正は scoring / unitRewards 定数。
 */
import {
  SEASON_PREDICT_SUBMIT_DEADLINE_LABEL_EN,
  SEASON_PREDICT_SUBMIT_DEADLINE_LABEL_JA,
} from "@/lib/predict/seasonPredictDeadline";
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

function unitTableLines(lang: SeasonPredictRulesLang): string[] {
  const lines: string[] = [];
  for (let i = 0; i < SEASON_PREDICT_UNITS_BY_RANK.length; i += 1) {
    const rank = i + 1;
    const units = SEASON_PREDICT_UNITS_BY_RANK[i]!;
    lines.push(
      lang === "ja"
        ? `${rank}位 … ${units} Unit`
        : `#${rank} … ${units} Units`
    );
  }
  return lines;
}

export function seasonPredictRulesSections(
  kind: SeasonPredictRulesKind,
  lang: SeasonPredictRulesLang
): readonly SeasonPredictRulesSection[] {
  const ja = lang === "ja";
  const unitLines = unitTableLines(lang);

  if (kind === "standings") {
    const s = SEASON_STANDINGS_SCORE;
    return [
      {
        title: ja ? "遊び方" : "How to play",
        bullets: ja
          ? [
              "East / West それぞれ 1〜15 位にチームを配置します。",
              "同じカンファレンス内で、同じチームは一度だけ使えます。",
              "帯の目安: 1–6 ストレートイン / 7–10 プレーイン / 11–15 圏外。",
              `提出期限: ${SEASON_PREDICT_SUBMIT_DEADLINE_LABEL_JA}まで。以降はロックされます。`,
            ]
          : [
              "Place every East / West team from 1st to 15th.",
              "Each team may appear only once per conference.",
              "Bands: 1–6 straight in / 7–10 play-in / 11–15 out.",
              `Deadline: ${SEASON_PREDICT_SUBMIT_DEADLINE_LABEL_EN}. Locked after that.`,
            ],
      },
      {
        title: ja ? "採点" : "Scoring",
        bullets: ja
          ? [
              "シーズン終了後、公式最終順位と照合します。",
              `完全一致 +${s.exact} / 差±1 +${s.within1} / 差±2 +${s.within2} / それ以外 0。`,
              `カンファレンスあたり最大 ${s.maxPerConference}、合計最大 ${s.maxTotal}。`,
              "未提出・未完成はランキングに掲載しません。",
            ]
          : [
              "After the season, we compare your board to the official standings.",
              `Exact +${s.exact} / ±1 +${s.within1} / ±2 +${s.within2} / else 0.`,
              `Max ${s.maxPerConference} per conference, ${s.maxTotal} total.`,
              "Incomplete or missing submissions are not ranked.",
            ],
      },
      {
        title: ja ? "Unit" : "Units",
        bullets: ja
          ? [
              "順位予想だけのポイントランキングです（アワード予想とは別）。",
              `上位 ${SEASON_PREDICT_UNIT_MAX_RANK} 人に Unit を付与します。Free / Pro で差はありません。`,
              ...unitLines,
            ]
          : [
              "Standings predictions have their own points leaderboard (separate from awards).",
              `Top ${SEASON_PREDICT_UNIT_MAX_RANK} earn Units. Free and Pro use the same table.`,
              ...unitLines,
            ],
      },
    ];
  }

  const a = SEASON_AWARDS_SCORE;
  const awardCount = SEASON_AWARDS_COUNT;
  return [
    {
      title: ja ? "遊び方" : "How to play",
      bullets: ja
        ? [
            `MVP・DPOY など主要アワード ${awardCount} 種を予想します。`,
            "空欄フォーカス時は他ユーザーの人気ピック、入力時は名前の前方一致で候補が出ます。",
            `提出期限: ${SEASON_PREDICT_SUBMIT_DEADLINE_LABEL_JA}まで。以降はロックされます。`,
          ]
        : [
            `Pick winners for ${awardCount} major awards (MVP, DPOY, and more).`,
            "Empty focus shows popular picks; typing filters by name prefix.",
            `Deadline: ${SEASON_PREDICT_SUBMIT_DEADLINE_LABEL_EN}. Locked after that.`,
          ],
    },
    {
      title: ja ? "採点" : "Scoring",
      bullets: ja
        ? [
            "シーズン終了後、公式受賞者と照合します。",
            `的中 +${a.exact} / 外れ 0（アワードごと）。合計最大 ${a.maxTotal}。`,
            "未提出・未完成はランキングに掲載しません。",
          ]
        : [
            "After the season, we compare your picks to the official winners.",
            `Hit +${a.exact} / miss 0 per award. Max ${a.maxTotal} total.`,
            "Incomplete or missing submissions are not ranked.",
          ],
    },
    {
      title: ja ? "Unit" : "Units",
      bullets: ja
        ? [
            "アワード予想だけのポイントランキングです（順位予想とは別）。",
            `上位 ${SEASON_PREDICT_UNIT_MAX_RANK} 人に Unit を付与します。Free / Pro で差はありません。`,
            ...unitLines,
          ]
        : [
            "Award predictions have their own points leaderboard (separate from standings).",
            `Top ${SEASON_PREDICT_UNIT_MAX_RANK} earn Units. Free and Pro use the same table.`,
            ...unitLines,
          ],
    },
  ];
}

export function seasonPredictRulesFootNote(lang: SeasonPredictRulesLang): string {
  return lang === "ja"
    ? "Unit の付与はシーズン終了・採点確定後です。同点で同順位の場合は同額です。"
    : "Units are granted after the season is scored. Tied ranks receive the same amount.";
}
