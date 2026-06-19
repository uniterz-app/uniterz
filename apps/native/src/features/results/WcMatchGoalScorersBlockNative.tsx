import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { StyleSheet, Text, View } from "react-native";
import type { WcMatchGoalScorerGroupedLine } from "../../../../../lib/wc/matchGoalScorers";

type Props = {
  lines: WcMatchGoalScorerGroupedLine[];
};

/** 試合エリア下 — 得点者一覧（Web `WcMatchGoalScorersBlock` 相当） */
export default function WcMatchGoalScorersBlockNative({ lines }: Props) {
  if (!lines.length) return null;

  const homeLines = lines.filter((l) => l.side === "home");
  const awayLines = lines.filter((l) => l.side === "away");

  return (
    <View style={styles.wrap}>
      <View style={styles.hairline} />
      <View style={styles.grid}>
        <View style={styles.sideCol}>
          {homeLines.map((line) => (
            <Text key={`home-${line.text}`} style={styles.lineHome} numberOfLines={2}>
              {line.text}
            </Text>
          ))}
        </View>
        <View style={styles.ballSlot} pointerEvents="none">
          <MaterialCommunityIcons
            name="soccer"
            size={16}
            color="rgba(255,255,255,0.35)"
          />
        </View>
        <View style={[styles.sideCol, styles.sideColAway]}>
          {awayLines.map((line) => (
            <Text key={`away-${line.text}`} style={styles.lineAway} numberOfLines={2}>
              {line.text}
            </Text>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 8,
  },
  hairline: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  grid: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  sideCol: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  sideColAway: {
    alignItems: "flex-end",
  },
  ballSlot: {
    width: 22,
    alignItems: "center",
    paddingTop: 2,
  },
  lineHome: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "500",
    color: "rgba(255,255,255,0.78)",
    textAlign: "left",
  },
  lineAway: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "500",
    color: "rgba(255,255,255,0.78)",
    textAlign: "right",
  },
});
