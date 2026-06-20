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

/** Web `bracketMarketTeamTypography(true)` */
export const SIDE_MENU_LABEL_FONT = {
  fontFamily: "BebasNeue_400Regular",
  letterSpacing: 0.08 * 14,
} as const;

export const SIDE_MENU_SECTION_FONT = {
  fontFamily: "Oxanium_700Bold",
  fontSize: 10,
  fontWeight: "700" as const,
  letterSpacing: 0.24 * 10,
  color: "rgba(255, 255, 255, 0.42)",
  textTransform: "uppercase" as const,
};
