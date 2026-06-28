/**
 * Keep in sync with lib/wc/wc-knockout-bracket.ts (feedsFrom / rounds).
 */

import type { WcBracketPredictMatchId } from "./wcKnockoutMatchIds";
import { isWcBracketPredictMatchId } from "./wcKnockoutMatchIds";

export type WcKnockoutMatchId = WcBracketPredictMatchId | "M103";

export type WcKnockoutRound = "R16" | "QF" | "SF" | "FINAL" | "THIRD";

type KnockoutMatchDef = {
  id: WcKnockoutMatchId;
  round: WcKnockoutRound;
  feedsFrom: readonly [WcKnockoutMatchId, WcKnockoutMatchId];
  /** M103 のみ — 親試合の敗者を home/away に使う */
  useRunnerUpFeeders?: boolean;
};

/** R16 以降（R32 は Phase 1 seed）。M103 は 3 位決定戦。 */
export const WC_KNOCKOUT_CHILD_MATCHES: readonly KnockoutMatchDef[] = [
  { id: "M89", round: "R16", feedsFrom: ["M74", "M77"] },
  { id: "M90", round: "R16", feedsFrom: ["M73", "M75"] },
  { id: "M91", round: "R16", feedsFrom: ["M76", "M78"] },
  { id: "M92", round: "R16", feedsFrom: ["M79", "M80"] },
  { id: "M93", round: "R16", feedsFrom: ["M83", "M84"] },
  { id: "M94", round: "R16", feedsFrom: ["M81", "M82"] },
  { id: "M95", round: "R16", feedsFrom: ["M86", "M88"] },
  { id: "M96", round: "R16", feedsFrom: ["M85", "M87"] },
  { id: "M97", round: "QF", feedsFrom: ["M89", "M90"] },
  { id: "M98", round: "QF", feedsFrom: ["M93", "M94"] },
  { id: "M99", round: "QF", feedsFrom: ["M91", "M92"] },
  { id: "M100", round: "QF", feedsFrom: ["M95", "M96"] },
  { id: "M101", round: "SF", feedsFrom: ["M97", "M98"] },
  { id: "M102", round: "SF", feedsFrom: ["M99", "M100"] },
  {
    id: "M103",
    round: "THIRD",
    feedsFrom: ["M101", "M102"],
    useRunnerUpFeeders: true,
  },
  { id: "M104", round: "FINAL", feedsFrom: ["M101", "M102"] },
];

const MATCH_BY_ID = new Map(
  WC_KNOCKOUT_CHILD_MATCHES.map((m) => [m.id, m] as const)
);

const CHILDREN_BY_PARENT = new Map<string, WcKnockoutMatchId[]>();
for (const m of WC_KNOCKOUT_CHILD_MATCHES) {
  for (const parent of m.feedsFrom) {
    const list = CHILDREN_BY_PARENT.get(parent) ?? [];
    list.push(m.id);
    CHILDREN_BY_PARENT.set(parent, list);
  }
}

export function getWcKnockoutChildMatches(
  parentId: string
): WcKnockoutMatchId[] {
  return [...(CHILDREN_BY_PARENT.get(parentId) ?? [])];
}

export function getWcKnockoutChildMatchDef(
  id: WcKnockoutMatchId
): KnockoutMatchDef | undefined {
  return MATCH_BY_ID.get(id);
}

export function wcKnockoutRoundLabel(round: WcKnockoutRound): string {
  switch (round) {
    case "R16":
      return "Round of 16";
    case "QF":
      return "Quarter-final";
    case "SF":
      return "Semi-final";
    case "FINAL":
      return "Final";
    case "THIRD":
      return "Third Place";
    default:
      return round;
  }
}

export function wcKnockoutGameId(
  matchId: WcKnockoutMatchId,
  tournamentYear = 2026
): string {
  return `wc-${tournamentYear}-ko-${matchId}`;
}

export function parseWcKnockoutMatchIdFromGameId(
  gameId: string
): WcKnockoutMatchId | null {
  const m = gameId.match(/(?:^|[-_])ko[-_](M\d{2,3})$/i);
  if (!m) return null;
  const id = m[1].toUpperCase();
  if (id === "M103") return "M103";
  if (isWcBracketPredictMatchId(id)) return id;
  return null;
}
