/** 角切り・紫枠のハンバーガーボタン（globals.css `.cyber-menu-btn`） */
export const CYBER_MENU_BTN_CLASS = "cyber-menu-btn";

/** 試合ヘッダー共通高さ（globals.css `.games-header-control-h`） */
export const GAMES_HEADER_CONTROL_H_CLASS = "games-header-control-h";

export type CyberMenuButtonSize = "xs" | "sm" | "md" | "lg";

/** 角切りボタンのアクション種別 */
export type CyberChamferAction = "menu" | "close" | "edit" | "delete" | "share";

export const CYBER_CHAMFER_ACTION_CLASS: Record<CyberChamferAction, string> = {
  menu: "",
  close: "cyber-menu-btn--close",
  edit: "cyber-menu-btn--edit",
  delete: "cyber-menu-btn--delete",
  share: "",
};

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

/** 角切りボタン共通（バーガー / × / ペン / 共有） */
export function cyberChamferButtonClasses(
  size: CyberMenuButtonSize = "sm",
  action: CyberChamferAction = "menu",
  extra = ""
): string {
  const headerSized = extra.includes(GAMES_HEADER_CONTROL_H_CLASS);
  return [
    CYBER_MENU_BTN_CLASS,
    CYBER_CHAMFER_ACTION_CLASS[action],
    "relative box-border flex shrink-0 touch-manipulation items-center justify-center transition-all duration-200 ease-out",
    headerSized ? "" : CYBER_MENU_BTN_SIZE_CLASS[size],
    extra,
  ]
    .filter(Boolean)
    .join(" ");
}

/** バーガーメニュー専用（プロフィールと同型） */
export function cyberMenuButtonClasses(
  size: CyberMenuButtonSize = "sm",
  extra = ""
): string {
  return cyberChamferButtonClasses(size, "menu", extra);
}

/** 予想オーバーレイ等のコーナー × / ペン */
export function predictOverlayCornerButtonClasses(
  isMobile: boolean,
  action: Exclude<CyberChamferAction, "menu" | "share" | "delete"> = "close"
): string {
  return [
    cyberChamferButtonClasses(isMobile ? "xs" : "sm", action),
    isMobile ? "h-7 w-7" : "h-8 w-8",
  ].join(" ");
}

/** リザルトカード FAB フライアウト（修正 / ゴミ箱） */
export function resultCardFlyoutButtonClasses(
  isMobile: boolean,
  action: Extract<CyberChamferAction, "edit" | "delete">
): string {
  return [
    cyberChamferButtonClasses(isMobile ? "xs" : "sm", action),
    isMobile ? "size-7" : "size-8",
  ].join(" ");
}

/** 予想オーバーレイ MatchCard コーナー（× / ペン）のホットエリア */
export function predictOverlayCornerAnchorClass(
  isMobile: boolean,
  side: "left" | "right"
): string {
  if (side === "left") {
    return isMobile
      ? "-m-3 p-3 left-2 -top-1"
      : "-m-5 p-5 left-2.5 top-1 sm:left-3 sm:top-1.5";
  }
  return isMobile
    ? "-m-3 p-3 right-2 -top-1"
    : "-m-5 p-5 right-2.5 top-1 sm:right-3 sm:top-1.5";
}
