/**
 * トレードバレット — 採点・ルールモーダル用コピー（ja / en）。
 */
import { TRADE_BALLOT_SCHEDULE_COPY_JA } from "@/lib/predict/nbaTradeBallotDeadline";
import { TRADE_BALLOT_SCORE } from "@/lib/predict/nbaTradeBallotScoring";
import {
  TRADE_BALLOT_PARTICIPATION_UNITS,
  TRADE_BALLOT_RANK_UNITS_POOL,
  TRADE_BALLOT_UNIT_MAX_RANK,
  tradeBallotPrizeBands,
} from "@/lib/units/tradeBallotUnitRewards";

export type TradeBallotRulesLang = "ja" | "en";

export type TradeBallotRulesSection = {
  title: string;
  body: string;
};

function prizeTableLines(lang: TradeBallotRulesLang): string {
  return tradeBallotPrizeBands()
    .map((b) =>
      lang === "ja" ? `${b.labelJa}: ${b.valueJa}` : `${b.labelEn}: ${b.valueEn}`
    )
    .join("\n");
}

export function tradeBallotRulesSections(
  lang: TradeBallotRulesLang = "ja"
): TradeBallotRulesSection[] {
  if (lang === "en") {
    return [
      {
        title: "How to play",
        body: "Pick 7 players you think will be traded by the deadline, each with a destination team. Open Dec 15 · close 3 days before TDL.",
      },
      {
        title: "Scoring (700 max)",
        body: `Player traded: +${TRADE_BALLOT_SCORE.playerHit}\nCorrect destination: +${TRADE_BALLOT_SCORE.teamHitBonus}\nRarity (vote share at close): +0 / +5 / +10 / +20 / +30 (50%+ → +0)\nMissed player: 0 for that slot. Total = sum of 7 slots.`,
      },
      {
        title: "Editing",
        body: "If a picked player is traded after you submit, that slot locks as a hit. Other slots stay editable until the close.",
      },
      {
        title: "Prizes",
        body: `${prizeTableLines("en")}\nRank prizes go to top ${TRADE_BALLOT_UNIT_MAX_RANK}. Participation is ${TRADE_BALLOT_PARTICIPATION_UNITS} Units for every complete ballot at close. Rank Unit pool (excl. participation): ${TRADE_BALLOT_RANK_UNITS_POOL}. Free to enter.`,
      },
    ];
  }

  return [
    {
      title: "遊び方",
      body: `移籍しそうな選手を 7 人選び、それぞれ移籍先チームも指定して提出します。\n受付: ${TRADE_BALLOT_SCHEDULE_COPY_JA.open}\n締切: ${TRADE_BALLOT_SCHEDULE_COPY_JA.close}`,
    },
    {
      title: "採点（700点満点）",
      body: `選手が移籍: +${TRADE_BALLOT_SCORE.playerHit}\n行き先も当たり: +${TRADE_BALLOT_SCORE.teamHitBonus}\n少数派ボーナス（締切時点の投票率）:\n  50%以上 +0 / 25–50% +5 / 10–25% +10 / 3–10% +20 / 3%未満 +30\n選手が外れた枠は 0 点。7 枠の合計が総合点です。`,
    },
    {
      title: "途中の編集",
      body: TRADE_BALLOT_SCHEDULE_COPY_JA.lockRule,
    },
    {
      title: "報酬",
      body: `${prizeTableLines("ja")}\n順位賞は上位 ${TRADE_BALLOT_UNIT_MAX_RANK} 位まで。参加賞は締切時点で 7 枠提出済みの全員に ${TRADE_BALLOT_PARTICIPATION_UNITS} Unit。順位 Unit 合計（参加賞除く）: ${TRADE_BALLOT_RANK_UNITS_POOL}。参加無料。結果発表後に付与。`,
    },
    {
      title: "同点",
      body: "総合点 → チーム当て数 → 選手当て数 → 最終提出が早い順。",
    },
  ];
}
