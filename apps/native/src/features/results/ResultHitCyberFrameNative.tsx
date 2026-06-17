import { StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

/** Web `ResultHitCyberFrame`（一覧は showSweep=false） */
export default function ResultHitCyberFrameNative() {
  return (
    <>
      <View pointerEvents="none" style={styles.frameBorder} />
      <View pointerEvents="none" style={[styles.corner, styles.cornerTL]} />
      <View pointerEvents="none" style={[styles.corner, styles.cornerTR]} />
      <View pointerEvents="none" style={[styles.corner, styles.cornerBL]} />
      <View pointerEvents="none" style={[styles.corner, styles.cornerBR]} />
      <LinearGradient
        pointerEvents="none"
        colors={[
          "rgba(253,224,71,0.92)",
          "rgba(253,224,71,0.55)",
          "transparent",
        ]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.topLine}
      />
      <LinearGradient
        pointerEvents="none"
        colors={[
          "rgba(252,211,77,0.18)",
          "rgba(251,191,36,0.09)",
          "transparent",
        ]}
        locations={[0, 0.42, 0.7]}
        style={styles.topGlow}
      />
    </>
  );
}

const CORNER = "rgba(253,224,71,0.88)";

const styles = StyleSheet.create({
  frameBorder: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 4,
    borderWidth: 1,
    borderColor: "rgba(250,204,21,0.76)",
    shadowColor: "rgba(251,191,36,0.36)",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 11,
  },
  corner: {
    position: "absolute",
    zIndex: 5,
    width: 10,
    height: 10,
  },
  cornerTL: {
    left: 0,
    top: 0,
    borderLeftWidth: 2,
    borderTopWidth: 2,
    borderColor: CORNER,
  },
  cornerTR: {
    right: 0,
    top: 0,
    borderRightWidth: 2,
    borderTopWidth: 2,
    borderColor: CORNER,
  },
  cornerBL: {
    left: 0,
    bottom: 0,
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    borderColor: CORNER,
  },
  cornerBR: {
    right: 0,
    bottom: 0,
    borderRightWidth: 2,
    borderBottomWidth: 2,
    borderColor: CORNER,
  },
  topLine: {
    position: "absolute",
    left: 16,
    right: 16,
    top: 0,
    height: 2,
    zIndex: 3,
  },
  topGlow: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: "42%",
    zIndex: 1,
  },
});
