/**
 * Web `.predict-overlay-cyber-form` + `PREDICT_OVERLAY_FORM_PANEL` 相当。
 * 塗り・枠なし（背面オーバーレイに乗せる）。
 */
import { type ReactNode } from "react";
import { type StyleProp, StyleSheet, View, type ViewStyle } from "react-native";

type Props = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
};

export default function PredictOverlayCyberFormPanelNative({
  children,
  style,
  contentStyle,
}: Props) {
  return (
    <View style={[styles.root, style]}>
      <View style={[styles.content, contentStyle]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: "100%",
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
});
