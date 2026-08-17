/**
 * 起動 Landing / Auth 専用背景。
 * 暗い地平と中央の柱光だけ。方眼・紫オーブは置かない。
 */
import { StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { AUTH_LANDING } from "./authLandingPalette";

export default function AuthLandingBackgroundNative() {
  return (
    <View style={styles.root} pointerEvents="none">
      <LinearGradient
        colors={[AUTH_LANDING.canvas, "#061018", AUTH_LANDING.void]}
        locations={[0, 0.48, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      <LinearGradient
        colors={["transparent", AUTH_LANDING.accentFill, "transparent"]}
        locations={[0.08, 0.5, 0.92]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      <LinearGradient
        colors={[AUTH_LANDING.accentFill, "transparent"]}
        locations={[0, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.42 }}
        style={StyleSheet.absoluteFillObject}
      />

      <LinearGradient
        colors={[
          "rgba(0,0,0,0.42)",
          "transparent",
          "transparent",
          "rgba(0,0,0,0.58)",
        ]}
        locations={[0, 0.2, 0.64, 1]}
        style={StyleSheet.absoluteFillObject}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: AUTH_LANDING.void,
  },
});
