import { Platform, StyleSheet, Text, View } from "react-native";
import { RANKING_TITLE_FONT } from "./rankingsUiTheme";

/** Web `RankingsPageTitleCyber` horizon-chrome の簡易ネイティブ版 */
export function RankingsPageTitleCyberNative({ title }: { title: string }) {
  return (
    <View style={styles.wrap} accessibilityRole="header">
      <Text style={styles.title} maxFontSizeMultiplier={1.2}>
        {title}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 40,
    transform: [{ skewX: "-10deg" }],
  },
  title: {
    fontFamily: RANKING_TITLE_FONT,
    fontSize: 18,
    letterSpacing: 6,
    color: "#BFF8FF",
    ...Platform.select({
      ios: {
        textShadowColor: "rgba(34,211,238,0.28)",
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 6,
      },
      android: {
        textShadowColor: "rgba(34,211,238,0.24)",
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 5,
      },
      default: {},
    }),
  },
});
