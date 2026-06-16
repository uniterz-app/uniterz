import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../../theme/tokens";

type Props = {
  league: "nba" | "wc";
  onSelectNba: () => void;
  onSelectWorldCup: () => void;
  language: "ja" | "en";
};

/** Web `GamesDrawerMenu` と同等（NBA / World Cup） */
export default function GamesDrawerMenuNative({
  league,
  onSelectNba,
  onSelectWorldCup,
  language,
}: Props) {
  const isJa = language === "ja";

  return (
    <View style={styles.root}>
      <Text style={styles.heading}>{isJa ? "試合" : "Games"}</Text>
      {(
        [
          ["nba", isJa ? "NBA" : "NBA", league === "nba"],
          ["wc", isJa ? "ワールドカップ" : "World Cup", league === "wc"],
        ] as const
      ).map(([id, label, active]) => (
        <Pressable
          key={id}
          style={[styles.item, active && styles.itemActive]}
          onPress={id === "nba" ? onSelectNba : onSelectWorldCup}
        >
          <Text style={[styles.itemLabel, active && styles.itemLabelActive]}>{label}</Text>
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
    borderColor: "rgba(103,232,249,0.35)",
    backgroundColor: "rgba(103,232,249,0.08)",
  },
  itemLabel: { color: colors.textSecondary, fontSize: 15, fontWeight: "600" },
  itemLabelActive: { color: colors.textPrimary },
});
