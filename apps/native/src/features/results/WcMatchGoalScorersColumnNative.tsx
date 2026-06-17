import { StyleSheet, Text, View } from "react-native";
import type { PostMatchGoalScorer } from "../../../../../lib/wc/matchGoalScorers";

type Props = {
  scorers: PostMatchGoalScorer[];
  side: "home" | "away";
};

/** チーム名の直下 — そのサイドの得点者を分数順に縦並び（Web `WcMatchGoalScorersColumn` 相当） */
export default function WcMatchGoalScorersColumnNative({ scorers, side }: Props) {
  const rows = scorers.filter((s) => s.side === side);
  if (!rows.length) return null;

  return (
    <View style={styles.col}>
      {rows.map((s, i) => (
        <Text
          key={`${s.label}-${s.minute ?? "x"}-${i}`}
          style={[styles.label, s.ownGoal && styles.labelOg]}
          numberOfLines={1}
        >
          {s.label}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  col: {
    marginTop: 4,
    width: "100%",
    alignItems: "center",
    gap: 2,
  },
  label: {
    maxWidth: "100%",
    fontSize: 10,
    lineHeight: 13,
    fontWeight: "600",
    color: "rgba(255,255,255,0.72)",
    textAlign: "center",
    fontVariant: ["tabular-nums"],
  },
  labelOg: {
    color: "rgba(255,255,255,0.45)",
  },
});
