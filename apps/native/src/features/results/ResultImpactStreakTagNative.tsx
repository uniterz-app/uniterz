/**
 * Web `ResultImpactStreakTag` 相当。リザルトカード左上 連勝タグ（03 塗りピル + 文字 skew）。
 */
import { StyleSheet, Text, View } from "react-native";
import { MATCH_CARD_METRIC_FONT } from "../games/matchCardTypography";
import { streakTagLabel, streakTagTone } from "@/lib/result/streakTagTone";
import { normalizeWinStreak } from "@/lib/ui/normalizeWinStreak";

export default function ResultImpactStreakTagNative({
  winStreak,
}: {
  winStreak: number;
}) {
  const n = normalizeWinStreak(winStreak);
  if (n < 3) return null;
  const tone = streakTagTone(n);
  return (
    <View
      style={[
        styles.box,
        {
          backgroundColor: tone.accent,
          shadowColor: tone.accent,
          shadowOpacity: n >= 5 ? 0.5 : 0,
          elevation: n >= 5 ? 3 : 0,
        },
      ]}
    >
      <View style={styles.skew}>
        <Text style={[styles.text, { color: tone.ink }]}>
          {streakTagLabel(n)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 2,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 8,
  },
  skew: {
    transform: [{ skewX: "-12deg" }],
  },
  text: {
    fontFamily: MATCH_CARD_METRIC_FONT,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.9,
    includeFontPadding: false,
  },
});
