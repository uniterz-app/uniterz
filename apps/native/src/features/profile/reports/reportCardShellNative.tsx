/** 週間・月間レポートの DATA SLAB カードシェル（背景格子付き） */
import type { ReactNode } from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";
import { ReportIsometricGridOverlay, ReportSquareGridOverlay } from "./reportGridOverlaysNative";

const CARD_RADIUS = 3;

type ShellProps = {
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
  borderRadius?: number;
  /** true で背景方眼を描画しない（リザルト詳細など） */
  hideGrid?: boolean;
};

export function WeeklyReportCardShell({
  style,
  children,
  borderRadius = CARD_RADIUS,
  hideGrid = false,
}: ShellProps) {
  return (
    <View style={[{ overflow: "hidden" }, style]}>
      {!hideGrid ? (
        <ReportSquareGridOverlay borderRadius={borderRadius} />
      ) : null}
      {children}
    </View>
  );
}

export function MonthlyReportCardShell({
  style,
  children,
  borderRadius = CARD_RADIUS,
}: ShellProps) {
  return (
    <View style={[{ overflow: "hidden" }, style]}>
      <ReportIsometricGridOverlay borderRadius={borderRadius} />
      {children}
    </View>
  );
}
