/** 週間・月間レポートの DATA SLAB カードシェル（背景格子付き） */
import type { ReactNode } from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";
import { ReportIsometricGridOverlay, ReportSquareGridOverlay } from "./reportGridOverlaysNative";

const CARD_RADIUS = 3;

type ShellProps = {
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
  borderRadius?: number;
};

export function WeeklyReportCardShell({
  style,
  children,
  borderRadius = CARD_RADIUS,
}: ShellProps) {
  return (
    <View style={[{ overflow: "hidden" }, style]}>
      <ReportSquareGridOverlay borderRadius={borderRadius} />
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
