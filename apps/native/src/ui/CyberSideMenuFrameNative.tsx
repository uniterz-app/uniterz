import { StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

/** Web `CyberSideMenuFrame` — サイバー HUD（四隅ブラケット・右ビームなし） */
export default function CyberSideMenuFrameNative() {
  return (
    <>
      <LinearGradient
        colors={["rgba(0, 245, 255, 0.18)", "transparent"]}
        start={{ x: 0.12, y: 0 }}
        end={{ x: 0.7, y: 0.55 }}
        style={styles.glowTL}
        pointerEvents="none"
      />
      <LinearGradient
        colors={["transparent", "rgba(0, 245, 255, 0.1)"]}
        start={{ x: 0.3, y: 0.4 }}
        end={{ x: 1, y: 1 }}
        style={styles.glowBR}
        pointerEvents="none"
      />
      <View style={styles.scanlines} pointerEvents="none" />
    </>
  );
}

const styles = StyleSheet.create({
  glowTL: {
    ...StyleSheet.absoluteFillObject,
  },
  glowBR: {
    ...StyleSheet.absoluteFillObject,
  },
  scanlines: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(0, 245, 255, 0.06)",
  },
});
