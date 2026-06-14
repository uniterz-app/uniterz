/** 角切り・シアン枠のハンバーガーボタン（globals.css `.cyber-menu-btn`） */
export const CYBER_MENU_BTN_CLASS = "cyber-menu-btn";

export type CyberMenuButtonSize = "xs" | "sm" | "md" | "lg";

export const CYBER_MENU_BTN_SIZE_CLASS: Record<CyberMenuButtonSize, string> = {
  xs: "size-6",
  sm: "size-8",
  md: "size-9",
  lg: "size-10",
};

export const CYBER_MENU_ICON_CLASS: Record<CyberMenuButtonSize, string> = {
  xs: "h-2.5 w-2.5",
  sm: "h-4 w-4",
  md: "h-4 w-4",
  lg: "h-5 w-5",
};

export const CYBER_MENU_ICON_STROKE = 2.25;

/** ボタン＋アイコン用のクラス配列 */
export function cyberMenuButtonClasses(
  size: CyberMenuButtonSize = "sm",
  extra = ""
): string {
  return [
    CYBER_MENU_BTN_CLASS,
    "relative flex shrink-0 touch-manipulation items-center justify-center transition-all duration-200 ease-out",
    CYBER_MENU_BTN_SIZE_CLASS[size],
    extra,
  ]
    .filter(Boolean)
    .join(" ");
}
