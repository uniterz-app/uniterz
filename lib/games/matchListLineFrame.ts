/** 試合一覧・オーバーレイ共通：上下が途切れた直角ストローク */

export const MATCH_LINE_FRAME_BLUE = "#3D9EFF";
export const MATCH_LINE_FRAME_GOLD = "#E8C547";
/** 通常 · 予想済み */
export const MATCH_LINE_FRAME_BLUE_MUTED = "#7D93AE";
/** ピックアップ · 予想済み */
export const MATCH_LINE_FRAME_GOLD_MUTED = "#A68B32";

export function matchLineFramePaint(opts: {
  pickup: boolean;
  predicted: boolean;
}): { color: string; glow: string } {
  if (opts.pickup) {
    return opts.predicted
      ? { color: MATCH_LINE_FRAME_GOLD_MUTED, glow: "rgba(166,139,50,0.24)" }
      : { color: MATCH_LINE_FRAME_GOLD, glow: "rgba(232,197,71,0.28)" };
  }
  return opts.predicted
    ? { color: MATCH_LINE_FRAME_BLUE_MUTED, glow: "rgba(125,147,174,0.22)" }
    : { color: MATCH_LINE_FRAME_BLUE, glow: "rgba(61,158,255,0.32)" };
}

/** 左寄せラウンドラベル時、左辺からギャップ開始までのティック */
export const MATCH_LINE_FRAME_TOP_GAP_START_INSET = 14;
export const MATCH_LINE_FRAME_STROKE = 1.2;
export const MATCH_LINE_FRAME_LABEL_GAP_PAD = 16;
export const MATCH_LINE_FRAME_MIN_RIGHT_TICK = 20;

/** ラベルが上辺ストロークに乗らないよう、ギャップ幅に合わせた最大幅 */
export function matchLineFrameLabelMaxWidth(opts: {
  frameWidth: number;
  align: "center" | "start";
}): number {
  if (opts.frameWidth <= 0) return 0;
  const inset = MATCH_LINE_FRAME_STROKE / 2;
  const inner = opts.frameWidth - inset * 2;
  const pad = MATCH_LINE_FRAME_LABEL_GAP_PAD;
  if (opts.align === "start") {
    const maxStartGap = Math.max(
      8,
      inner -
        MATCH_LINE_FRAME_TOP_GAP_START_INSET -
        MATCH_LINE_FRAME_MIN_RIGHT_TICK
    );
    return Math.max(48, maxStartGap - pad);
  }
  return Math.max(48, Math.max(8, inner - 12) - pad);
}

/** プロフィール概要カード（Result Drop など）— 白パス */
export const PROFILE_OVERVIEW_LINE_FRAME_PAINT = {
  color: "#FFFFFF",
  glow: "rgba(255,255,255,0.2)",
} as const;

/** リザルト outcome の線枠色（HIT / PERFECT / UPSET / MISS） */
export function resultOutcomeLineFramePaint(
  badge: "hit" | "perfect" | "upset" | "miss" | "streak" | null | undefined
): { color: string; glow: string } | undefined {
  if (badge === "hit" || badge === "streak") {
    return { color: "#FBBF24", glow: "rgba(251,191,36,0.38)" };
  }
  if (badge === "perfect") {
    return { color: "#3B82F6", glow: "rgba(59,130,246,0.4)" };
  }
  if (badge === "upset") {
    return { color: "#EF4444", glow: "rgba(239,68,68,0.4)" };
  }
  if (badge === "miss") {
    return { color: "#94A3B8", glow: "rgba(148,163,184,0.28)" };
  }
  return undefined;
}

type FrameStrokeOpts = {
  width: number;
  height: number;
  radius: number;
  inset: number;
  topGap: number;
  bottomGap: number;
  leftGap?: number;
  /** 上辺ギャップ位置。省略時 center（マッチカード） */
  topGapAlign?: "center" | "start";
  /** start 時、左辺からギャップ開始までのティック */
  topGapStartInset?: number;
};

type FrameGeom = {
  left: number;
  top: number;
  right: number;
  bottom: number;
  r: number;
  cx: number;
  cy: number;
  topGapLeft: number;
  topGapRight: number;
  botHalf: number;
  botGap: number;
  leftHalf: number;
  leftGap: number;
};

