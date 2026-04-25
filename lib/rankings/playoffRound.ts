export type PlayoffRoundKey = "overall" | "r1" | "r2" | "cf" | "finals";

export const PLAYOFF_ROUND_KEYS: PlayoffRoundKey[] = [
  "overall",
  "r1",
  "r2",
  "cf",
  "finals",
];

export function isPlayoffRoundKey(v: string | null | undefined): v is PlayoffRoundKey {
  return (
    v === "overall" || v === "r1" || v === "r2" || v === "cf" || v === "finals"
  );
}

