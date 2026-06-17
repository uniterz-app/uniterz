import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../../theme/tokens";

type League = "nba" | "wc";

type Props = {
  league: League;
  onChange: (league: League) => void;
  language: "ja" | "en";
};

export default function RankingsDrawerMenuNative({ league, onChange, language }: Props) {
  const isJa = language === "ja";

  return (
    <View style={styles.root}>
      <Text style={styles.heading}>{isJa ? "リーグ" : "League"}</Text>
      {(
        [
          ["nba", "NBA Playoffs"],
          ["wc", "World Cup"],
        ] as const
      ).map(([id, label]) => (
        <Pressable
          key={id}
          style={[styles.item, league === id && styles.itemActive]}
          onPress={() => onChange(id)}
        >
          <Text style={[styles.itemLabel, league === id && styles.itemLabelActive]}>{label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { padding: 16, gap: 8 },
  heading: {
    color: colors.textMuted,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  item: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "transparent",
  },
  itemActive: {
    borderColor: colors.accentCyan,
    backgroundColor: "rgba(34,211,238,0.1)",
  },
  itemLabel: { color: colors.textSecondary, fontSize: 15, fontWeight: "600" },
  itemLabelActive: { color: colors.textPrimary },
});
