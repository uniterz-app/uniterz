/**
 * Web `.predict-overlay-submit-btn` 相当。
 */
import { Pressable, StyleSheet, Text } from "react-native";
import PredictOverlayChamferedFrameNative from "./PredictOverlayChamferedFrameNative";
import { PREDICT_OVERLAY_SUBMIT_BTN_CUT } from "./matchListCyberClipPath";

type Props = {
  label: string;
  disabledLabel?: string;
  enabled: boolean;
  onPress: () => void;
};

export default function PredictOverlaySubmitButtonNative({
  label,
  disabledLabel,
  enabled,
  onPress,
}: Props) {
  return (
    <Pressable
      disabled={!enabled}
      onPress={onPress}
      style={({ pressed }) => [pressed && enabled ? styles.pressed : null]}
    >
      <PredictOverlayChamferedFrameNative
        cut={PREDICT_OVERLAY_SUBMIT_BTN_CUT}
        gradientColors={
          enabled
            ? [
                "rgba(0,245,255,0.26)",
                "rgba(0,190,230,0.36)",
                "rgba(0,110,150,0.46)",
              ]
            : [
                "rgba(148,163,184,0.07)",
                "rgba(71,85,105,0.13)",
                "rgba(51,65,85,0.17)",
              ]
        }
        gradientLocations={[0, 0.42, 1]}
        borderColor={enabled ? "rgba(0,245,255,0.42)" : "rgba(148,163,184,0.2)"}
        shadowColor={enabled ? "#00f5ff" : "#000"}
        shadowOpacity={enabled ? 0.2 : 0.18}
        shadowRadius={enabled ? 22 : 8}
        style={styles.root}
        contentStyle={styles.content}
      >
        <Text style={[styles.label, !enabled && styles.labelDisabled]}>
          {enabled ? label : disabledLabel ?? label}
        </Text>
      </PredictOverlayChamferedFrameNative>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    width: "100%",
  },
  content: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  label: {
    color: "#f0fdff",
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "700",
    letterSpacing: 0.8,
    textShadowColor: "rgba(0,245,255,0.42)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 14,
  },
  labelDisabled: {
    color: "rgba(255,255,255,0.36)",
    textShadowRadius: 0,
  },
  pressed: {
    opacity: 0.96,
    transform: [{ scale: 0.98 }],
  },
});
