/* playoffBracketTypes.ts */

/*
NBA Playoff Bracket series IDs
*/

export type SeriesId =
  | "R1_E1"
  | "R1_E2"
  | "R1_E3"
  | "R1_E4"
  | "R1_W1"
  | "R1_W2"
  | "R1_W3"
  | "R1_W4"
  | "R2_E1"
  | "R2_E2"
  | "R2_W1"
  | "R2_W2"
  | "CF_E"
  | "CF_W"
  | "FINALS";

export const ALL_SERIES_IDS: SeriesId[] = [
  "R1_E1",
  "R1_E2",
  "R1_E3",
  "R1_E4",
  "R1_W1",
  "R1_W2",
  "R1_W3",
  "R1_W4",
  "R2_E1",
  "R2_E2",
  "R2_W1",
  "R2_W2",
  "CF_E",
  "CF_W",
  "FINALS",
];