import type { WcBracketPredictMatchId } from "@/lib/wc/wc-knockout-bracket";
import { getWcKnockoutMatch } from "@/lib/wc/wc-knockout-bracket";
import {
  WC_BRACKET_INPUT_PHASES,
  type WcBracketInputPhase,
  wcBracketPhaseIndex,
} from "@/lib/wc/wc-bracket-input-phases";

/** ラウンド入力 — カード列とタブで共通の横パディング */
export const WC_BRACKET_INPUT_HPAD = "px-2";

/** 2列 split の列間 gap（px）— Tailwind gap-2 と一致 */
export const WC_BRACKET_INPUT_COL_GAP_PX = 8;

/** 2列 split（現ラウンド + 次ラウンド）の列間 gap（Tailwind gap-2） */
export const WC_BRACKET_INPUT_COL_GAP_CLASS = "gap-2";

export const WC_BRACKET_INPUT_MAX_MATCH_COUNT = 16;

/** R32 最大列の幅スケール（旧 2/3 → 約 52% 相当） */
export const WC_BRACKET_INPUT_COL_WIDTH_FACTOR = 0.78;

/** R32 活動列 — 上記よりほんの少し狭く */
export const WC_BRACKET_INPUT_R32_COL_WIDTH_FACTOR = 0.75;

function wcBracketInputPhaseWidthFactor(
  phase: WcBracketInputPhase
): number {
  return phase === "R32"
    ? WC_BRACKET_INPUT_R32_COL_WIDTH_FACTOR
    : WC_BRACKET_INPUT_COL_WIDTH_FACTOR;
}

export function wcBracketInputPhaseMatchCount(
  phase: WcBracketInputPhase
): number {
  return (
    WC_BRACKET_INPUT_PHASES.find((p) => p.id === phase)?.matchIds.length ?? 1
  );
}

/** R32 と同じカード列幅（全ラウンド共通） */
export function wcBracketInputR32CardColWidthCss(): string {
  return `calc((100% - 0.5rem) * 2 / 3 * ${WC_BRACKET_INPUT_R32_COL_WIDTH_FACTOR})`;
}

/** ラウンドカード列の幅（R32 と同一サイズ） */
export function wcBracketInputColWidthCss(
  _phase: WcBracketInputPhase
): string {
  return wcBracketInputR32CardColWidthCss();
}

/** 決勝 — タブ用（viewport 基準） */
export function wcBracketInputFinalTabWidthCss(): string {
  return "calc((100vw - 1rem) / 3)";
}

/** 決勝 — カード列用（R32 と同じ幅） */
export function wcBracketInputFinalColWidthCss(): string {
  return wcBracketInputR32CardColWidthCss();
}

/** ラウンドタブの幅（カード列と同じ比率） */
export function wcBracketInputTabWidthCss(phase: WcBracketInputPhase): string {
  if (phase === "FINAL") {
    return wcBracketInputFinalTabWidthCss();
  }
  const n = wcBracketInputPhaseMatchCount(phase);
  const factor = wcBracketInputPhaseWidthFactor(phase);
  return `calc((100vw - 1rem) * ${n} / ${WC_BRACKET_INPUT_MAX_MATCH_COUNT} * 2 / 3 * ${factor})`;
}

/** ラウンドカード領域の外側ラッパー（split ラウンド用） */
export function wcBracketInputSplitCardsOuterClass(): string {
  return `flex min-w-0 items-start overflow-x-hidden ${WC_BRACKET_INPUT_COL_GAP_CLASS} ${WC_BRACKET_INPUT_HPAD}`;
}

export function wcBracketInputNextPhase(
  phase: WcBracketInputPhase
): WcBracketInputPhase | undefined {
  const idx = wcBracketPhaseIndex(phase);
  return WC_BRACKET_INPUT_PHASES[idx + 1]?.id;
}

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
