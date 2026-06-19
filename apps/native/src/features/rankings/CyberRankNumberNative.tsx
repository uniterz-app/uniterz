import { Platform, StyleSheet, Text, View } from "react-native";
import {
  cyberRankNumStyle,
  type CyberRankNumVariant,
} from "../../../../../lib/rankings/cyberRankVisual";
import { RANK_DISPLAY_FONT } from "./rankingsUiTheme";

type Props = {
  rank: number;
  compact?: boolean;
  displayValue?: string;
  muted?: boolean;
  variant?: CyberRankNumVariant;
};

type NativeRankTextStyle = {
  fontSize: number;
  color: string;
  textShadowColor?: string;
  textShadowRadius?: number;
};

/** Web `CyberRankNumber` のネイティブ版 */
export function CyberRankNumberNative({
  rank,
  compact = false,
  displayValue,
  muted = false,
  variant = "list",
}: Props) {
  const label = displayValue ?? String(rank).padStart(2, "0");
  const webStyle: NativeRankTextStyle = muted
    ? {
        fontSize: variant === "tower" ? (compact ? 38 : 48) : compact ? 26 : 34,
        color: "rgba(255,255,255,0.42)",
      }
    : nativeRankStyleFromWeb(rank, compact, variant);

  return (
    <View style={styles.wrap}>
      <Text
        style={[
          styles.num,
          {
            fontSize: webStyle.fontSize,
            color: webStyle.color,
            ...(webStyle.textShadowColor
              ? {
                  textShadowColor: webStyle.textShadowColor,
                  textShadowOffset: { width: 0, height: 0 },
                  textShadowRadius: webStyle.textShadowRadius,
                }
              : {}),
          },
        ]}
        maxFontSizeMultiplier={1.1}
      >
        {label}
      </Text>
    </View>
  );
}

function nativeRankStyleFromWeb(
  rank: number,
  compact: boolean,
  variant: CyberRankNumVariant
): NativeRankTextStyle {
  const web = cyberRankNumStyle(rank, compact, variant);
  const fontSize = parseFloat(String(web.fontSize).replace("rem", "")) * 16;
  const glowMatch = String(web.filter ?? "").match(/rgba?\([^)]+\)/g);
  const textShadowColor = glowMatch?.[0] ?? "rgba(255,214,90,0.5)";

  return {
    fontSize: Number.isFinite(fontSize) ? fontSize : compact ? 28 : 36,
    color: typeof web.color === "string" ? web.color : "#FFFBEB",
    textShadowColor,
    textShadowRadius: rank === 1 ? 14 : rank <= 3 ? 10 : 8,
  };
}

const styles = StyleSheet.create({
  wrap: {
    transform: [{ skewX: "-12deg" }],
  },
  num: {
    fontFamily: RANK_DISPLAY_FONT,
    letterSpacing: 1,
    lineHeight: undefined,
    ...Platform.select({
      ios: { fontWeight: "400" },
      android: { fontWeight: "400" },
      default: {},
    }),
  },
});
