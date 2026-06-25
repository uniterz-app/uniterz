/** Keep in sync with lib/wc/wc-knockout-bracket.ts WC_BRACKET_PREDICT_MATCH_IDS */

export type WcBracketPredictMatchId =
  | "M73"
  | "M74"
  | "M75"
  | "M76"
  | "M77"
  | "M78"
  | "M79"
  | "M80"
  | "M81"
  | "M82"
  | "M83"
  | "M84"
  | "M85"
  | "M86"
  | "M87"
  | "M88"
  | "M89"
  | "M90"
  | "M91"
  | "M92"
  | "M93"
  | "M94"
  | "M95"
  | "M96"
  | "M97"
  | "M98"
  | "M99"
  | "M100"
  | "M101"
  | "M102"
  | "M104";

export const WC_BRACKET_PREDICT_MATCH_IDS: readonly WcBracketPredictMatchId[] = [
  "M73",
  "M74",
  "M75",
  "M76",
  "M77",
  "M78",
  "M79",
  "M80",
  "M81",
  "M82",
  "M83",
  "M84",
  "M85",
  "M86",
  "M87",
  "M88",
  "M89",
  "M90",
  "M91",
  "M92",
  "M93",
  "M94",
  "M95",
  "M96",
  "M97",
  "M98",
  "M99",
  "M100",
  "M101",
  "M102",
  "M104",
];

export const WC_KNOCKOUT_BRACKET_SEASON = "2025-26";

export function isWcBracketPredictMatchId(
  id: string
): id is WcBracketPredictMatchId {
  return (WC_BRACKET_PREDICT_MATCH_IDS as readonly string[]).includes(id);
}
