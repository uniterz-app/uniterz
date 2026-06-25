import type { WcBracketPredictMatchId } from "@/lib/wc/wc-knockout-bracket";
import {
  listWcR32MatchesForDisplay,
  type WcBracketState,
} from "@/lib/wc/wc-knockout-bracket";
import {
  WC_BRACKET_LEFT_QF,
  WC_BRACKET_LEFT_R16,
  WC_BRACKET_RIGHT_QF,
  WC_BRACKET_RIGHT_R16,
} from "@/lib/wc/wc-bracket-layout";

export type WcBracketInputPhase = "R32" | "R16" | "QF" | "SF" | "FINAL";

export type WcBracketInputPhaseDef = {
  id: WcBracketInputPhase;
  matchIds: readonly WcBracketPredictMatchId[];
  labelJa: string;
  labelEn: string;
  /** Apple Sports 風タブ表示 */
  tabLabel: string;
  /** このラウンド開始時の残りチーム数 */
  teamsInRound: number;
};

const R32_LEFT = listWcR32MatchesForDisplay("left").map(
  (m) => m.id as WcBracketPredictMatchId
);
const R32_RIGHT = listWcR32MatchesForDisplay("right").map(
  (m) => m.id as WcBracketPredictMatchId
);

export const WC_BRACKET_INPUT_PHASES: readonly WcBracketInputPhaseDef[] = [
  {
    id: "R32",
    matchIds: [...R32_LEFT, ...R32_RIGHT],
    labelJa: "ベスト32",
    labelEn: "Round of 32",
    tabLabel: "R32",
    teamsInRound: 32,
  },
  {
    id: "R16",
    matchIds: [...WC_BRACKET_LEFT_R16, ...WC_BRACKET_RIGHT_R16],
    labelJa: "ベスト16",
    labelEn: "Round of 16",
    tabLabel: "R16",
    teamsInRound: 16,
  },
  {
    id: "QF",
    matchIds: [...WC_BRACKET_LEFT_QF, ...WC_BRACKET_RIGHT_QF],
    labelJa: "ベスト8",
    labelEn: "Quarter-finals",
    tabLabel: "QF",
    teamsInRound: 8,
  },
  {
    id: "SF",
    matchIds: ["M101", "M102"],
    labelJa: "ベスト4",
    labelEn: "Semi-finals",
    tabLabel: "SF",
    teamsInRound: 4,
  },
  {
    id: "FINAL",
    matchIds: ["M104"],
    labelJa: "決勝",
    labelEn: "Final",
    tabLabel: "F",
    teamsInRound: 2,
  },
] as const;

export function isWcBracketPhaseComplete(
  phase: WcBracketInputPhase,
  bracket: WcBracketState
): boolean {
  const def = WC_BRACKET_INPUT_PHASES.find((p) => p.id === phase);
  if (!def) return false;
  return def.matchIds.every((id) => Boolean(bracket[id]?.winner?.trim()));
}

export function firstIncompleteWcBracketPhase(
  bracket: WcBracketState
): WcBracketInputPhase {
  for (const phase of WC_BRACKET_INPUT_PHASES) {
    if (!isWcBracketPhaseComplete(phase.id, bracket)) {
      return phase.id;
    }
  }
  return "FINAL";
}

export function wcBracketPhaseIndex(phase: WcBracketInputPhase): number {
  return WC_BRACKET_INPUT_PHASES.findIndex((p) => p.id === phase);
}

export function canOpenWcBracketPhase(
  phase: WcBracketInputPhase,
  bracket: WcBracketState
): boolean {
  const idx = wcBracketPhaseIndex(phase);
  if (idx <= 0) return true;
  for (let i = 0; i < idx; i++) {
    const prev = WC_BRACKET_INPUT_PHASES[i];
    if (prev && !isWcBracketPhaseComplete(prev.id, bracket)) return false;
  }
  return true;
}