function frameGeom(opts: FrameStrokeOpts): FrameGeom | null {
  const w = opts.width;
  const h = opts.height;
  if (w <= 0 || h <= 0) return null;

  const inset = Math.max(0.5, opts.inset);
  const left = inset;
  const top = inset;
  const right = w - inset;
  const bottom = h - inset;
  if (right - left < 8 || bottom - top < 8) return null;

  const r = Math.min(
    Math.max(0, opts.radius),
    (right - left) / 2,
    (bottom - top) / 2
  );
  const cx = (left + right) / 2;
  const cy = (top + bottom) / 2;
  const maxHGap = Math.max(8, right - left - 2 * r - 12);
  const maxVGap = Math.max(8, bottom - top - 2 * r - 12);
  const startInset = Math.max(
    6,
    opts.topGapStartInset ?? MATCH_LINE_FRAME_TOP_GAP_START_INSET
  );
  const botGap =
    opts.bottomGap <= 0 ? 0 : Math.min(Math.max(opts.bottomGap, 8), maxHGap);
  const leftGap =
    !opts.leftGap || opts.leftGap <= 0
      ? 0
      : Math.min(Math.max(opts.leftGap, 8), maxVGap);

  let topGap = 0;
  let topGapLeft = cx;
  let topGapRight = cx;
  if (opts.topGap > 0) {
    topGap = Math.min(Math.max(opts.topGap, 8), maxHGap);
    topGapLeft = cx - topGap / 2;
    topGapRight = cx + topGap / 2;
    if (opts.topGapAlign === "start") {
      const minRightTick = MATCH_LINE_FRAME_MIN_RIGHT_TICK;
      const maxStartGap = Math.max(8, right - left - startInset - minRightTick);
      topGap = Math.min(topGap, maxStartGap);
      topGapLeft = left + startInset;
      topGapRight = topGapLeft + topGap;
    }
  }

  return {
    left,
    top,
    right,
    bottom,
    r,
    cx,
    cy,
    topGapLeft,
    topGapRight,
    botHalf: botGap / 2,
    botGap,
    leftHalf: leftGap / 2,
    leftGap,
  };
}

function rightHalfD(g: FrameGeom): string {
  const endX = g.botGap > 0 ? g.cx + g.botHalf : g.cx;
  if (g.r <= 0) {
    return [
      `M ${g.topGapRight} ${g.top}`,
      `H ${g.right}`,
      `V ${g.bottom}`,
      `H ${endX}`,
    ].join(" ");
  }
  return [
    `M ${g.topGapRight} ${g.top}`,
    `H ${g.right - g.r}`,
    `A ${g.r} ${g.r} 0 0 1 ${g.right} ${g.top + g.r}`,
    `V ${g.bottom - g.r}`,
    `A ${g.r} ${g.r} 0 0 1 ${g.right - g.r} ${g.bottom}`,
    `H ${endX}`,
  ].join(" ");
}

function leftHalfD(g: FrameGeom): string {
  const endX = g.botGap > 0 ? g.cx - g.botHalf : g.cx;
  if (g.r <= 0) {
    const parts: string[] = [
      `M ${g.topGapLeft} ${g.top}`,
      `H ${g.left}`,
    ];
    if (g.leftGap > 0) {
      parts.push(`V ${g.cy - g.leftHalf}`);
      parts.push(`M ${g.left} ${g.cy + g.leftHalf}`);
    }
    parts.push(`V ${g.bottom}`);
    parts.push(`H ${endX}`);
    return parts.join(" ");
  }
  const parts: string[] = [
    `M ${g.topGapLeft} ${g.top}`,
    `H ${g.left + g.r}`,
    `A ${g.r} ${g.r} 0 0 0 ${g.left} ${g.top + g.r}`,
  ];
  if (g.leftGap > 0) {
    parts.push(`V ${g.cy - g.leftHalf}`);
    parts.push(`M ${g.left} ${g.cy + g.leftHalf}`);
  }
  parts.push(`V ${g.bottom - g.r}`);
  parts.push(`A ${g.r} ${g.r} 0 0 0 ${g.left + g.r} ${g.bottom}`);
  parts.push(`H ${endX}`);
  return parts.join(" ");
}

/** ラウンドラベル左右から下へ向かう半周パス（同時描画用） */
export function interruptedRoundedRectStrokeHalves(opts: FrameStrokeOpts): {
  left: string;
  right: string;
} | null {
  const g = frameGeom(opts);
  if (!g) return null;
  return { left: leftHalfD(g), right: rightHalfD(g) };
}

export function interruptedRoundedRectStrokeD(opts: FrameStrokeOpts): string {
  const halves = interruptedRoundedRectStrokeHalves(opts);
  if (!halves) return "";
  return `${halves.right} ${halves.left}`;
}
