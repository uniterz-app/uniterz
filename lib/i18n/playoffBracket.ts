import type { Language } from "@/lib/i18n/language";
import { t } from "@/lib/i18n/t";

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
  alertLoginRequired: string;
  alertAlreadySubmitted: string;
  alertSubmittedOk: string;
  alertSubmitFailed: string;
  submitCancel: string;
  submitConfirm: string;
  submitSubmitting: string;
  submitLockedSeedingShort: string;
  submitBracketClosedShort: string;
  submitBracketCta: string;
  alertSubmissionLockedBySeeding: string;
  alertSubmissionClosedByDeadline: string;
  bannerSubmissionClosedByDeadline: string;
};

export function getPlayoffBracketStrings(lang: Language): PlayoffBracketStrings {
  return t(lang).playoffBracket;
}
