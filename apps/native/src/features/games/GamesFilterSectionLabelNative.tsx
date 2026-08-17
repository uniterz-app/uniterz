import { StyleSheet, Text, View } from "react-native";

type Props = {
  children: string;
};

/** Web `.games-filter-section-label` 相当 */
export default function GamesFilterSectionLabelNative({ children }: Props) {
  return (
    <View style={styles.row}>
      <View style={styles.diamond} />
      <Text style={styles.label}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  diamond: {
    width: 5,
    height: 5,
    backgroundColor: "rgba(0,245,255,0.75)",
    transform: [{ rotate: "45deg" }],
    shadowColor: "#00f5ff",
    shadowOpacity: 0.45,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
  label: {
    color: "rgba(148,163,184,0.82)",
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 1.6,
    textTransform: "uppercase",
  },
});
