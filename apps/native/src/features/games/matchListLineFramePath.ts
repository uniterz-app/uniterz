/** Prime 風：上下・左中央が途切れた角丸ストローク */
export function interruptedRoundedRectStrokeD(opts: {
  width: number;
  height: number;
  radius: number;
  inset: number;
  topGap: number;
  bottomGap: number;
  leftGap?: number;
}): string {
  const w = opts.width;
  const h = opts.height;
  if (w <= 0 || h <= 0) return "";

  const inset = Math.max(0.5, opts.inset);
  const left = inset;
  const top = inset;
  const right = w - inset;
  const bottom = h - inset;
  if (right - left < 8 || bottom - top < 8) return "";

  const r = Math.min(
    Math.max(2, opts.radius),
    (right - left) / 2,
    (bottom - top) / 2
  );
  const cx = (left + right) / 2;
  const cy = (top + bottom) / 2;
  const maxHGap = Math.max(8, right - left - 2 * r - 12);
  const maxVGap = Math.max(8, bottom - top - 2 * r - 12);
  const topGap = Math.min(Math.max(opts.topGap, 8), maxHGap);
  const topHalf = topGap / 2;
  const botGap =
    opts.bottomGap <= 0 ? 0 : Math.min(Math.max(opts.bottomGap, 8), maxHGap);
  const botHalf = botGap / 2;
  const leftGap =
    !opts.leftGap || opts.leftGap <= 0
      ? 0
      : Math.min(Math.max(opts.leftGap, 8), maxVGap);
  const leftHalf = leftGap / 2;

  const parts: string[] = [
    `M ${cx + topHalf} ${top}`,
    `H ${right - r}`,
    `A ${r} ${r} 0 0 1 ${right} ${top + r}`,
    `V ${bottom - r}`,
    `A ${r} ${r} 0 0 1 ${right - r} ${bottom}`,
  ];

  if (botGap > 0) {
    parts.push(`H ${cx + botHalf}`);
    parts.push(`M ${cx - botHalf} ${bottom}`);
  }

  parts.push(`H ${left + r}`);
  parts.push(`A ${r} ${r} 0 0 1 ${left} ${bottom - r}`);

  if (leftGap > 0) {
    parts.push(`V ${cy + leftHalf}`);
    parts.push(`M ${left} ${cy - leftHalf}`);
  }

  parts.push(`V ${top + r}`);
  parts.push(`A ${r} ${r} 0 0 1 ${left + r} ${top}`);
  parts.push(`H ${cx - topHalf}`);

  return parts.join(" ");
}
