/** PRO バッジブリッジ — 5 個以上で横スクロール（5 個は軽いスライド） */
export const PRO_BRIDGE_SCROLL_THRESHOLD = 5;
/** 6 個以上はフル幅スライド */
export const PRO_BRIDGE_FULL_SCROLL_THRESHOLD = 6;

export type ProBridgeBadgeLayout =
  | "one"
  | "two"
  | "three"
  | "four"
  | "scroll";

export function resolveProBridgeBadgeLayout(count: number): ProBridgeBadgeLayout {
  if (count <= 1) return "one";
  if (count === 2) return "two";
  if (count === 3) return "three";
  if (count === 4) return "four";
  return "scroll";
}

export function shouldProBridgeBadgeScroll(count: number): boolean {
  return count >= PRO_BRIDGE_SCROLL_THRESHOLD;
}

/** 5 個ちょうど — 端が少し見切れて軽くスライド */
export function shouldProBridgeBadgeNudgeScroll(count: number): boolean {
  return count === PRO_BRIDGE_SCROLL_THRESHOLD;
}

export function shouldProBridgeBadgeFullScroll(count: number): boolean {
  return count >= PRO_BRIDGE_FULL_SCROLL_THRESHOLD;
}

/** PRO バッジ入場 — 左から順に 1 回だけ */
export const PRO_BRIDGE_BADGE_ENTER_STAGGER_MS = 100;
export const PRO_BRIDGE_BADGE_ENTER_DURATION_MS = 580;

export function proBridgeBadgeEnterDelayMs(index: number): number {
  return index * PRO_BRIDGE_BADGE_ENTER_STAGGER_MS;
}

export function proBridgeBadgeFloatDelayMs(index: number): number {
  return proBridgeBadgeEnterDelayMs(index) + PRO_BRIDGE_BADGE_ENTER_DURATION_MS;
}
