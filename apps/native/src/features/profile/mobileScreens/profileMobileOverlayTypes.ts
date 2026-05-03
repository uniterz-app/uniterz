/**
 * サイドメニューから開く in-app 画面（Web `/mobile/*` に相当）。
 */
export type ProfileMobileOverlayKind =
  | null
  | "badges"
  | "announcements"
  | "plan"
  | "subscribe"
  | "guidelines"
  /** 公開ページのみ WebView（ヘルプ・規約・お問い合わせ） */
  | { webview: string };
