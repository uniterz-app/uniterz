import { Platform, type TextStyle, type ViewStyle } from "react-native";
import { METRIC_FONT, RANKING_NAME_FONT_EN } from "../rankings/rankingsUiTheme";

import { PROFILE_CHART_CYBER } from "./profileOverviewChartCyberTheme";

/** Web mobile `text-lg` / 各チャート見出し */
export const profileOverviewChartTitleStyle: TextStyle = {
  color: "rgba(248,250,252,0.96)",
  fontSize: 18,
  fontWeight: "600",
  letterSpacing: 0.5,
  fontFamily: RANKING_NAME_FONT_EN,
};

/** Web `text-[11px]` サブタイトル */
export const profileOverviewChartSubtitleStyle: TextStyle = {
  color: PROFILE_CHART_CYBER.subtitle,
  fontSize: 11,
  lineHeight: 15,
};

/** フッター統計ラベル */
export const profileOverviewChartStatLabelStyle: TextStyle = {
  fontSize: 9,
  fontWeight: "600",
  lineHeight: 12,
};

/** フッター統計値 */
export const profileOverviewChartStatValueStyle: TextStyle = {
  fontSize: 22,
  fontWeight: "700",
  fontVariant: ["tabular-nums"],
  fontFamily: METRIC_FONT,
};

/** 空状態 `NO DATA`（Rank / Streak / Daily シェル共通サイズ） */
export const profileOverviewChartNoDataStyle: TextStyle = {
  fontSize: 22,
  fontWeight: "700",
  letterSpacing: 3,
  color: "rgba(248,250,252,0.35)",
  fontFamily: Platform.select({
    ios: "Oxanium_700Bold",
    android: "Oxanium_700Bold",
    default: "sans-serif",
  }),
};

/** 空状態ヒント文 */
export const profileOverviewChartEmptyHintStyle: TextStyle = {
  marginTop: 10,
  fontSize: 11,
  color: "rgba(248,250,252,0.42)",
  textAlign: "center",
  lineHeight: 14,
};

/** デイリーコンボチャート下部スタッツの枠線色 */
export const PROFILE_OVERVIEW_CHART_FRAME_COLOR = PROFILE_CHART_CYBER.frame;

/** チャート下部スタッツグリッド（Daily Combo 準拠） */
export const profileOverviewChartStatsWrapStyle: ViewStyle = {
  paddingTop: 8,
};

export const profileOverviewChartStatsGridStyle: ViewStyle = {
  flexDirection: "row",
  borderWidth: 1,
  borderColor: PROFILE_CHART_CYBER.frame,
  backgroundColor: "rgba(0, 8, 14, 0.42)",
};

export const profileOverviewChartStatCellStyle: ViewStyle = {
  flex: 1,
  minWidth: 0,
  paddingVertical: 10,
  paddingHorizontal: 6,
};

export const profileOverviewChartStatCellBorderRStyle: ViewStyle = {
  borderRightWidth: 1,
  borderRightColor: PROFILE_CHART_CYBER.frameDim,
};

export const profileOverviewChartStatLabelMutedStyle: TextStyle = {
  ...profileOverviewChartStatLabelStyle,
  color: "rgba(148,163,184,0.78)",
  letterSpacing: 0.6,
  fontFamily: METRIC_FONT,
};

export const profileOverviewChartStatValueMutedStyle: TextStyle = {
  ...profileOverviewChartStatValueStyle,
  color: "rgba(248,250,252,0.96)",
  fontWeight: "600",
  fontFamily: METRIC_FONT,
};

export const profileOverviewChartStatValueRowStyle: ViewStyle = {
  marginTop: 6,
  flexDirection: "row",
  flexWrap: "wrap",
  alignItems: "baseline",
  gap: 4,
};

/** Web `ProfileKinetikPanelFrame` + 内側格子 `opacity-[0.36]` に合わせる */
export const PROFILE_OVERVIEW_CHART_GRID_OPACITY = 0.36;

/** プロフィール Kinetik カードと同系の透明シェル */
export const profileOverviewChartShellStyle: ViewStyle = {
  borderRadius: 4,
  borderWidth: 1,
  borderColor: PROFILE_CHART_CYBER.frame,
  backgroundColor: "rgba(0, 6, 12, 0.28)",
  overflow: "hidden",
  padding: 12,
};

/** ランキングプログレス / Last20 など枠・格子なし */
export const profileOverviewChartPlainStyle: ViewStyle = {
  backgroundColor: "transparent",
  overflow: "hidden",
  padding: 12,
};
