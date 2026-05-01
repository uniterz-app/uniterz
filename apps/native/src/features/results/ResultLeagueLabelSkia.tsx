/**
 * リザルトのリーグ略称（NBA 等）。
 * Skia／半透明 View／グラデ矩形は使わず、Text を 2 枚重ねて周囲だけ自然に光らせる。
 */
import { Platform, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";

const FONT_SIZE = 12;
/** `ResultHomeScreen` / `ResultDetailScreen` の旧 `leagueLabelText` に合わせる */
const LETTER_SPACING = 1.8;

const LEAGUE_LABEL_FONT = Platform.select({
  ios: "Oxanium_800ExtraBold",
  android: "Oxanium_800ExtraBold",
  default: "Oxanium_800ExtraBold",
});

const textBase = {
  fontSize: FONT_SIZE,
  fontWeight: "800" as const,
  letterSpacing: LETTER_SPACING,
  fontFamily: LEAGUE_LABEL_FONT,
  color: "#ffffff",
  backgroundColor: "transparent",
};

type Props = {
  text: string;
  /** 行ボックスに対する外側スタイル（例: `marginTop`） */
  style?: StyleProp<ViewStyle>;
};

export default function ResultLeagueLabelSkia({ text, style }: Props) {
  return (
    <View
      style={[styles.wrapper, style]}
      pointerEvents="none"
      accessibilityRole="text"
      accessibilityLabel={text}
      accessible
    >
      <Text style={styles.glowText} accessible={false} importantForAccessibility="no">
        {text}
      </Text>
      <Text style={styles.mainText} accessible={false} importantForAccessibility="no">
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "relative",
    alignSelf: "flex-start",
    backgroundColor: "transparent",
    overflow: "visible",
  },
  /** 下層：弱い白＋ごく弱い textShadow で周囲だけぼかし（矩形 View は置かない） */
  glowText: {
    ...textBase,
    position: "absolute",
    left: 0,
    top: 0,
    opacity: 0.35,
    textShadowColor: "rgba(255,255,255,0.55)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: Platform.OS === "ios" ? 3 : 2.5,
  },
  /** 上層：くっきり本体。影は最小限 */
  mainText: {
    ...textBase,
    position: "relative",
    zIndex: 1,
    textShadowColor: "rgba(255,255,255,0.15)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: Platform.OS === "ios" ? 0.5 : 0,
  },
});
