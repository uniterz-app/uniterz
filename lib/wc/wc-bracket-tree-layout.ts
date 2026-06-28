/**
 * トーナメント表専用レイアウト（FIFA 公式ブラケット準拠）。
 *
 * 公式は左右それぞれが独立した 8 チームの単純トーナメント。
 * カラム順を上から下に明示し、各ノードはフィーダー 2 つの中点に置く。
 *
 *  左サイド（上→下）           右サイド（上→下）
 *  M74 ─┐                              ┌─ M76
 *  M77 ─┴ M89 ─┐                  ┌─ M91 ┴─ M78
 *  M73 ─┐      ├ M97 ─┐      ┌─ M99 ┤      ┌─ M79
 *  M75 ─┴ M90 ─┘      │      │      └─ M92 ┴─ M80
 *                     ├ M101─┤
 *  M83 ─┐      ┌ M98 ─┘  決勝 └─ M100┐      ┌─ M86
 *  M84 ─┴ M93 ─┤  M104(優勝) M102    ├─ M95 ┴─ M88
 *  M81 ─┐      │                     │      ┌─ M85
 *  M82 ─┴ M94 ─┘                  └─ M96 ┴─ M87
 */
import type { WcBracketPredictMatchId } from "@/lib/wc/wc-knockout-bracket";

export const WC_TREE_DESIGN_W = 600;

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

/** R32 スロット（上→下 8 段） */
const R32_START = 8;
const R32_ROW_GAP = 5;
const R32_SPAN = WC_TREE_SLOT_H + R32_ROW_GAP;

function r32SlotTopY(index: number): number {
  return R32_START + index * R32_SPAN;
}

export const WC_TREE_DESIGN_H = r32SlotTopY(7) + WC_TREE_SLOT_H + R32_START;

/** ===== 公式ブラケットのカラム順（上→下） ===== */
export const WC_TREE_LEFT_R32: readonly WcBracketPredictMatchId[] = [
  "M74",
  "M77",
  "M73",
  "M75",
  "M83",
  "M84",
  "M81",
  "M82",
];
export const WC_TREE_RIGHT_R32: readonly WcBracketPredictMatchId[] = [
  "M76",
  "M78",
  "M79",
  "M80",
  "M86",
  "M88",
  "M85",
  "M87",
];
export const WC_TREE_LEFT_R16: readonly WcBracketPredictMatchId[] = [
  "M89",
  "M90",
  "M93",
  "M94",
];
export const WC_TREE_RIGHT_R16: readonly WcBracketPredictMatchId[] = [
  "M91",
  "M92",
  "M95",
  "M96",
];
export const WC_TREE_LEFT_QF: readonly WcBracketPredictMatchId[] = ["M97", "M98"];
export const WC_TREE_RIGHT_QF: readonly WcBracketPredictMatchId[] = [
  "M99",
  "M100",
];
export const WC_TREE_LEFT_SF: WcBracketPredictMatchId = "M101";
export const WC_TREE_RIGHT_SF: WcBracketPredictMatchId = "M102";

/** 上下2国旗の間（R32 ペアの接続線アンカー Y） */
export function wcTreeSlotBetweenFlagsY(y: number): number {
  return y + WC_TREE_FLAG_H + WC_TREE_FLAG_GAP / 2;
}

/** R16 以降 — 単一国旗スロットの中心 Y */
export function wcTreeSingleFlagCenterY(y: number): number {
  return y + WC_TREE_FLAG_H / 2;
}

function singleFlagTopFromCenterY(centerY: number): number {
  return centerY - WC_TREE_FLAG_H / 2;
}

export type WcTreeNodePos = {
  side: "left" | "right";
  col: number;
  y: number;
  /** 接続線が出入りする縦位置 */
  anchorY: number;
};

function colFor(
  side: "left" | "right",
  round: "R32" | "R16" | "QF" | "SF"
): number {
  if (round === "R32") return side === "left" ? WC_TREE_COL.leftR32 : WC_TREE_COL.rightR32;
  if (round === "R16") return side === "left" ? WC_TREE_COL.leftR16 : WC_TREE_COL.rightR16;
  if (round === "QF") return side === "left" ? WC_TREE_COL.leftQF : WC_TREE_COL.rightQF;
  return side === "left" ? WC_TREE_COL.leftSF : WC_TREE_COL.rightSF;
}

/** カラム順から全ノードの座標を構築（フィーダー中点へ収束） */
export function buildWcTreeLayoutPositions(): Record<
  WcBracketPredictMatchId,
  WcTreeNodePos
