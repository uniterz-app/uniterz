/**
 * 起動 Landing / Auth 専用背景。
 * グリッドは使わず、奥行きのあるシネマティックな光だけで構成する（軽量・静的）。
 */
import { StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

export default function AuthLandingBackgroundNative() {
  return (
    <View style={styles.root} pointerEvents="none">
      {/* ベース — 上シアン寄り → 下に沈む深紫 */}
      <LinearGradient
        colors={["#04161c", "#061018", "#0a0814", "#03060a"]}
        locations={[0, 0.38, 0.72, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      {/* 左上の柔らかいフィールド光 */}
      <LinearGradient
        colors={[
          "rgba(34,211,238,0.22)",
          "rgba(34,211,238,0.06)",
          "transparent",
        ]}
        locations={[0, 0.42, 1]}
        start={{ x: 0.05, y: 0 }}
        end={{ x: 0.75, y: 0.62 }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* 右下のバイオレット・アンビエント */}
      <LinearGradient
        colors={[
          "transparent",
          "rgba(124,58,237,0.1)",
          "rgba(88,28,135,0.18)",
        ]}
        locations={[0.35, 0.72, 1]}
        start={{ x: 0.2, y: 0.2 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* 中央やや下のホライズン帯 — フィールド感 */}
      <LinearGradient
        colors={[
          "transparent",
          "rgba(45,212,191,0.07)",
          "transparent",
        ]}
        locations={[0.28, 0.52, 0.78]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* 上下ヴィネットでロゴ／CTA を浮かせる */}
      <LinearGradient
        colors={[
          "rgba(0,0,0,0.35)",
          "transparent",
          "transparent",
          "rgba(0,0,0,0.55)",
        ]}
        locations={[0, 0.22, 0.62, 1]}
        style={StyleSheet.absoluteFillObject}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#03060a",
  },
});
