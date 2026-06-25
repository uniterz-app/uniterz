import type { WcBracketPredictMatchId } from "@/lib/wc/wc-knockout-bracket";
import { getWcKnockoutMatch } from "@/lib/wc/wc-knockout-bracket";

/** 次ラウンド試合が、現ラウンドリストのどの2試合から供給されるか（0-based） */
export function getWcNextMatchFeederIndices(
  nextMatchId: WcBracketPredictMatchId,
  currentMatchIds: readonly WcBracketPredictMatchId[]
): [number, number] | null {
  const def = getWcKnockoutMatch(nextMatchId);
  if (!def || def.feedsFrom.length !== 2) return null;

  const ia = currentMatchIds.indexOf(
    def.feedsFrom[0] as WcBracketPredictMatchId
  );
  const ib = currentMatchIds.indexOf(
    def.feedsFrom[1] as WcBracketPredictMatchId
  );
  if (ia < 0 || ib < 0) return null;
  return ia < ib ? [ia, ib] : [ib, ia];
}

export function wcBracketMidpointY(
  topEl: HTMLElement,
  bottomEl: HTMLElement,
  containerTop: number
): number {
  const topCenter =
    topEl.getBoundingClientRect().top +
    topEl.getBoundingClientRect().height / 2;
  const bottomCenter =
    bottomEl.getBoundingClientRect().top +
    bottomEl.getBoundingClientRect().height / 2;
  return (topCenter + bottomCenter) / 2 - containerTop;
}
