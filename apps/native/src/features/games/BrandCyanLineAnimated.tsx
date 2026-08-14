import { Platform, StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

/** 画面幅いっぱいでも両端が自然に消えるよう肩を長めに */
const BASE_STOPS: [string, string, string, string, string] = [
  "rgba(34,211,246,0)",
  "rgba(34,211,246,0.18)",
  "rgba(34,211,246,0.9)",
  "rgba(34,211,246,0.18)",
  "rgba(34,211,246,0)",
];
const BASE_LOCATIONS: [number, number, number, number, number] = [
  0, 0.12, 0.5, 0.88, 1,
];

/**
 * AuthFormBranding の via-cyan ライン（静的）。
 * 走査・脈打ちアニメは出さない。
 */
export default function BrandCyanLineAnimated() {
  return (
    <View style={styles.shadowWrap} pointerEvents="none">
      <View style={styles.extrude} />
      <View style={styles.lineTrack}>
        <LinearGradient
          colors={BASE_STOPS}
          locations={BASE_LOCATIONS}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFillObject}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shadowWrap: {
    alignSelf: "stretch",
    width: "100%",
    height: 4,
    marginTop: 2,
    borderRadius: 0,
    ...Platform.select({
      ios: {
        shadowColor: "rgba(34,211,238,0.45)",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 1,
        shadowRadius: 8,
      },
      android: { elevation: 4 },
      default: {},
    }),
  },
  extrude: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 2,
    backgroundColor: "#052028",
  },
  lineTrack: {
    zIndex: 1,
    width: "100%",
    height: 2,
    borderRadius: 0,
    overflow: "hidden",
  },
});
