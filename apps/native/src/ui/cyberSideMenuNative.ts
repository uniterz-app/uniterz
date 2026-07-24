import { Platform, type TextStyle } from "react-native";

/** Web `CYBER_TAB_CYAN` / `lib/ui/cyberSideMenu.ts` 相当 */
export const CYBER_TAB_CYAN = "#00F5FF";

export const CYBER_SIDE_MENU_PANEL = {
  borderColor: "rgba(0, 245, 255, 0.14)",
  backgroundGradient: [
    "rgba(7, 10, 16, 0.98)",
    "rgba(4, 6, 11, 0.99)",
    "rgba(3, 5, 9, 1)",
  ] as const,
  shadowColor: "#00F5FF",
  innerBorderColor: "rgba(0, 245, 255, 0.1)",
};

export const CYBER_SIDE_MENU_ITEM = {
  bg: "rgba(10, 14, 20, 0.95)",
  border: "rgba(255, 255, 255, 0.1)",
  borderHover: "rgba(0, 245, 255, 0.28)",
  borderActive: "rgba(0, 245, 255, 0.45)",
  bgActive: "rgba(0, 245, 255, 0.07)",
  iconDefault: "rgba(0, 245, 255, 0.78)",
  dangerBorder: "rgba(251, 113, 133, 0.22)",
  dangerBorderActive: "rgba(251, 113, 133, 0.55)",
  dangerBgActive: "rgba(251, 113, 133, 0.1)",
  dangerIcon: "rgba(251, 180, 188, 0.95)",
};

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
  color: "rgba(255, 255, 255, 0.42)",
  textTransform: "uppercase" as const,
};

/** セクション見出しの日本語用 */
export const SIDE_MENU_SECTION_FONT_JA = {
  fontFamily: JP_BOLD,
  fontSize: 11,
  fontWeight: "700" as const,
  letterSpacing: 1.2,
  color: "rgba(255, 255, 255, 0.42)",
} as const;
