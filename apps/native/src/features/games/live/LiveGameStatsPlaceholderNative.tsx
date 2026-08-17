/** Web `LiveGameStatsPlaceholder` 相当 */
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { METRIC_FONT } from "../../rankings/rankingsUiTheme";

type Props = {
  language?: "ja" | "en";
  loading?: boolean;
};

export default function LiveGameStatsPlaceholderNative({
  language = "ja",
  loading = false,
}: Props) {
  const isJa = language === "ja";
  return (
    <View style={styles.frame}>
      {loading ? <ActivityIndicator color="rgba(0,245,255,0.7)" /> : null}
      <Text style={styles.text}>
        {loading
          ? isJa
            ? "スタッツを読み込み中…"
            : "Loading stats…"
          : isJa
            ? "試合スタッツはまだありません"
            : "Game stats not available yet"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    backgroundColor: "transparent",
    paddingHorizontal: 16,
    paddingVertical: 28,
    alignItems: "center",
    gap: 12,
  },
  text: {
    fontFamily: METRIC_FONT,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.45)",
    textAlign: "center",
  },
});
