/**
 * Web `.predict-overlay-score-input` 相当。
 */
import { StyleSheet, TextInput, View, type TextInputProps } from "react-native";
import PredictOverlayChamferedFrameNative from "./PredictOverlayChamferedFrameNative";
import { PREDICT_OVERLAY_SCORE_INPUT_CUT } from "./matchListCyberClipPath";
import { MATCH_CARD_SCORE_FONT } from "./matchCardTypography";

type Props = TextInputProps;

export default function PredictOverlayScoreInputNative({
  style,
  placeholderTextColor = "rgba(0,245,255,0.36)",
  ...props
}: Props) {
  return (
    <PredictOverlayChamferedFrameNative
      cut={PREDICT_OVERLAY_SCORE_INPUT_CUT}
      gradientColors={["rgba(5,10,18,0.92)", "rgba(3,7,14,0.96)"]}
      gradientLocations={[0, 1]}
      borderColor="rgba(0,245,255,0.24)"
      shadowColor="#00f5ff"
      shadowOpacity={0.05}
      shadowRadius={12}
      style={styles.root}
      contentStyle={styles.content}
    >
      <View pointerEvents="none" style={styles.insetLeftGlow} />
      <TextInput
        {...props}
        keyboardType="number-pad"
        placeholderTextColor={placeholderTextColor}
        style={[styles.input, style]}
      />
    </PredictOverlayChamferedFrameNative>
  );
}

const styles = StyleSheet.create({
  root: {
    width: "100%",
  },
  content: {
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  insetLeftGlow: {
    position: "absolute",
    left: 0,
    top: 6,
    bottom: 6,
    width: 3,
    backgroundColor: "rgba(0,245,255,0.32)",
    zIndex: 1,
  },
  input: {
    width: "100%",
    minHeight: 28,
    padding: 0,
    margin: 0,
    borderWidth: 0,
    backgroundColor: "transparent",
    color: "#e8fdff",
    fontFamily: MATCH_CARD_SCORE_FONT,
    fontSize: 16,
    lineHeight: 20,
    fontWeight: "900",
    letterSpacing: -0.35,
    textAlign: "left",
    fontVariant: ["tabular-nums"],
  },
});
