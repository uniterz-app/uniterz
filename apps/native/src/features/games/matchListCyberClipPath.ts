/** Web `match-list-cyber-card` の角切り（モバイル dense = 10px） */
export const MATCH_LIST_CYBER_CUT_DENSE = 10;
export const MATCH_LIST_CYBER_CUT_STAT_BOX = 7;
/** Web `.predict-overlay-market-frame`（globals.css 8px） */
export const MATCH_LIST_CYBER_CUT_MARKET_BAR = 8;
/** Web `.predict-overlay-goal-box`（globals.css 5px） */
export const PREDICT_OVERLAY_GOAL_BOX_CUT = 5;
/** Web `.predict-overlay-cyber-card`（globals.css） */
export const PREDICT_OVERLAY_CYBER_CUT = 12;
/** Web `.predict-overlay-cyber-deck`（globals.css） */
export const PREDICT_OVERLAY_CYBER_DECK_CUT = 8;
/** Web `.predict-overlay-cyber-form`（globals.css） */
export const PREDICT_OVERLAY_CYBER_FORM_CUT = 10;
/** Web `.predict-overlay-score-input`（globals.css） */
export const PREDICT_OVERLAY_SCORE_INPUT_CUT = 6;
/** Web `.predict-overlay-submit-btn`（globals.css） */
export const PREDICT_OVERLAY_SUBMIT_BTN_CUT = 8;
/** Web `.predict-overlay-close-btn`（globals.css） */
export const PREDICT_OVERLAY_CLOSE_BTN_CUT = 5;

/** octagon 外側の4隅三角（矩形はみ出しマスク用・TL/TR/BR/BL） */
export function chamferedCornerRevealPathsD(
  width: number,
  height: number,
  cut: number,
  /** 枠線との隙間を防ぐ外側オーバーラップ px */
  overlap = 1
): readonly [string, string, string, string] {
  const w = Math.max(0, width);
  const h = Math.max(0, height);
  const c = Math.min(cut, w / 2, h / 2);
  const o = Math.max(0, overlap);
  if (c <= 0 || w <= 0 || h <= 0) {
    return ["", "", "", ""];
  }
  return [
    `M ${-o} ${-o} L ${c + o} ${-o} L ${-o} ${c + o} Z`,
    `M ${w + o} ${-o} L ${w + o} ${c + o} L ${w - c - o} ${-o} Z`,
    `M ${w + o} ${h + o} L ${w - c - o} ${h + o} L ${w + o} ${h - c - o} Z`,
    `M ${-o} ${h + o} L ${-o} ${h - c - o} L ${c + o} ${h + o} Z`,
  ];
}

/** Skia / SVG 用の閉じたパス（左上から時計回り） */
export function chamferedRectPathD(width: number, height: number, cut: number): string {
  const w = Math.max(0, width);
  const h = Math.max(0, height);
  const c = Math.min(cut, w / 2, h / 2);
  if (c <= 0 || w <= 0 || h <= 0) return "";
  return [
    `M ${c} 0`,
    `L ${w - c} 0`,
    `L ${w} ${c}`,
    `L ${w} ${h - c}`,
    `L ${w - c} ${h}`,
    `L ${c} ${h}`,
    `L 0 ${h - c}`,
    `L 0 ${c}`,
    "Z",
  ].join(" ");
}

/** 枠走査光用 — 内側へ inset px した全角 chamfer */
export function insetChamferedRectPathD(
  width: number,
  height: number,
  cut: number,
  inset: number
): string {
  const w = Math.max(0, width);
  const h = Math.max(0, height);
  const p = Math.max(0, inset);
  if (w <= p * 2 || h <= p * 2) return "";
  const iw = w - p * 2;
  const ih = h - p * 2;
  const ic = Math.max(0, cut - p);
  const c = Math.min(ic, iw / 2, ih / 2);
  if (c <= 0) return "";
  return [
    `M ${p + c} ${p}`,
    `L ${p + iw - c} ${p}`,
    `L ${p + iw} ${p + c}`,
    `L ${p + iw} ${p + ih - c}`,
    `L ${p + iw - c} ${p + ih}`,
    `L ${p + c} ${p + ih}`,
    `L ${p} ${p + ih - c}`,
    `L ${p} ${p + c}`,
    "Z",
  ].join(" ");
}

/** Web `.predict-overlay-close-btn` — 左上・右下のみ角切り */
export function predictOverlayCloseBtnPathD(
  width: number,
  height: number,
  cut: number
): string {
  const w = Math.max(0, width);
  const h = Math.max(0, height);
  const c = Math.min(cut, w / 2, h / 2);
  if (c <= 0 || w <= 0 || h <= 0) return "";
  return [
    `M ${c} 0`,
    `L ${w} 0`,
    `L ${w} ${h - c}`,
    `L ${w - c} ${h}`,
    `L 0 ${h}`,
    `L 0 ${c}`,
    "Z",
  ].join(" ");
}

export type PredictOverlayDeckTabEdge = "first" | "middle" | "last" | "only";

/** 予想オーバーレイ・タブ deck 内の active 塗り（外枠の角切りを守る） */
export function predictOverlayDeckTabActivePathD(
  width: number,
  height: number,
  cut: number,
  edge: PredictOverlayDeckTabEdge
): string {
  const w = Math.max(0, width);
  const h = Math.max(0, height);
  const c = Math.min(cut, w / 2, h / 2);
  if (w <= 0 || h <= 0) return "";
  if (edge === "only") return chamferedRectPathD(w, h, cut);
  if (edge === "middle") {
    return [`M 0 0`, `L ${w} 0`, `L ${w} ${h}`, `L 0 ${h}`, "Z"].join(" ");
  }
  if (edge === "first") {
    if (c <= 0) return [`M 0 0`, `L ${w} 0`, `L ${w} ${h}`, `L 0 ${h}`, "Z"].join(" ");
    return [
      `M ${c} 0`,
      `L ${w} 0`,
      `L ${w} ${h}`,
      `L ${c} ${h}`,
      `L 0 ${h - c}`,
      `L 0 ${c}`,
      "Z",
    ].join(" ");
  }
  if (c <= 0) return [`M 0 0`, `L ${w} 0`, `L ${w} ${h}`, `L 0 ${h}`, "Z"].join(" ");
  return [
    `M 0 0`,
    `L ${w - c} 0`,
    `L ${w} ${c}`,
    `L ${w} ${h - c}`,
    `L ${w - c} ${h}`,
    `L 0 ${h}`,
    "Z",
  ].join(" ");
}
