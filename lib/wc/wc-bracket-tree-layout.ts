/** トーナメント表専用レイアウト（国旗基準・左右対称） */
export const WC_TREE_DESIGN_W = 520;
export const WC_TREE_DESIGN_H = 400;

export const WC_TREE_FLAG_W = 32;
export const WC_TREE_FLAG_H = 24;
export const WC_TREE_FLAG_GAP = 2;

/** 1 試合 = 上下 2 国旗 */
export const WC_TREE_SLOT_W = WC_TREE_FLAG_W;
export const WC_TREE_SLOT_H = WC_TREE_FLAG_H * 2 + WC_TREE_FLAG_GAP;

const MARGIN = 4;
const COL_GAP = 30;

const leftR32 = MARGIN;
const leftR16 = leftR32 + WC_TREE_SLOT_W + COL_GAP;
const leftQF = leftR16 + WC_TREE_SLOT_W + COL_GAP;
const leftSF = leftQF + WC_TREE_SLOT_W + COL_GAP;

function mirrorRightAnchor(leftAnchor: number): number {
  return WC_TREE_DESIGN_W - MARGIN - (leftAnchor - MARGIN);
}

const R32_SPAN = 42;
const R32_START = 30;

export const WC_TREE_COL = {
  leftR32,
  leftR16,
  leftQF,
  leftSF,
  center: WC_TREE_DESIGN_W / 2,
  rightSF: mirrorRightAnchor(leftSF),
  rightQF: mirrorRightAnchor(leftQF),
  rightR16: mirrorRightAnchor(leftR16),
  rightR32: mirrorRightAnchor(leftR32),
} as const;

export function wcTreeR32Y(index: number): number {
  return R32_START + index * R32_SPAN;
}

export function wcTreeR16Y(index: number): number {
  const top = wcTreeR32Y(index * 2);
  const bottom = wcTreeR32Y(index * 2 + 1);
  return (top + bottom + WC_TREE_SLOT_H) / 2 - WC_TREE_SLOT_H / 2;
}

export function wcTreeQfY(index: number): number {
  const top = wcTreeR16Y(index * 2);
  const bottom = wcTreeR16Y(index * 2 + 1);
  return (top + bottom + WC_TREE_SLOT_H) / 2 - WC_TREE_SLOT_H / 2;
}

export function wcTreeSfY(): number {
  const top = wcTreeQfY(0);
  const bottom = wcTreeQfY(1);
  return (top + bottom + WC_TREE_SLOT_H) / 2 - WC_TREE_SLOT_H / 2;
}

/** 中央上部（左右 R32 の間） */
export const WC_TREE_PODIUM_WINNER_Y = 34;
export const WC_TREE_PODIUM_TROPHY_Y = 58;
export const WC_TREE_PODIUM_RUNNER_Y = 82;

/** 左列: 左端基準 / 右列: 右端基準 */
export function wcTreeSlotX(side: "left" | "right", col: number): number {
  return side === "left" ? col : col - WC_TREE_SLOT_W;
}

/** スロットから次ラウンドへ出る辺 */
export function wcTreeSlotExitX(side: "left" | "right", col: number): number {
  return side === "left" ? col + WC_TREE_SLOT_W : col - WC_TREE_SLOT_W;
}

/** 次ラウンドスロットへ入る辺 */
export function wcTreeSlotEntryX(side: "left" | "right", col: number): number {
  return side === "left" ? col : col;
}

export function wcTreeSlotCenterY(y: number): number {
  return y + WC_TREE_SLOT_H / 2;
}

/** 接続線の折り返し位置（小さいほど縦線が短い） */
export function wcTreeConnectorMidX(
  side: "left" | "right",
  exitX: number,
  entryX: number
): number {
  return side === "left"
    ? exitX + (entryX - exitX) * 0.42
    : exitX - (exitX - entryX) * 0.42;
}

export function wcTreeCenterBridgeX(side: "left" | "right", sfCol: number): number {
  const exitX = wcTreeSlotExitX(side, sfCol);
  const center = WC_TREE_COL.center;
  return side === "left"
    ? exitX + (center - exitX) * 0.55
    : exitX - (exitX - center) * 0.55;
}
