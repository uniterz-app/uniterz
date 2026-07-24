/**
 * Web 設定背景 `settings-bg-pools`（dual-pool）相当。
 * 左下シアン / 右下バイオレット / 上部シアンの色だまり。
 */
import { StyleSheet, View } from "react-native";
import Svg, { Defs, RadialGradient, Rect, Stop } from "react-native-svg";
import { SETTINGS_POOLS_BG_BASE } from "../../../../../lib/ui/settingsPoolsBackground";

export default function SettingsPoolsBackdropNative() {
  return (
    <View style={styles.root} pointerEvents="none">
      <View style={[StyleSheet.absoluteFill, { backgroundColor: SETTINGS_POOLS_BG_BASE }]} />
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
        <Defs>
          {/* 上部シアン */}
          <RadialGradient
            id="settingsPoolTop"
            cx="50%"
            cy="0%"
            rx="62%"
            ry="32%"
            fx="50%"
            fy="0%"
          >
            <Stop offset="0%" stopColor="rgb(34,211,238)" stopOpacity={0.08} />
            <Stop offset="60%" stopColor="rgb(34,211,238)" stopOpacity={0} />
          </RadialGradient>
          {/* 左下シアン */}
          <RadialGradient
            id="settingsPoolBl"
            cx="12%"
            cy="78%"
            rx="48%"
            ry="38%"
            fx="12%"
            fy="78%"
          >
            <Stop offset="0%" stopColor="rgb(0,245,255)" stopOpacity={0.1} />
            <Stop offset="62%" stopColor="rgb(0,245,255)" stopOpacity={0} />
          </RadialGradient>
          {/* 右下バイオレット */}
          <RadialGradient
            id="settingsPoolBr"
            cx="92%"
            cy="88%"
            rx="52%"
            ry="40%"
            fx="92%"
            fy="88%"
          >
            <Stop offset="0%" stopColor="rgb(167,139,250)" stopOpacity={0.12} />
            <Stop offset="65%" stopColor="rgb(167,139,250)" stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#settingsPoolTop)" />
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#settingsPoolBl)" />
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#settingsPoolBr)" />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
  },
});
