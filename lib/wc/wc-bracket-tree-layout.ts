/** トーナメント表専用レイアウト（国旗基準・左右対称） */
export const WC_TREE_DESIGN_W = 600;
export const WC_TREE_DESIGN_H = 780;

export const WC_TREE_FLAG_W = 54;
export const WC_TREE_FLAG_H = 40;
export const WC_TREE_FLAG_GAP = 7;
export const WC_TREE_PODIUM_FLAG_W = 60;
export const WC_TREE_PODIUM_FLAG_H = 45;

/** 1 試合 = 上下 2 国旗 */
export const WC_TREE_SLOT_W = WC_TREE_FLAG_W;
export const WC_TREE_SLOT_H = WC_TREE_FLAG_H * 2 + WC_TREE_FLAG_GAP;

const MARGIN = 4;
const COL_GAP = 16;

const leftR32 = MARGIN;
const leftR16 = leftR32 + WC_TREE_SLOT_W + COL_GAP;
const leftQF = leftR16 + WC_TREE_SLOT_W + COL_GAP;
const leftSF = leftQF + WC_TREE_SLOT_W + COL_GAP;

/** 左端基準で左右対称にミラー（全列共通） */
function mirrorCol(leftCol: number): number {
  return WC_TREE_DESIGN_W - MARGIN - WC_TREE_SLOT_W - (leftCol - MARGIN);
}

export const WC_TREE_COL = {
  leftR32,
  leftR16,
  leftQF,
  leftSF,
  center: WC_TREE_DESIGN_W / 2,
  rightSF: mirrorCol(leftSF),
  rightQF: mirrorCol(leftQF),
  rightR16: mirrorCol(leftR16),
  rightR32: mirrorCol(leftR32),
} as const;

/** R32 行間 = スロット高 + 余白（重なり防止） */
const R32_ROW_GAP = 8;
const R32_SPAN = WC_TREE_SLOT_H + R32_ROW_GAP;
const R32_START = 16;

export function wcTreeR32Y(index: number): number {
  return R32_START + index * R32_SPAN;
}

/** 上下2国旗の間（接続線のアンカー Y） */
export function wcTreeSlotBetweenFlagsY(y: number): number {
  return y + WC_TREE_FLAG_H + WC_TREE_FLAG_GAP / 2;
}

/** スロット上端 Y（between-flags が targetY になる位置） */
export function wcTreeSlotTopFromBetweenFlagsY(targetY: number): number {
  return targetY - WC_TREE_FLAG_H - WC_TREE_FLAG_GAP / 2;
}

/** 2 試合の between-flags 中点に次ラウンドスロットを置く（R32 用・2国旗） */
export function wcTreeMidSlotY(yTop: number, yBottom: number): number {
  const centerY =
    (wcTreeSlotBetweenFlagsY(yTop) + wcTreeSlotBetweenFlagsY(yBottom)) / 2;
  return wcTreeSlotTopFromBetweenFlagsY(centerY);
}

/** R16 以降 — 単一国旗スロットの中心 Y */
export function wcTreeSingleFlagCenterY(y: number): number {
  return y + WC_TREE_FLAG_H / 2;
}

export function wcTreeSingleFlagTopFromCenterY(centerY: number): number {
  return centerY - WC_TREE_FLAG_H / 2;
}

/** 2 スロットの中心の中点に単一国旗を置く（R16+ 用） */
export function wcTreeMidSingleFlagTopY(yTop: number, yBottom: number): number {
  const centerY =
    (wcTreeSingleFlagCenterY(yTop) + wcTreeSingleFlagCenterY(yBottom)) / 2;
  return wcTreeSingleFlagTopFromCenterY(centerY);
}

/** R32 ペアの between-flags 中点に R16 単一国旗を置く */
export function wcTreeMidSingleFromPairSlotsY(
  yTop: number,
  yBottom: number
): number {
  const centerY =
    (wcTreeSlotBetweenFlagsY(yTop) + wcTreeSlotBetweenFlagsY(yBottom)) / 2;
  return wcTreeSingleFlagTopFromCenterY(centerY);
}

export function wcTreeR16Y(index: number): number {
  return wcTreeMidSingleFromPairSlotsY(
    wcTreeR32Y(index * 2),
    wcTreeR32Y(index * 2 + 1)
  );
}

export function wcTreeQfY(index: number): number {
  return wcTreeMidSingleFlagTopY(
    wcTreeR16Y(index * 2),
    wcTreeR16Y(index * 2 + 1)
  );
}

/** SF 列 — 上下 QF の中間（左右 SF を同じ高さに横並び） */
export function wcTreeSfY(): number {
  return wcTreeMidSingleFlagTopY(wcTreeQfY(0), wcTreeQfY(1));
}

export function wcTreeTopSfY(): number {
  return wcTreeSfY();
}

export function wcTreeBottomSfY(): number {
  return wcTreeSfY();
}

/** チャンピオン — 国旗のみ（外枠なし） */
export const WC_TREE_CHAMPION_CARD_W = 134;
export const WC_TREE_CHAMPION_CARD_H = 90;
/** @deprecated 外枠廃止。CARD_W/H と同一 */
export const WC_TREE_CHAMPION_CARD_INNER_W = WC_TREE_CHAMPION_CARD_W;
export const WC_TREE_CHAMPION_CARD_INNER_H = WC_TREE_CHAMPION_CARD_H;
/** HUD タイトル帯（KNOCKOUT STAGE）— ツリー描画の上余白 */
export const WC_TREE_HUD_HEADER_H = 44;

/** 王冠（国旗上にはみ出す高さ） */
export const WC_TREE_CHAMPION_CARD_LABEL_OVERHANG = 28;
/** 国旗ボックス上端 Y（王冠ラベルはこれより上にはみ出す） */
export const WC_TREE_PODIUM_CARD_TOP_Y = 168;
/** SF→決勝の縦線が到達する Y（国旗下端） */
export const WC_TREE_PODIUM_CONNECTOR_Y =
  WC_TREE_PODIUM_CARD_TOP_Y + WC_TREE_CHAMPION_CARD_H;

/** スロット左端 X（全列・左端基準で統一） */
export function wcTreeSlotX(_side: "left" | "right", col: number): number {
  return col;
}

/** 内側（決勝側）へ出る接続線の起点 X */
export function wcTreeSlotExitX(side: "left" | "right", col: number): number {
  return side === "left" ? col + WC_TREE_SLOT_W : col;
}

/** スロット中央 X */
export function wcTreeSlotCenterX(col: number): number {
  return col + WC_TREE_SLOT_W / 2;
}

/** 同側ラウンドから入る接続の外側縦辺 X */
export function wcTreeSlotEntryEdgeX(side: "left" | "right", col: number): number {
  return side === "left" ? col : col + WC_TREE_SLOT_W;
}

/** 反対側から入る接続の内側縦辺 X */
export function wcTreeSlotInnerEdgeX(side: "left" | "right", col: number): number {
  return side === "left" ? col + WC_TREE_SLOT_W : col;
}

/** 接続線の折り返し X */
export function wcTreeConnectorMidX(
  side: "left" | "right",
  exitX: number,
  entryEdgeX: number
): number {
  return side === "left"
    ? exitX + (entryEdgeX - exitX) * 0.45
    : exitX - (exitX - entryEdgeX) * 0.45;
}

export function wcTreeCenterBridgeX(side: "left" | "right", sfCol: number): number {
  const exitX = wcTreeSlotExitX(side, sfCol);
  const center = WC_TREE_COL.center;
  return side === "left"
    ? exitX + (center - exitX) * 0.52
    : exitX - (exitX - center) * 0.52;
}
