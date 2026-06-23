/** Web `.cyber-menu-btn` / `.predict-overlay-close-btn`（左上・右下 5px 角切り） */
export const CYBER_MENU_BTN_CUT = 5;

export function cyberMenuBtnPathD(
  width: number,
  height: number,
  cut = CYBER_MENU_BTN_CUT
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
