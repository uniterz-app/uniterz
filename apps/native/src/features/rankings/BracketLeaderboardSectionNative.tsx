import { ScrollView, StyleSheet, Text, View } from "react-native";
import { colors, fonts } from "../../theme/tokens";

type Props = { language: "ja" | "en" };

/** BracketLeaderboardSection 相当 */
export default function BracketLeaderboardSectionNative({ language }: Props) {
  const isJa = language === "ja";

  return (
    <View style={styles.root}>
      <Text style={styles.title}>{isJa ? "Bracket リーダーボード" : "Bracket Leaderboard"}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {[1, 2, 3, 4, 5].map((rank) => (
          <View key={rank} style={styles.card}>
            <Text style={styles.rank}>#{rank}</Text>
            <Text style={styles.handle}>@player{rank}</Text>
            <Text style={styles.score}>1280 pts</Text>
          </View>
        ))}
      </ScrollView>
      <Text style={styles.note}>
        {isJa
          ? "ブラケット予想の精度で競うリーダーボード"
          : "Compete on bracket prediction accuracy"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 12, paddingVertical: 8 },
  title: {
    fontFamily: fonts.metric,
    color: colors.textPrimary,
    fontSize: 14,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  row: { gap: 10, paddingVertical: 4 },
  card: {
    width: 140,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.glassCardBg,
  },
  rank: { color: colors.accentCyan, fontWeight: "800", fontSize: 16 },
  handle: { color: colors.textPrimary, marginTop: 4, fontSize: 13 },
  score: { color: colors.textSecondary, marginTop: 2, fontSize: 12 },
  note: { color: colors.textMuted, fontSize: 12 },
});
