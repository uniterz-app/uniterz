import type { Language } from "@/lib/i18n/language";

export type PlayoffBracketStrings = {
  rulesTitle: string;
  scoringHeading: string;
  scoringR1: string;
  scoringR2: string;
  scoringCF: string;
  scoringFinals: string;
  scoringGamesBonus: string;
  importantHeading: string;
  importantGamesBonus: string;
  importantWrongWinner: string;
  importantInvalidAdvance: string;
  totalHeading: string;
  totalMax: string;
  afterSubmitHeading: string;
  afterSubmitNoEdit: string;
  rulesConfirmButton: string;
  submitTitle: string;
  submitLine1: string;
  submitLine2: string;
  submitLine3: string;
  alertAlreadySubmitted: string;
  alertSubmittedOk: string;
  alertSubmitFailed: string;
  submitCancel: string;
  submitConfirm: string;
  submitSubmitting: string;
};

const en: PlayoffBracketStrings = {
  rulesTitle: "Playoff bracket rules",
  scoringHeading: "Scoring",
  scoringR1: "• 4 pts for picking the Round 1 winner",
  scoringR2: "• 5 pts for picking the Conference Semifinals winner",
  scoringCF: "• 6 pts for picking the Conference Finals winner",
  scoringFinals: "• 6 pts for picking the NBA Finals winner",
  scoringGamesBonus:
    "• +2 pts if you also nail the exact number of games in the series",
  importantHeading: "Important",
  importantGamesBonus:
    "• The games bonus only counts when your series winner pick is also correct",
  importantWrongWinner: "• Wrong winner = 0 pts for that series",
  importantInvalidAdvance:
    "• If you pick a team that didn’t advance from the previous round, that pick won’t be scored",
  totalHeading: "Total",
  totalMax: "• Maximum score is 100 pts",
  afterSubmitHeading: "After you submit",
  afterSubmitNoEdit: "• You can’t change your bracket after submission",
  rulesConfirmButton: "Got it",
  submitTitle: "Submit bracket",
  submitLine1: "Submit your bracket with these picks.",
  submitLine2: "Each user can submit once.",
  submitLine3: "Your bracket is scored out of 100 points.",
  alertAlreadySubmitted: "You have already submitted a bracket.",
  alertSubmittedOk: "Your bracket has been submitted.",
  alertSubmitFailed: "Submission failed.",
  submitCancel: "Cancel",
  submitConfirm: "Confirm",
  submitSubmitting: "Submitting...",
};

const ja: PlayoffBracketStrings = {
  rulesTitle: "プレーオフブラケットのルール",
  scoringHeading: "採点方法",
  scoringR1: "・1回戦の勝者を当てると 4点",
  scoringR2: "・2回戦の勝者を当てると 5点",
  scoringCF: "・カンファレンス決勝の勝者を当てると 6点",
  scoringFinals: "・NBAファイナルの勝者を当てると 6点",
  scoringGamesBonus: "・試合数までぴったり当てると さらに 2点",
  importantHeading: "重要",
  importantGamesBonus:
    "・試合数のボーナスは、勝者予想も当たっている場合だけ加点されます",
  importantWrongWinner: "・勝者を外したシリーズは 0点です",
  importantInvalidAdvance:
    "・前のラウンドで勝ち上がっていないチームを次のラウンドで選んでいる場合、その予想は採点されません",
  totalHeading: "合計点",
  totalMax: "・満点は 100点 です",
  afterSubmitHeading: "提出後について",
  afterSubmitNoEdit: "・ブラケットは提出後に変更できません",
  rulesConfirmButton: "ルールを確認しました",
  submitTitle: "ブラケットを提出",
  submitLine1: "この内容でブラケットを提出します。",
  submitLine2: "ブラケットの提出は1人1回です。",
  submitLine3: "100点満点で採点されます。",
  alertAlreadySubmitted: "ブラケットはすでに提出済みです",
  alertSubmittedOk: "ブラケットを提出しました",
  alertSubmitFailed: "提出に失敗しました",
  submitCancel: "キャンセル",
  submitConfirm: "確定",
  submitSubmitting: "送信中...",
};

export function getPlayoffBracketStrings(lang: Language): PlayoffBracketStrings {
  return lang === "en" ? en : ja;
}
