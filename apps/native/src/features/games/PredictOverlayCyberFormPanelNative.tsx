/**
 * Web `.predict-overlay-cyber-form` + `PREDICT_OVERLAY_FORM_PANEL` 相当。
 */
import { type ReactNode } from "react";
import { type StyleProp, StyleSheet, type ViewStyle } from "react-native";
import PredictOverlayChamferedFrameNative from "./PredictOverlayChamferedFrameNative";

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
    <PredictOverlayChamferedFrameNative
      cut={0}
      gradientColors={["rgba(8,12,20,0.94)", "rgba(5,8,14,0.92)"]}
      gradientLocations={[0, 1]}
      borderColor="rgba(0,245,255,0.16)"
      shadowColor="#000"
      shadowOpacity={0.36}
      shadowRadius={22}
      style={[styles.root, style]}
      contentStyle={[styles.content, contentStyle]}
    >
      {children}
    </PredictOverlayChamferedFrameNative>
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
