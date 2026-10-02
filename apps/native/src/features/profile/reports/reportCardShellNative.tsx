/** 週間・月間レポートの DATA SLAB カードシェル（黒背景・金枠・グリッドなし） */
import type { ReactNode } from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";

const CARD_RADIUS = 3;

type ShellProps = {
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
  borderRadius?: number;
  /** @deprecated グリッドは廃止。互換のため残す */
  hideGrid?: boolean;
};

export function WeeklyReportCardShell({
  style,
  children,
}: ShellProps) {
  return (
    <View style={[{ overflow: "hidden", borderRadius: CARD_RADIUS }, style]}>
      {children}
    </View>
  );
}

export function MonthlyReportCardShell({
  style,
  children,
}: ShellProps) {
  return (
    <View style={[{ overflow: "hidden", borderRadius: CARD_RADIUS }, style]}>
      {children}
    </View>
  );
}
