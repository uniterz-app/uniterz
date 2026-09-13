/** Web `.cyber-menu-btn` / `.predict-overlay-close-btn` — 直角の四角枠（角切りなし） */
export const CYBER_MENU_BTN_CUT = 0;

export function cyberMenuBtnPathD(
  width: number,
  height: number,
  cut = CYBER_MENU_BTN_CUT
): string {
  const w = Math.max(0, width);
  const h = Math.max(0, height);
  if (w <= 0 || h <= 0) return "";
  const c = Math.min(Math.max(0, cut), w / 2, h / 2);
  if (c <= 0) {
    return [`M 0 0`, `L ${w} 0`, `L ${w} ${h}`, `L 0 ${h}`, "Z"].join(" ");
  }
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
