import { StyleSheet, Text, View, type TextStyle } from "react-native";
import { MATCH_CARD_SCORE_FONT } from "../games/matchCardTypography";

type Props = {
  home: number;
  away: number;
  variant?: "predicted" | "final";
  style?: TextStyle;
};

/** Web `MatchScoreLine`（モバイル dense リザルト）相当 */
export default function ResultMatchScoreLineNative({
  home,
  away,
  variant = "predicted",
  style,
}: Props) {
  const base =
    variant === "final" ? styles.final : styles.predicted;
  return (
    <View style={styles.row}>
      <Text style={[base, style]}>{home}</Text>
      <Text style={[base, styles.dash, style]}>–</Text>
      <Text style={[base, style]}>{away}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    flexWrap: "nowrap",
    alignItems: "baseline",
    justifyContent: "center",
    gap: 4,
    maxWidth: "100%",
  },
  predicted: {
    flexShrink: 0,
    fontSize: 16,
    fontWeight: "900",
    color: "rgba(255,255,255,0.85)",
    fontFamily: MATCH_CARD_SCORE_FONT,
    fontVariant: ["tabular-nums"],
    letterSpacing: -0.4,
  },
  final: {
    flexShrink: 0,
    fontSize: 10,
    fontWeight: "700",
    color: "rgba(253,224,71,0.95)",
    fontFamily: MATCH_CARD_SCORE_FONT,
    fontVariant: ["tabular-nums"],
    textShadowColor: "rgba(251,191,36,0.32)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  dash: {
    opacity: 0.7,
  },
});
