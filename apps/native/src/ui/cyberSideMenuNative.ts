import { Platform, type TextStyle } from "react-native";

/** Web `CYBER_TAB_CYAN` / `lib/ui/cyberSideMenu.ts` 相当 */
export const CYBER_TAB_CYAN = "#00F5FF";

export const CYBER_SIDE_MENU_PANEL = {
  borderColor: "rgba(0, 245, 255, 0.28)",
  /** サイバー HUD（縦方向のベース） */
  backgroundGradient: ["#041018", "#030b12", "#02070e"] as const,
  /**
   * 左→右のフェード（ドロワー背景用）
   * 透明化は途中で下げ止めて「面」を保つ（Web `--edge` と同期）
   */
  backgroundFadeHorizontal: [
    "rgba(4, 16, 24, 0.97)",
    "rgba(3, 12, 19, 0.92)",
    "rgba(2, 8, 15, 0.84)",
  ] as const,
  backgroundFadeHorizontalLocations: [0, 0.48, 1] as const,
  shadowColor: "#00F5FF",
  innerBorderColor: "rgba(0, 245, 255, 0.16)",
  /** 右端の発光エッジライン（縦グラデ） */
  edgeLineColors: [
    "rgba(0, 245, 255, 0.06)",
    "rgba(0, 245, 255, 0.65)",
    "rgba(0, 245, 255, 0.65)",
    "rgba(0, 245, 255, 0.06)",
  ] as const,
  edgeLineLocations: [0, 0.18, 0.78, 1] as const,
};

export const CYBER_SIDE_MENU_ITEM = {
  /** 非選択はトーンを落とし、コントラストを選択行に集める */
  bg: "rgba(4, 20, 30, 0.72)",
  border: "rgba(0, 245, 255, 0.1)",
  borderHover: "rgba(0, 245, 255, 0.4)",
  borderActive: "rgba(0, 245, 255, 0.75)",
  bgActive: "rgba(0, 56, 72, 0.94)",
  iconDefault: "rgba(0, 245, 255, 0.85)",
  dangerBorder: "rgba(251, 113, 133, 0.22)",
  dangerBorderActive: "rgba(251, 113, 133, 0.55)",
  dangerBgActive: "rgba(251, 113, 133, 0.1)",
  dangerIcon: "rgba(251, 180, 188, 0.95)",
};

/** 枝分かれ線 — Web `CYBER_SIDE_MENU_BRANCH` 相当（階層が読めるよう明るめ） */
export const CYBER_SIDE_MENU_BRANCH = "rgba(246, 195, 68, 0.85)";
export const CYBER_SIDE_MENU_BRANCH_GLOW_COLOR = "rgba(246, 195, 68, 0.6)";
/** 枝先ジョイント（◆） */
export const CYBER_SIDE_MENU_BRANCH_JOINT = "rgba(246, 195, 68, 0.9)";

const JP_BOLD = Platform.select({
  ios: "NotoSansJP_700Bold",
  android: "NotoSansJP_700Bold",
  default: "NotoSansJP_700Bold",
})!;

/** Web `bracketMarketTeamTypography(true)` — Latin 専用（Bebas に CJK が無い） */
export const SIDE_MENU_LABEL_FONT = {
  fontFamily: "BebasNeue_400Regular",
  fontWeight: "400" as const,
  letterSpacing: 0.08 * 14,
} as const;

/** 日本語ラベル — Bebas フォールバックの細い字体を避ける */
export const SIDE_MENU_LABEL_FONT_JA = {
  fontFamily: JP_BOLD,
  fontWeight: "700" as const,
  letterSpacing: 0.6,
} as const;

/** 言語に応じたメニュー行ラベル（CJK は `SideMenuItemButtonNative` 側で Noto に差替え） */
export function sideMenuLabelStyle(language: "ja" | "en"): TextStyle {
  if (language === "en") {
    return { ...SIDE_MENU_LABEL_FONT, textTransform: "uppercase" };
  }
  return { ...SIDE_MENU_LABEL_FONT };
}

export const SIDE_MENU_SECTION_FONT = {
  fontFamily: "Oxanium_700Bold",
  fontSize: 10,
  fontWeight: "700" as const,
  letterSpacing: 0.24 * 10,
  color: "rgba(103, 232, 249, 0.75)",
  textTransform: "uppercase" as const,
};

/** セクション見出しの日本語用 */
export const SIDE_MENU_SECTION_FONT_JA = {
  fontFamily: JP_BOLD,
  fontSize: 11,
  fontWeight: "700" as const,
  letterSpacing: 1.2,
  color: "rgba(103, 232, 249, 0.75)",
} as const;
