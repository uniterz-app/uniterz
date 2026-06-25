import type {
  WcBracketPredictMatchId,
  WcBracketState,
} from "@/lib/wc/wc-knockout-bracket";
import { pruneWcBracket } from "@/lib/wc/wc-knockout-bracket-utils";

/** 同じチームを再タップしたら選択解除 */
export function toggleWcBracketPick(
  bracket: WcBracketState,
  matchId: WcBracketPredictMatchId,
  teamId: string
): WcBracketState {
  const current = bracket[matchId]?.winner?.trim();
  if (current === teamId) {
    const next = { ...bracket };
    delete next[matchId];
    return pruneWcBracket(next);
  }
  return pruneWcBracket({
    ...bracket,
    [matchId]: { winner: teamId },
  });
}
