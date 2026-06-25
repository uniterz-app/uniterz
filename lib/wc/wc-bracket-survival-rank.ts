import type { WcBracketPredictMatchId } from "@/lib/wc/wc-knockout-bracket";
import { WC_KNOCKOUT_MATCH_ORDER } from "@/lib/wc/wc-knockout-bracket";

export type WcSurvivalRankInput = {
  alive: boolean;
  survivedRounds: number;
  firstMissMatchId: WcBracketPredictMatchId | null;
};

/** 単一の降順ソートキー（alive → survivedRounds → 脱落が遅い順） */
export function wcSurvivalRankKey(input: WcSurvivalRankInput): number {
  const alivePart = input.alive ? 1_000_000 : 0;
  const rounds = Math.max(0, Math.min(5, input.survivedRounds));
  const roundsPart = rounds * 10_000;
  const missIdx = input.firstMissMatchId
    ? WC_KNOCKOUT_MATCH_ORDER.indexOf(input.firstMissMatchId)
    : WC_KNOCKOUT_MATCH_ORDER.length;
  const missPart = missIdx >= 0 ? missIdx : 0;
  return alivePart + roundsPart + missPart;
}

export function compareWcSurvivalRank(
  a: WcSurvivalRankInput,
  b: WcSurvivalRankInput
): number {
  return wcSurvivalRankKey(b) - wcSurvivalRankKey(a);
}

/** create 直後など survivedRounds=0 だが未脱落のとき */
export function normalizeWcSurvivalFields(
  raw: WcSurvivalRankInput
): WcSurvivalRankInput {
  if (raw.alive && !raw.firstMissMatchId && raw.survivedRounds === 0) {
    return { ...raw, survivedRounds: 5 };
  }
  return raw;
}
