/** Web / Native 共通デザイントークン */

export const colors = {
  bgPrimary: "#090c15",
  surfacePrimary: "#121829",
  surfaceGlass: "rgba(18,24,36,0.52)",
  textPrimary: "#f4f7ff",
  textSecondary: "#9eabc9",
  textMuted: "rgba(226,232,240,0.42)",
  accent: "#7c5cff",
  accentCyan: "#22d3ee",
  accentCyanBright: "#4ff7f4",
  borderSubtle: "rgba(148,163,184,0.14)",
  borderGlass: "rgba(255,255,255,0.06)",
  navBarFillStart: "rgba(18,24,36,0.52)",
  navBarFillEnd: "rgba(10,14,24,0.58)",
  navBarSheenStart: "rgba(79,247,244,0.03)",
  navBarBorder: "rgba(251, 191, 36, 0.48)",
  navBarBorderInner: "rgba(251, 191, 36, 0.28)",
  navBarFrameOuter: "rgba(250, 204, 21, 0.78)",
  navBarFrameAccent: "rgba(253, 224, 71, 0.55)",
  filterBarBg: "rgba(10,17,24,0.72)",
  filterBarBorder: "rgba(148,163,184,0.18)",
  glassCardBg: "rgba(15,23,42,0.55)",
  tabActive: "#ffffff",
  tabInactive: "rgba(226,232,240,0.42)",
  notificationDot: "#22d3ee",
  error: "#f87171",
  success: "#34d399",
} as const;

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
} as const;

export const typography = {
  hero: 32,
  title: 24,
  subtitle: 18,
  body: 16,
  caption: 13,
  micro: 11,
} as const;

export const radius = {
  card: 16,
  chip: 999,
  /** レガシー丸み — ナビは chamfer（14px） */
  tabBar: 0,
  button: 12,
  modal: 20,
} as const;

export const fonts = {
  brand: "BebasNeue_400Regular",
  metric: "Oxanium_700Bold",
  metricExtra: "Oxanium_800ExtraBold",
} as const;

/** cyber filter bar（Web `.cyber-filter-bar` 相当） */
export const cyberFilter = {
  barPaddingH: 14,
  barPaddingV: 10,
  barRadius: 14,
  panelRadius: 16,
  chipGap: 8,
  chipPaddingH: 12,
  chipPaddingV: 6,
} as const;

/** ガラスカード（Web `.cyber-card` 相当） */
export const glassCard = {
  borderWidth: 1,
  borderColor: "rgba(148,163,184,0.14)",
  blurIntensityIos: 38,
  blurIntensityAndroid: 32,
} as const;

/** 下線タブ（Web `UnderlineTabs` 相当） */
export const underlineTabs = {
  height: 44,
  indicatorHeight: 2,
  indicatorColor: colors.accentCyan,
  gap: 0,
} as const;
