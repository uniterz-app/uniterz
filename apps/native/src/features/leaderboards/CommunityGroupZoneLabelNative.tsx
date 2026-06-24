/** TITLE / MEMO / RANKING 等のゾーン見出し */
import { StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { communityMono } from "./communityCrtThemeNative";

export default function CommunityGroupZoneLabelNative({ children }: { children: string }) {
  return (
    <View style={styles.row}>
      <View style={styles.dot} />
      <Text style={styles.label}>{children}</Text>
      <View style={styles.lineWrap}>
        <LinearGradient
          colors={["rgba(34,211,238,0.6)", "rgba(34,211,238,0.24)", "transparent"]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.line}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 1,
    backgroundColor: "rgba(34,211,238,0.85)",
    transform: [{ rotate: "45deg" }],
    shadowColor: "#22d3ee",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 4,
    elevation: 3,
  },
  label: {
    fontFamily: communityMono,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 2.4,
    textTransform: "uppercase",
    color: "rgba(165,243,252,0.58)",
  },
  lineWrap: {
    flex: 1,
    height: 1,
    overflow: "visible",
    shadowColor: "#22d3ee",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 4,
  },
  line: {
    flex: 1,
    height: 1,
  },
});
