/**
 * Web `.predict-overlay-score-input` 相当。
 * 高さ固定 + overflow hidden で Skia 枠と TextInput のずれを防ぐ。
 */
import { useEffect, useRef } from "react";
import {
  Platform,
  StyleSheet,
  TextInput,
  type TextInputProps,
} from "react-native";
import PredictOverlayChamferedFrameNative from "./PredictOverlayChamferedFrameNative";
import { PREDICT_OVERLAY_SCORE_INPUT_CUT } from "./matchListCyberClipPath";
import { MATCH_CARD_DISPLAY_FONT } from "./matchCardTypography";
import {
  registerTutorialPredictScoreSide,
  type TutorialPredictScoreSide,
} from "../tutorial/tutorialPredictScoreBridgeNative";

/** 枠と入力を同一高さに揃える（可変だと Skia onLayout と TextInput がずれる） */
const SCORE_INPUT_H = 44;

type Props = TextInputProps & {
  /** チュートリアルから focus / 値更新するための識別子 */
  tutorialFocusId?: TutorialPredictScoreSide;
};

export default function PredictOverlayScoreInputNative({
  style,
  placeholderTextColor = "rgba(255,255,255,0.35)",
  tutorialFocusId,
  value,
  onChangeText,
  ...props
}: Props) {
  const inputRef = useRef<TextInput>(null);
  const valueRef = useRef(value);
  const onChangeRef = useRef(onChangeText);
  valueRef.current = value;
  onChangeRef.current = onChangeText;

  useEffect(() => {
    if (!tutorialFocusId) return;
    return registerTutorialPredictScoreSide(tutorialFocusId, {
      focus: () => {
        inputRef.current?.focus();
      },
      setValue: (next) => {
        const digits = String(next ?? "")
          .replace(/[^0-9]/g, "")
          .slice(0, 3);
        onChangeRef.current?.(digits);
      },
      getValue: () => String(valueRef.current ?? ""),
    });
  }, [tutorialFocusId]);

  return (
    <PredictOverlayChamferedFrameNative
      cut={PREDICT_OVERLAY_SCORE_INPUT_CUT}
      gradientColors={["#000000", "#000000"]}
      gradientLocations={[0, 1]}
      borderColor="rgba(255,255,255,0.55)"
      shadowColor="#ffffff"
      shadowOpacity={0}
      shadowRadius={0}
      style={styles.root}
      contentStyle={styles.content}
      overflowHidden
    >
      <TextInput
        ref={inputRef}
        {...props}
        value={value}
        onChangeText={(raw) => {
          /** 数字以外を落として canSubmit / winner 導出を壊さない */
          const digits = String(raw ?? "")
            .replace(/[^0-9]/g, "")
            .slice(0, 3);
          onChangeText?.(digits);
        }}
        keyboardType="number-pad"
        placeholderTextColor={placeholderTextColor}
        underlineColorAndroid="transparent"
        style={[styles.input, style]}
      />
    </PredictOverlayChamferedFrameNative>
  );
}

const styles = StyleSheet.create({
  root: {
    width: "100%",
    height: SCORE_INPUT_H,
  },
  content: {
    height: SCORE_INPUT_H,
    justifyContent: "center",
    paddingHorizontal: 14,
    paddingVertical: 0,
    backgroundColor: "#000000",
  },
  input: {
    width: "100%",
    height: SCORE_INPUT_H - 2,
    padding: 0,
    margin: 0,
    borderWidth: 0,
    backgroundColor: "transparent",
    color: "#ffffff",
    /** TOP SCORER / Score prediction 見出しと同型（Bebas + skew） */
    fontFamily: MATCH_CARD_DISPLAY_FONT,
    fontSize: 18,
    lineHeight: Platform.OS === "ios" ? 20 : 22,
    fontWeight: "400",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    textAlign: "left",
    textAlignVertical: "center",
    includeFontPadding: false,
    transform: [{ skewX: "-6deg" }],
  },
});