> {
  const pos = {} as Record<WcBracketPredictMatchId, WcTreeNodePos>;

  const placeSide = (
    side: "left" | "right",
    r32: readonly WcBracketPredictMatchId[],
    r16: readonly WcBracketPredictMatchId[],
    qf: readonly WcBracketPredictMatchId[],
    sf: WcBracketPredictMatchId
  ) => {
    // R32 — 上から 8 段
    r32.forEach((id, i) => {
      const top = r32SlotTopY(i);
      pos[id] = {
        side,
        col: colFor(side, "R32"),
        y: top,
        anchorY: wcTreeSlotBetweenFlagsY(top),
      };
    });

    // R16 — R32 ペア(2i, 2i+1) の中点
    r16.forEach((id, i) => {
      const a = pos[r32[i * 2]];
      const b = pos[r32[i * 2 + 1]];
      const centerY = (a.anchorY + b.anchorY) / 2;
      pos[id] = {
        side,
        col: colFor(side, "R16"),
        y: singleFlagTopFromCenterY(centerY),
        anchorY: centerY,
      };
    });

    // QF — R16 ペアの中点
    qf.forEach((id, i) => {
      const a = pos[r16[i * 2]];
      const b = pos[r16[i * 2 + 1]];
      const centerY = (a.anchorY + b.anchorY) / 2;
      pos[id] = {
        side,
        col: colFor(side, "QF"),
        y: singleFlagTopFromCenterY(centerY),
        anchorY: centerY,
      };
    });

    // SF — QF ペアの中点
    const qa = pos[qf[0]];
    const qb = pos[qf[1]];
    const sfCenterY = (qa.anchorY + qb.anchorY) / 2;
    pos[sf] = {
      side,
      col: colFor(side, "SF"),
      y: singleFlagTopFromCenterY(sfCenterY),
      anchorY: sfCenterY,
    };
  };

  placeSide("left", WC_TREE_LEFT_R32, WC_TREE_LEFT_R16, WC_TREE_LEFT_QF, WC_TREE_LEFT_SF);
  placeSide("right", WC_TREE_RIGHT_R32, WC_TREE_RIGHT_R16, WC_TREE_RIGHT_QF, WC_TREE_RIGHT_SF);

  return pos;
}

/** チャンピオン — 国旗のみ（外枠なし） */
export const WC_TREE_CHAMPION_CARD_W = 134;
export const WC_TREE_CHAMPION_CARD_H = 90;
/** @deprecated 外枠廃止。CARD_W/H と同一 */
export const WC_TREE_CHAMPION_CARD_INNER_W = WC_TREE_CHAMPION_CARD_W;
export const WC_TREE_CHAMPION_CARD_INNER_H = WC_TREE_CHAMPION_CARD_H;
/** 王冠（国旗上にはみ出す高さ） */
export const WC_TREE_CHAMPION_CARD_LABEL_OVERHANG = 28;

/** 全体の縦中央（左右 SF が並ぶ高さ） */
const SF_CENTER_Y = wcTreeSingleFlagCenterY(
  singleFlagTopFromCenterY(
    (wcTreeSlotBetweenFlagsY(r32SlotTopY(0)) +
      wcTreeSlotBetweenFlagsY(r32SlotTopY(7))) /
      2
  )
);

/** 優勝カード上端 Y（縦中央よりやや上に配置） */
export const WC_TREE_PODIUM_CARD_TOP_Y = Math.round(
  SF_CENTER_Y - WC_TREE_CHAMPION_CARD_H / 2 - 96
);

/** スロット左端 X */
export function wcTreeSlotX(_side: "left" | "right", col: number): number {
  return col;
}

/** 内側（決勝側）へ出る接続線の起点 X */
function exitX(side: "left" | "right", col: number): number {
  return side === "left" ? col + WC_TREE_SLOT_W : col;
}

/** 子ノードへ入る接続線の終点 X（外側の辺） */
function entryX(side: "left" | "right", col: number): number {
  return side === "left" ? col : col + WC_TREE_SLOT_W;
}

/** フィーダー 2 つ → 子ノード 1 つ の二股線（同サイド） */
function forkPath(
  feederA: WcTreeNodePos,
  feederB: WcTreeNodePos,
  child: WcTreeNodePos
): string {
  const side = child.side;
  const ex = exitX(side, feederA.col);
  const en = entryX(side, child.col);
  const midX = side === "left" ? (ex + en) / 2 : (ex + en) / 2;
  const childY = child.anchorY;

  return [
    `M ${ex} ${feederA.anchorY} H ${midX} V ${childY} H ${en}`,
    `M ${exitX(side, feederB.col)} ${feederB.anchorY} H ${midX} V ${childY} H ${en}`,
  ].join(" ");
}

/** 配置済み座標から勝ち上がり線 SVG path を生成 */
export function buildWcTreeConnectorPaths(
  pos: Record<WcBracketPredictMatchId, WcTreeNodePos>
): string[] {
  const paths: string[] = [];

  const connect = (
    feeders: readonly WcBracketPredictMatchId[],
    children: readonly WcBracketPredictMatchId[]
  ) => {
    children.forEach((childId, i) => {
      const a = pos[feeders[i * 2]];
      const b = pos[feeders[i * 2 + 1]];
      const child = pos[childId];
      if (!a || !b || !child) return;
      paths.push(forkPath(a, b, child));
    });
  };

  connect(WC_TREE_LEFT_R32, WC_TREE_LEFT_R16);
  connect(WC_TREE_RIGHT_R32, WC_TREE_RIGHT_R16);
  connect(WC_TREE_LEFT_R16, WC_TREE_LEFT_QF);
  connect(WC_TREE_RIGHT_R16, WC_TREE_RIGHT_QF);
  connect(WC_TREE_LEFT_QF, [WC_TREE_LEFT_SF]);
  connect(WC_TREE_RIGHT_QF, [WC_TREE_RIGHT_SF]);

  // 左右 SF → 決勝（中央へ収束）
  const lsf = pos[WC_TREE_LEFT_SF];
  const rsf = pos[WC_TREE_RIGHT_SF];
  if (lsf && rsf) {
    const lEx = exitX("left", lsf.col);
    const rEx = exitX("right", rsf.col);
    const cx = WC_TREE_COL.center;
    paths.push(
      `M ${lEx} ${lsf.anchorY} H ${cx} M ${rEx} ${rsf.anchorY} H ${cx} M ${cx} ${lsf.anchorY} V ${rsf.anchorY}`
    );
  }

  return paths;
}
