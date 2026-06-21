import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { StyleSheet, View } from "react-native";

type Props = {
  count: number;
};

/** 大会累計ゴール数 — サッカーボール（Native） */
export default function WcTournamentGoalBallStackNative({ count }: Props) {
  if (count <= 0) return null;

  const color = "rgba(255,255,255,0.55)";

  return (
    <View style={styles.root} accessibilityLabel={`${count} tournament goals`}>
      {Array.from({ length: count }, (_, i) => (
        <View key={i} style={styles.ballWrap}>
          <MaterialCommunityIcons name="soccer" size={12} color={color} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 0,
    gap: 2,
  },
  ballWrap: {
    alignItems: "center",
  },
});
